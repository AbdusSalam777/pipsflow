import { Trade } from '../models';
import { User } from '../models/User';
import { ITrade } from '../models/Trade';
import { getDayOfWeek, round } from '../utils/trade';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

export class AnalyticsService {
  /**
   * Every branch derives from a fresh Date. The previous version aliased `end`
   * to the same object it then mutated via setHours/setDate, which collapsed
   * the daily and weekly ranges to a zero-width window — those periods always
   * returned no trades.
   */
  private getDateRange(period: string, startDate?: string, endDate?: string): DateRange {
    const now = new Date();
    const end = endDate ? new Date(endDate) : new Date(now);
    let start: Date;

    switch (period) {
      case 'daily':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        break;
      case 'yearly':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'monthly':
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    start.setHours(0, 0, 0, 0);
    if (endDate) end.setHours(23, 59, 59, 999);

    return { startDate: start, endDate: end };
  }

  private async getTradesInRange(userId: string, range: DateRange) {
    return Trade.find({
      userId,
      tradeDate: { $gte: range.startDate, $lte: range.endDate },
    }).sort({ tradeDate: 1 });
  }

  private calculateMetrics(trades: ITrade[]) {
    const totalTrades = trades.length;
    const winners = trades.filter((t) => t.result === 'Profit');
    const losers = trades.filter((t) => t.result === 'Loss');
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const winRate = totalTrades > 0 ? (winners.length / totalTrades) * 100 : 0;
    const avgRR = totalTrades > 0
      ? trades.reduce((sum, t) => sum + t.riskRewardRatio, 0) / totalTrades
      : 0;
    const avgWinner = winners.length > 0
      ? winners.reduce((sum, t) => sum + t.pnl, 0) / winners.length
      : 0;
    const avgLoser = losers.length > 0
      ? Math.abs(losers.reduce((sum, t) => sum + t.pnl, 0) / losers.length)
      : 0;
    const grossProfit = winners.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losers.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    const expectancy = totalTrades > 0 ? totalPnL / totalTrades : 0;
    const largestWin = winners.length > 0 ? Math.max(...winners.map((t) => t.pnl)) : 0;
    const largestLoss = losers.length > 0 ? Math.min(...losers.map((t) => t.pnl)) : 0;

    // R-based view: the same edge expressed in units of risk rather than
    // dollars, so position sizing changes don't distort the picture.
    const rTrades = trades.filter((t) => t.riskAmount > 0);
    const totalR = rTrades.reduce((sum, t) => sum + t.rMultiple, 0);
    const expectancyR = rTrades.length > 0 ? totalR / rTrades.length : 0;
    const totalRiskTaken = rTrades.reduce((sum, t) => sum + t.riskAmount, 0);
    const avgRiskPerTrade = rTrades.length > 0 ? totalRiskTaken / rTrades.length : 0;

    return {
      totalTrades,
      winningTrades: winners.length,
      losingTrades: losers.length,
      winRate: round(winRate),
      totalPnL: round(totalPnL),
      averageRR: round(avgRR),
      averageWinner: round(avgWinner),
      averageLoser: round(avgLoser),
      profitFactor: round(profitFactor),
      expectancy: round(expectancy),
      largestWin: round(largestWin),
      largestLoss: round(largestLoss),
      totalR: round(totalR),
      expectancyR: round(expectancyR),
      avgRiskPerTrade: round(avgRiskPerTrade),
      tradesWithRisk: rTrades.length,
    };
  }

  private calculateStreak(trades: ITrade[]) {
    if (trades.length === 0) return { current: 0, type: 'none' };

    let streak = 0;
    const lastResult = trades[trades.length - 1].result;

    for (let i = trades.length - 1; i >= 0; i--) {
      if (trades[i].result === lastResult) streak++;
      else break;
    }

    return { current: streak, type: lastResult === 'Profit' ? 'win' : 'loss' };
  }

  /** Peak-to-trough decline, in dollars and as a percentage of the peak equity. */
  private calculateDrawdown(trades: ITrade[], startingCapital: number) {
    let equity = startingCapital;
    let peak = startingCapital;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;

    for (const trade of trades) {
      equity += trade.pnl;
      if (equity > peak) peak = equity;
      const drawdown = peak - equity;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;
      }
    }

    const currentDrawdown = peak - equity;

    return {
      maxDrawdown: round(maxDrawdown),
      maxDrawdownPercent: round(maxDrawdownPercent),
      currentDrawdown: round(currentDrawdown),
      currentDrawdownPercent: round(peak > 0 ? (currentDrawdown / peak) * 100 : 0),
    };
  }

