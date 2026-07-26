import { FilterQuery, Types } from 'mongoose';
import { Trade, ITrade } from '../models/Trade';
import { User } from '../models/User';
import { strategyRuleService } from './journal.service';
import { AppError } from '../utils/AppError';
import {
  calculateRiskAmount,
  calculatePips,
  calculatePositionSize,
  calculateRMultiple,
  calculateRiskReward,
  getTradingSession,
} from '../utils/trade';
import { uploadImage } from './cloudinary.service';

interface TradeInput {
  pair: string;
  direction: 'Long' | 'Short';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  result: 'Profit' | 'Loss';
  pnl: number;
  tradeDate?: Date;
  session?: 'London' | 'New York' | 'Asia';
  quoteToUsd?: number;
  tradeNotes?: string;
  psychologyNotes?: string;
  rulesFollowed?: string[];
  tags?: string[];
  mistakes?: string[];
}

interface TradeQuery {
  page: number;
  limit: number;
  search?: string;
  pair?: string;
  result?: string;
  session?: string;
  tags?: string;
  startDate?: string;
  endDate?: string;
  sortBy: string;
  sortOrder: string;
}

type TradeFiles = { before?: Express.Multer.File; after?: Express.Multer.File };

export class TradeService {
  /**
   * Everything derivable from the trade's own numbers is computed here rather
   * than trusted from the client: R:R, pips, dollars risked, R-multiple, and
   * the session — which is derived from when the trade was *taken*, not when
   * it was typed in.
   */
  private derive(input: {
    pair: string;
    direction: 'Long' | 'Short';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    lotSize: number;
    pnl: number;
    tradeDate: Date;
    session?: 'London' | 'New York' | 'Asia';
    quoteToUsd?: number;
  }) {
    const { risk, reward, riskRewardRatio } = calculateRiskReward(
      input.direction,
      input.entryPrice,
      input.stopLoss,
      input.takeProfit
    );

    const riskAmount = calculateRiskAmount({
      pair: input.pair,
      entryPrice: input.entryPrice,
      stopLoss: input.stopLoss,
      lotSize: input.lotSize,
      quoteToUsd: input.quoteToUsd,
    });

    return {
      risk,
      reward,
      riskRewardRatio,
      riskAmount,
      rMultiple: calculateRMultiple(input.pnl, riskAmount),
      stopLossPips: calculatePips(input.pair, input.entryPrice, input.stopLoss),
      session: input.session ?? getTradingSession(input.tradeDate),
    };
  }

  private async uploadScreenshots(files?: TradeFiles) {
    const images: { beforeImage?: string; afterImage?: string } = {};
    if (files?.before) images.beforeImage = (await uploadImage(files.before.buffer, 'trades')).url;
    if (files?.after) images.afterImage = (await uploadImage(files.after.buffer, 'trades')).url;
    return images;
  }

  async create(userId: string, data: TradeInput, files?: TradeFiles) {
    const { quoteToUsd, ...rest } = data;
    const tradeDate = data.tradeDate ?? new Date();

    const derived = this.derive({ ...rest, tradeDate, quoteToUsd });
    const [images, rulesTotal] = await Promise.all([
      this.uploadScreenshots(files),
      strategyRuleService.countActive(userId),
    ]);

    return Trade.create({
      userId,
      ...rest,
      tradeDate,
      ...derived,
      rulesTotal,
      beforeImage: images.beforeImage ?? '',
      afterImage: images.afterImage ?? '',
    });
  }

