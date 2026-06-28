import { Trade } from '../models';
import { ITrade } from '../models/Trade';
import { getDayOfWeek } from '../utils/trade';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

export class AnalyticsService {
  private getDateRange(period: string, startDate?: string, endDate?: string): DateRange {
    const now = new Date();
    let start: Date;
    let end = endDate ? new Date(endDate) : now;

    switch (period) {
      case 'daily':
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        start = new Date(now.setDate(now.getDate() - 7));
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

    return { startDate: start, endDate: end };
  }

  private async getTradesInRange(userId: string, range: DateRange) {
    return Trade.find({
      userId,
      createdAt: { $gte: range.startDate, $lte: range.endDate },
    }).sort({ createdAt: 1 });
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

    return {
      totalTrades,
      winningTrades: winners.length,
      losingTrades: losers.length,
      winRate: Math.round(winRate * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100,
      averageRR: Math.round(avgRR * 100) / 100,
      averageWinner: Math.round(avgWinner * 100) / 100,
      averageLoser: Math.round(avgLoser * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      expectancy: Math.round(expectancy * 100) / 100,
      largestWin,
      largestLoss,
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

  private calculateMaxDrawdown(trades: ITrade[]) {
    let peak = 0;
    let maxDrawdown = 0;
    let equity = 0;

    for (const trade of trades) {
      equity += trade.pnl;
      if (equity > peak) peak = equity;
      const drawdown = peak - equity;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    return Math.round(maxDrawdown * 100) / 100;
  }

  private getPairPerformance(trades: ITrade[]) {
    const pairMap = new Map<string, { pnl: number; count: number; wins: number }>();

    for (const trade of trades) {
      const existing = pairMap.get(trade.pair) || { pnl: 0, count: 0, wins: 0 };
      existing.pnl += trade.pnl;
      existing.count++;
      if (trade.result === 'Profit') existing.wins++;
      pairMap.set(trade.pair, existing);
    }

    const pairs = Array.from(pairMap.entries()).map(([pair, data]) => ({
      pair,
      pnl: Math.round(data.pnl * 100) / 100,
      trades: data.count,
      winRate: Math.round((data.wins / data.count) * 10000) / 100,
    }));

    const sorted = [...pairs].sort((a, b) => b.pnl - a.pnl);
    return {
      bestPair: sorted[0]?.pair || 'N/A',
      worstPair: sorted[sorted.length - 1]?.pair || 'N/A',
      pairPerformance: pairs,
    };
  }

  async getDashboard(userId: string) {
    const allTrades = await Trade.find({ userId }).sort({ createdAt: 1 });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTrades = allTrades.filter((t) => t.createdAt >= monthStart);

    const metrics = this.calculateMetrics(allTrades);
    const monthMetrics = this.calculateMetrics(monthTrades);
    const streak = this.calculateStreak(allTrades);
    const pairData = this.getPairPerformance(allTrades);

    const equityCurve = this.buildEquityCurve(allTrades);
    const monthlyPnL = this.buildMonthlyPnL(allTrades);
    const heatmap = allTrades.map((t) => ({
      id: t._id,
      date: t.createdAt,
      pnl: t.pnl,
      result: t.result,
      pair: t.pair,
    }));

    const recentTrades = allTrades.slice(-10).reverse().map((t) => ({
      id: t._id,
      pair: t.pair,
      direction: t.direction,
      riskRewardRatio: t.riskRewardRatio,
      pnl: t.pnl,
      result: t.result,
      date: t.createdAt,
    }));

    return {
      summary: {
        ...metrics,
        currentMonthPnL: monthMetrics.totalPnL,
        currentStreak: streak,
        ...pairData,
      },
      equityCurve,
      monthlyPnL,
      heatmap,
      recentTrades,
    };
  }

  async getPerformance(userId: string, period: string, startDate?: string, endDate?: string) {
    const range = this.getDateRange(period, startDate, endDate);
    const trades = await this.getTradesInRange(userId, range);
    const metrics = this.calculateMetrics(trades);
    const maxDrawdown = this.calculateMaxDrawdown(trades);
    const pairData = this.getPairPerformance(trades);

    const sessionPerformance = this.groupBySession(trades);
    const dayOfWeekPerformance = this.groupByDayOfWeek(trades);
    const monthlyPerformance = this.buildMonthlyPnL(trades);
    const equityCurve = this.buildEquityCurve(trades);

    return {
      ...metrics,
      maxDrawdown,
      ...pairData,
      sessionPerformance,
      dayOfWeekPerformance,
      monthlyPerformance,
      equityCurve,
    };
  }

  async getWinRateTrend(userId: string, period: string, startDate?: string, endDate?: string) {
    const range = this.getDateRange(period, startDate, endDate);
    const trades = await this.getTradesInRange(userId, range);

    const trend: { date: string; winRate: number; trades: number }[] = [];
    const grouped = new Map<string, ITrade[]>();

    for (const trade of trades) {
      const key = trade.createdAt.toISOString().split('T')[0];
      const group = grouped.get(key) || [];
      group.push(trade);
      grouped.set(key, group);
    }

    for (const [date, dayTrades] of grouped) {
      const wins = dayTrades.filter((t) => t.result === 'Profit').length;
      trend.push({
        date,
        winRate: Math.round((wins / dayTrades.length) * 10000) / 100,
        trades: dayTrades.length,
      });
    }

    return trend.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getEquityCurve(userId: string) {
    const trades = await Trade.find({ userId }).sort({ createdAt: 1 });
    return this.buildEquityCurve(trades);
  }

  async getMistakeAnalysis(userId: string) {
    const trades = await Trade.find({ userId });
    const mistakeMap = new Map<string, { count: number; pnl: number; wins: number; total: number }>();

    for (const trade of trades) {
      for (const mistake of trade.mistakes) {
        const existing = mistakeMap.get(mistake) || { count: 0, pnl: 0, wins: 0, total: 0 };
        existing.count++;
        existing.pnl += trade.pnl;
        existing.total++;
        if (trade.result === 'Profit') existing.wins++;
        mistakeMap.set(mistake, existing);
      }
    }

    const mistakes = Array.from(mistakeMap.entries()).map(([name, data]) => ({
      name,
      frequency: data.count,
      pnlImpact: Math.round(data.pnl * 100) / 100,
      winRateImpact: data.total > 0 ? Math.round((data.wins / data.total) * 10000) / 100 : 0,
    }));

    return {
      mistakes: mistakes.sort((a, b) => b.frequency - a.frequency),
      mostCommon: mistakes.sort((a, b) => b.frequency - a.frequency).slice(0, 5),
      worstPerforming: mistakes.sort((a, b) => a.pnlImpact - b.pnlImpact).slice(0, 5),
    };
  }

  async getCalendar(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const trades = await Trade.find({
      userId,
      createdAt: { $gte: start, $lte: end },
    });

    const days = new Map<string, { trades: number; pnl: number; tradeList: typeof trades }>();

    for (const trade of trades) {
      const key = trade.createdAt.toISOString().split('T')[0];
      const day = days.get(key) || { trades: 0, pnl: 0, tradeList: [] };
      day.trades++;
      day.pnl += trade.pnl;
      day.tradeList.push(trade);
      days.set(key, day);
    }

    return Array.from(days.entries()).map(([date, data]) => ({
      date,
      trades: data.trades,
      pnl: Math.round(data.pnl * 100) / 100,
      tradeIds: data.tradeList.map((t) => t._id),
    }));
  }

  private buildEquityCurve(trades: ITrade[]) {
    let equity = 0;
    return trades.map((t) => {
      equity += t.pnl;
      return {
        date: t.createdAt.toISOString().split('T')[0],
        equity: Math.round(equity * 100) / 100,
        pnl: t.pnl,
      };
    });
  }

  private buildMonthlyPnL(trades: ITrade[]) {
    const months = new Map<string, number>();
    for (const trade of trades) {
      const key = `${trade.createdAt.getFullYear()}-${String(trade.createdAt.getMonth() + 1).padStart(2, '0')}`;
      months.set(key, (months.get(key) || 0) + trade.pnl);
    }
    return Array.from(months.entries())
      .map(([month, pnl]) => ({ month, pnl: Math.round(pnl * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private groupBySession(trades: ITrade[]) {
    const sessions = ['London', 'New York', 'Asia'] as const;
    return sessions.map((session) => {
      const sessionTrades = trades.filter((t) => t.session === session);
      const pnl = sessionTrades.reduce((sum, t) => sum + t.pnl, 0);
      return {
        session,
        trades: sessionTrades.length,
        pnl: Math.round(pnl * 100) / 100,
        winRate: sessionTrades.length > 0
          ? Math.round((sessionTrades.filter((t) => t.result === 'Profit').length / sessionTrades.length) * 10000) / 100
          : 0,
      };
    });
  }

  private groupByDayOfWeek(trades: ITrade[]) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map((day) => {
      const dayTrades = trades.filter((t) => getDayOfWeek(t.createdAt) === day);
      const pnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
      return {
        day,
        trades: dayTrades.length,
        pnl: Math.round(pnl * 100) / 100,
        winRate: dayTrades.length > 0
          ? Math.round((dayTrades.filter((t) => t.result === 'Profit').length / dayTrades.length) * 10000) / 100
          : 0,
      };
    });
  }
}

export const analyticsService = new AnalyticsService();