  private getPairPerformance(trades: ITrade[]) {
    const pairMap = new Map<string, { pnl: number; count: number; wins: number; r: number }>();

    for (const trade of trades) {
      const existing = pairMap.get(trade.pair) || { pnl: 0, count: 0, wins: 0, r: 0 };
      existing.pnl += trade.pnl;
      existing.count++;
      existing.r += trade.rMultiple;
      if (trade.result === 'Profit') existing.wins++;
      pairMap.set(trade.pair, existing);
    }

    const pairs = Array.from(pairMap.entries()).map(([pair, data]) => ({
      pair,
      pnl: round(data.pnl),
      trades: data.count,
      totalR: round(data.r),
      winRate: round((data.wins / data.count) * 100),
    }));

    const sorted = [...pairs].sort((a, b) => b.pnl - a.pnl);
    return {
      bestPair: sorted[0]?.pair || 'N/A',
      worstPair: sorted.length > 1 ? sorted[sorted.length - 1].pair : 'N/A',
      pairPerformance: pairs,
    };
  }

  async getDashboard(userId: string) {
    const [allTrades, user] = await Promise.all([
      Trade.find({ userId }).sort({ tradeDate: 1 }),
      User.findById(userId).select('startingCapital defaultRiskPercent'),
    ]);

    const startingCapital = user?.startingCapital ?? 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTrades = allTrades.filter((t) => t.tradeDate >= monthStart);

    const metrics = this.calculateMetrics(allTrades);
    const monthMetrics = this.calculateMetrics(monthTrades);
    const drawdown = this.calculateDrawdown(allTrades, startingCapital);

    const accountBalance = round(startingCapital + metrics.totalPnL);
    const returnPercent = startingCapital > 0 ? round((metrics.totalPnL / startingCapital) * 100) : 0;

    return {
      summary: {
        ...metrics,
        currentMonthPnL: monthMetrics.totalPnL,
        currentMonthR: monthMetrics.totalR,
        currentStreak: this.calculateStreak(allTrades),
        ...this.getPairPerformance(allTrades),
        startingCapital,
        accountBalance,
        returnPercent,
        defaultRiskPercent: user?.defaultRiskPercent ?? 1,
        ...drawdown,
      },
      equityCurve: this.buildEquityCurve(allTrades, startingCapital),
      monthlyPnL: this.buildMonthlyPnL(allTrades),
      heatmap: allTrades.map((t) => ({
        id: t._id,
        date: t.tradeDate,
        pnl: t.pnl,
        rMultiple: t.rMultiple,
        result: t.result,
        pair: t.pair,
      })),
      recentTrades: allTrades.slice(-10).reverse().map((t) => ({
        id: t._id,
        pair: t.pair,
        direction: t.direction,
        riskRewardRatio: t.riskRewardRatio,
        rMultiple: t.rMultiple,
        pnl: t.pnl,
        result: t.result,
        date: t.tradeDate,
      })),
    };
  }

  async getPerformance(userId: string, period: string, startDate?: string, endDate?: string) {
    const range = this.getDateRange(period, startDate, endDate);
    const [trades, user] = await Promise.all([
      this.getTradesInRange(userId, range),
      User.findById(userId).select('startingCapital'),
    ]);

    const startingCapital = user?.startingCapital ?? 0;

    return {
      ...this.calculateMetrics(trades),
      ...this.calculateDrawdown(trades, startingCapital),
      ...this.getPairPerformance(trades),
      sessionPerformance: this.groupBySession(trades),
      dayOfWeekPerformance: this.groupByDayOfWeek(trades),
      setupPerformance: this.groupBySetupTag(trades),
      monthlyPerformance: this.buildMonthlyPnL(trades),
      equityCurve: this.buildEquityCurve(trades, startingCapital),
      rDistribution: this.buildRDistribution(trades),
      periodStart: range.startDate,
      periodEnd: range.endDate,
    };
  }