  async findAll(userId: string, query: TradeQuery) {
    const filter: FilterQuery<ITrade> = { userId };

    if (query.pair) filter.pair = query.pair;
    if (query.result) filter.result = query.result;
    if (query.session) filter.session = query.session;
    if (query.tags) filter.tags = { $in: query.tags.split(',') };
    if (query.startDate || query.endDate) {
      filter.tradeDate = {};
      if (query.startDate) filter.tradeDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.tradeDate.$lte = new Date(query.endDate);
    }
    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { pair: { $regex: escaped, $options: 'i' } },
        { tradeNotes: { $regex: escaped, $options: 'i' } },
        { psychologyNotes: { $regex: escaped, $options: 'i' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [trades, total] = await Promise.all([
      Trade.find(filter)
        .sort({ [query.sortBy]: sortOrder })
        .skip(skip)
        .limit(query.limit),
      Trade.countDocuments(filter),
    ]);

    return {
      trades,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  async findById(userId: string, tradeId: string) {
    const trade = await Trade.findOne({ _id: tradeId, userId });
    if (!trade) throw new AppError('Trade not found', 404);
    return trade;
  }

  async update(userId: string, tradeId: string, data: Partial<TradeInput>, files?: TradeFiles) {
    const trade = await Trade.findOne({ _id: tradeId, userId });
    if (!trade) throw new AppError('Trade not found', 404);

    const { quoteToUsd, ...rest } = data;
    Object.assign(trade, rest);

    // Refresh the adherence denominator only when the checklist itself changed —
    // otherwise an unrelated edit (say, correcting the PnL) would silently
    // rewrite history against today's rule count instead of the one at entry.
    if (data.rulesFollowed !== undefined) {
      trade.rulesTotal = await strategyRuleService.countActive(userId);
    }

    // Recompute against the merged document so a partial edit (say, lot size
    // alone) still refreshes every derived field.
    Object.assign(
      trade,
      this.derive({
        pair: trade.pair,
        direction: trade.direction,
        entryPrice: trade.entryPrice,
        stopLoss: trade.stopLoss,
        takeProfit: trade.takeProfit,
        lotSize: trade.lotSize,
        pnl: trade.pnl,
        tradeDate: trade.tradeDate,
        session: data.session,
        quoteToUsd,
      })
    );

    const images = await this.uploadScreenshots(files);
    if (images.beforeImage) trade.beforeImage = images.beforeImage;
    if (images.afterImage) trade.afterImage = images.afterImage;

    await trade.save();
    return trade;
  }

  async delete(userId: string, tradeId: string) {
    const trade = await Trade.findOne({ _id: tradeId, userId });
    if (!trade) throw new AppError('Trade not found', 404);

    await trade.deleteOne();
    return { message: 'Trade deleted successfully' };
  }

  /** Sizes a hypothetical position against the user's stored account settings. */
  async getPositionSize(
    userId: string,
    params: {
      pair: string;
      accountBalance?: number;
      riskPercent?: number;
      entryPrice: number;
      stopLoss: number;
      quoteToUsd?: number;
    }
  ) {
    const user = await User.findById(userId).select('startingCapital defaultRiskPercent');
    if (!user) throw new AppError('User not found', 404);

    const accountBalance = params.accountBalance ?? (await this.getAccountBalance(userId));
    const riskPercent = params.riskPercent ?? user.defaultRiskPercent;

    return calculatePositionSize({ ...params, accountBalance, riskPercent });
  }

  /** Starting capital plus realised PnL. */
  async getAccountBalance(userId: string): Promise<number> {
    const [user, [totals]] = await Promise.all([
      User.findById(userId).select('startingCapital'),
      Trade.aggregate<{ pnl: number }>([
        { $match: { userId: new Types.ObjectId(userId) } },
        { $group: { _id: null, pnl: { $sum: '$pnl' } } },
      ]),
    ]);

    return (user?.startingCapital ?? 0) + (totals?.pnl ?? 0);
  }

  async exportTrades(userId: string, format: 'csv' | 'json') {
    const trades = await Trade.find({ userId }).sort({ tradeDate: -1 });

    if (format === 'json') return trades;

    const headers = [
      'Date', 'Pair', 'Direction', 'Entry', 'Stop Loss', 'Take Profit', 'Lot Size',
      'SL Pips', 'Planned RR', 'Result', 'PnL', 'Risk $', 'R Multiple', 'Session',
      'Tags', 'Mistakes', 'Trade Notes', 'Psychology Notes',
    ];

    const rows = trades.map((t) => [
      t.tradeDate.toISOString(),
      t.pair, t.direction, t.entryPrice, t.stopLoss, t.takeProfit, t.lotSize,
      t.stopLossPips, t.riskRewardRatio, t.result, t.pnl, t.riskAmount, t.rMultiple, t.session,
      t.tags.join('; '), t.mistakes.join('; '), t.tradeNotes, t.psychologyNotes,
    ]);

    return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  }
}

/** Quote any cell containing a delimiter, quote, or newline; double inner quotes. */
const csvCell = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const tradeService = new TradeService();
