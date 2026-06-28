import { FilterQuery } from 'mongoose';
import { Trade, ITrade } from '../models/Trade';
import { AppError } from '../utils/AppError';
import { calculateRiskReward, getTradingSession } from '../utils/trade';
import { uploadImage, deleteImage } from './cloudinary.service';

interface TradeInput {
  pair: string;
  direction: 'Long' | 'Short';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  result: 'Profit' | 'Loss';
  pnl: number;
  tradeNotes?: string;
  psychologyNotes?: string;
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

export class TradeService {
  async create(userId: string, data: TradeInput, files?: { before?: Express.Multer.File; after?: Express.Multer.File }) {
    const { risk, reward, riskRewardRatio } = calculateRiskReward(
      data.direction,
      data.entryPrice,
      data.stopLoss,
      data.takeProfit
    );

    let beforeImage = '';
    let afterImage = '';

    if (files?.before) {
      const uploaded = await uploadImage(files.before.buffer, 'trades');
      beforeImage = uploaded.url;
    }
    if (files?.after) {
      const uploaded = await uploadImage(files.after.buffer, 'trades');
      afterImage = uploaded.url;
    }

    const trade = await Trade.create({
      userId,
      ...data,
      risk,
      reward,
      riskRewardRatio,
      session: getTradingSession(new Date()),
      beforeImage,
      afterImage,
    });

    return trade;
  }

  async findAll(userId: string, query: TradeQuery) {
    const filter: FilterQuery<ITrade> = { userId };

    if (query.pair) filter.pair = query.pair;
    if (query.result) filter.result = query.result;
    if (query.session) filter.session = query.session;
    if (query.tags) filter.tags = { $in: query.tags.split(',') };
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }
    if (query.search) {
      filter.$or = [
        { pair: { $regex: query.search, $options: 'i' } },
        { tradeNotes: { $regex: query.search, $options: 'i' } },
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

  async update(userId: string, tradeId: string, data: Partial<TradeInput>, files?: { before?: Express.Multer.File; after?: Express.Multer.File }) {
    const trade = await Trade.findOne({ _id: tradeId, userId });
    if (!trade) throw new AppError('Trade not found', 404);

    if (data.direction && data.entryPrice && data.stopLoss && data.takeProfit) {
      const calc = calculateRiskReward(
        data.direction,
        data.entryPrice,
        data.stopLoss,
        data.takeProfit
      );
      Object.assign(data, calc);
    }

    if (files?.before) {
      const uploaded = await uploadImage(files.before.buffer, 'trades');
      trade.beforeImage = uploaded.url;
    }
    if (files?.after) {
      const uploaded = await uploadImage(files.after.buffer, 'trades');
      trade.afterImage = uploaded.url;
    }

    Object.assign(trade, data);
    await trade.save();
    return trade;
  }

  async delete(userId: string, tradeId: string) {
    const trade = await Trade.findOne({ _id: tradeId, userId });
    if (!trade) throw new AppError('Trade not found', 404);

    await trade.deleteOne();
    return { message: 'Trade deleted successfully' };
  }

  async exportTrades(userId: string, format: 'csv' | 'json') {
    const trades = await Trade.find({ userId }).sort({ createdAt: -1 });

    if (format === 'json') return trades;

    const headers = ['Pair', 'Direction', 'Entry', 'SL', 'TP', 'RR', 'Result', 'PnL', 'Session', 'Date'];
    const rows = trades.map((t) => [
      t.pair, t.direction, t.entryPrice, t.stopLoss, t.takeProfit,
      t.riskRewardRatio, t.result, t.pnl, t.session,
      t.createdAt.toISOString().split('T')[0],
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csv;
  }
}

export const tradeService = new TradeService();