  async getWinRateTrend(userId: string, period: string, startDate?: string, endDate?: string) {
    const range = this.getDateRange(period, startDate, endDate);
    const trades = await this.getTradesInRange(userId, range);

    const grouped = new Map<string, ITrade[]>();
    for (const trade of trades) {
      const key = toDayKey(trade.tradeDate);
      const group = grouped.get(key) || [];
      group.push(trade);
      grouped.set(key, group);
    }

    return Array.from(grouped.entries())
      .map(([date, dayTrades]) => ({
        date,
        winRate: round((dayTrades.filter((t) => t.result === 'Profit').length / dayTrades.length) * 100),
        trades: dayTrades.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getEquityCurve(userId: string) {
    const [trades, user] = await Promise.all([
      Trade.find({ userId }).sort({ tradeDate: 1 }),
      User.findById(userId).select('startingCapital'),
    ]);
    return this.buildEquityCurve(trades, user?.startingCapital ?? 0);
  }

  async getMistakeAnalysis(userId: string) {
    const trades = await Trade.find({ userId });
    const mistakeMap = new Map<string, { count: number; pnl: number; wins: number; r: number }>();

    for (const trade of trades) {
      for (const mistake of trade.mistakes) {
        const existing = mistakeMap.get(mistake) || { count: 0, pnl: 0, wins: 0, r: 0 };
        existing.count++;
        existing.pnl += trade.pnl;
        existing.r += trade.rMultiple;
        if (trade.result === 'Profit') existing.wins++;
        mistakeMap.set(mistake, existing);
      }
    }

    const mistakes = Array.from(mistakeMap.entries()).map(([name, data]) => ({
      name,
      frequency: data.count,
      pnlImpact: round(data.pnl),
      rImpact: round(data.r),
      winRateImpact: round((data.wins / data.count) * 100),
    }));

    return {
      mistakes: [...mistakes].sort((a, b) => b.frequency - a.frequency),
      mostCommon: [...mistakes].sort((a, b) => b.frequency - a.frequency).slice(0, 5),
      worstPerforming: [...mistakes].sort((a, b) => a.pnlImpact - b.pnlImpact).slice(0, 5),
      cleanTradePnL: round(
        trades.filter((t) => t.mistakes.length === 0).reduce((sum, t) => sum + t.pnl, 0)
      ),
      mistakeTradePnL: round(
        trades.filter((t) => t.mistakes.length > 0).reduce((sum, t) => sum + t.pnl, 0)
      ),
    };
  }

  /**
   * Correlates entry-checklist discipline with results. Trades logged before
   * any rules existed (rulesTotal === 0) are excluded — there was nothing to
   * adhere to, so counting them as "broken" would understate discipline.
   */
  async getRuleAdherence(userId: string) {
    const trades = await Trade.find({ userId, rulesTotal: { $gt: 0 } });

    if (trades.length === 0) {
      return {
        hasRules: false,
        avgAdherence: 0,
        fullyFollowed: { trades: 0, pnl: 0, totalR: 0, winRate: 0 },
        someBroken: { trades: 0, pnl: 0, totalR: 0, winRate: 0 },
        trend: [] as { date: string; adherence: number }[],
      };
    }

    const adherenceOf = (t: ITrade) => (t.rulesFollowed.length / t.rulesTotal) * 100;
    const avgAdherence = trades.reduce((sum, t) => sum + adherenceOf(t), 0) / trades.length;

    const fullyFollowedTrades = trades.filter((t) => t.rulesFollowed.length >= t.rulesTotal);
    const someBrokenTrades = trades.filter((t) => t.rulesFollowed.length < t.rulesTotal);

    const summarise = (group: ITrade[]) => ({
      trades: group.length,
      pnl: round(group.reduce((sum, t) => sum + t.pnl, 0)),
      totalR: round(group.reduce((sum, t) => sum + t.rMultiple, 0)),
      winRate: group.length > 0
        ? round((group.filter((t) => t.result === 'Profit').length / group.length) * 100)
        : 0,
    });

    const trend = [...trades]
      .sort((a, b) => a.tradeDate.getTime() - b.tradeDate.getTime())
      .map((t) => ({ date: toDayKey(t.tradeDate), adherence: round(adherenceOf(t)) }));

    return {
      hasRules: true,
      avgAdherence: round(avgAdherence),
      fullyFollowed: summarise(fullyFollowedTrades),
      someBroken: summarise(someBrokenTrades),
      trend,
    };
  }

  async getCalendar(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const trades = await Trade.find({ userId, tradeDate: { $gte: start, $lte: end } });
    const days = new Map<string, { trades: number; pnl: number; r: number; wins: number; ids: string[] }>();

    for (const trade of trades) {
      const key = toDayKey(trade.tradeDate);
      const day = days.get(key) || { trades: 0, pnl: 0, r: 0, wins: 0, ids: [] };
      day.trades++;
      day.pnl += trade.pnl;
      day.r += trade.rMultiple;
      if (trade.result === 'Profit') day.wins++;
      day.ids.push(String(trade._id));
      days.set(key, day);
    }

    return Array.from(days.entries()).map(([date, data]) => ({
      date,
      trades: data.trades,
      pnl: round(data.pnl),
      rMultiple: round(data.r),
      winRate: round((data.wins / data.trades) * 100),
      tradeIds: data.ids,
    }));
  }

  /**
   * Equity starts at the account's starting capital so the curve reads as a
   * real balance, and carries a seed point so a single trade still draws a line.
   */
  private buildEquityCurve(trades: ITrade[], startingCapital: number) {
    let equity = startingCapital;
    let peak = startingCapital;

    const seed = {
      date: trades.length > 0 ? toDayKey(trades[0].tradeDate) : toDayKey(new Date()),
      equity: round(startingCapital),
      pnl: 0,
      drawdown: 0,
    };

    const points = trades.map((t) => {
      equity += t.pnl;
      if (equity > peak) peak = equity;
      return {
        date: toDayKey(t.tradeDate),
        equity: round(equity),
        pnl: round(t.pnl),
        drawdown: round(peak - equity),
      };
    });

    return [seed, ...points];
  }

  private buildMonthlyPnL(trades: ITrade[]) {
    const months = new Map<string, { pnl: number; trades: number }>();
    for (const trade of trades) {
      const d = trade.tradeDate;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = months.get(key) || { pnl: 0, trades: 0 };
      entry.pnl += trade.pnl;
      entry.trades++;
      months.set(key, entry);
    }
    return Array.from(months.entries())
      .map(([month, data]) => ({ month, pnl: round(data.pnl), trades: data.trades }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /** Histogram of results in R, to show the shape of the edge. */
  private buildRDistribution(trades: ITrade[]) {
    const buckets = [
      { label: '< -2R', min: -Infinity, max: -2 },
      { label: '-2R to -1R', min: -2, max: -1 },
      { label: '-1R to 0R', min: -1, max: 0 },
      { label: '0R to 1R', min: 0, max: 1 },
      { label: '1R to 2R', min: 1, max: 2 },
      { label: '2R to 3R', min: 2, max: 3 },
      { label: '> 3R', min: 3, max: Infinity },
    ];

    const withRisk = trades.filter((t) => t.riskAmount > 0);
    return buckets.map((b) => ({
      label: b.label,
      count: withRisk.filter((t) => t.rMultiple >= b.min && t.rMultiple < b.max).length,
    }));
  }

  private groupBySession(trades: ITrade[]) {
    const sessions = ['London', 'New York', 'Asia'] as const;
    return sessions.map((session) => this.summarise(session, 'session', trades.filter((t) => t.session === session)));
  }

  private groupByDayOfWeek(trades: ITrade[]) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map((day) => this.summarise(day, 'day', trades.filter((t) => getDayOfWeek(t.tradeDate) === day)));
  }

  private groupBySetupTag(trades: ITrade[]) {
    const tags = new Set(trades.flatMap((t) => t.tags));
    return Array.from(tags)
      .map((tag) => this.summarise(tag, 'setup', trades.filter((t) => t.tags.includes(tag))))
      .sort((a, b) => b.pnl - a.pnl);
  }

  private summarise(name: string, key: string, group: ITrade[]) {
    const pnl = group.reduce((sum, t) => sum + t.pnl, 0);
    const totalR = group.reduce((sum, t) => sum + t.rMultiple, 0);
    return {
      [key]: name,
      trades: group.length,
      pnl: round(pnl),
      totalR: round(totalR),
      winRate: group.length > 0
        ? round((group.filter((t) => t.result === 'Profit').length / group.length) * 100)
        : 0,
    } as { trades: number; pnl: number; totalR: number; winRate: number } & Record<string, string>;
  }
}

/** Local-date key (YYYY-MM-DD). toISOString would shift days for non-UTC users. */
const toDayKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const analyticsService = new AnalyticsService();
