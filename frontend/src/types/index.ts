export const FOREX_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDCHF',
  'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'CADJPY', 'CHFJPY', 'EURAUD',
  'EURNZD', 'EURCAD', 'GBPAUD', 'GBPCAD', 'GBPCHF', 'XAUUSD',
] as const;

export const SETUP_TAGS = [
  'BOS', 'CHoCH', 'Liquidity Sweep', 'Fair Value Gap', 'Order Block',
  'Breakout', 'Reversal', 'Trend Continuation', 'Scalping', 'Swing Trade', 'News Trade',
] as const;

export const MISTAKE_TYPES = [
  'Entered Early', 'Entered Late', 'Moved Stop Loss', 'Closed Early',
  'Revenge Trade', 'Over Leveraged', 'Ignored Rules',
] as const;

export const GOAL_TYPES = [
  'Monthly', 'Weekly', 'Win Rate', 'Profit', 'Trade Count', 'Discipline',
] as const;

export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture: string;
  role: string;
  joinDate: string;
}

export interface Trade {
  _id: string;
  pair: string;
  direction: 'Long' | 'Short';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  risk: number;
  reward: number;
  riskRewardRatio: number;
  result: 'Profit' | 'Loss';
  pnl: number;
  tradeNotes: string;
  psychologyNotes: string;
  tags: string[];
  mistakes: string[];
  session: string;
  beforeImage?: string;
  afterImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  _id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
}

export interface Goal {
  _id: string;
  title: string;
  type: string;
  target: number;
  current: number;
  unit: string;
  deadline?: string;
  isCompleted: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface DashboardData {
  summary: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    currentMonthPnL: number;
    averageRR: number;
    profitFactor: number;
    expectancy: number;
    currentStreak: { current: number; type: string };
    bestPair: string;
    worstPair: string;
  };
  equityCurve: { date: string; equity: number; pnl: number }[];
  monthlyPnL: { month: string; pnl: number }[];
  heatmap: { id: string; date: string; pnl: number; result: string; pair: string }[];
  recentTrades: { id: string; pair: string; direction: string; riskRewardRatio: number; pnl: number; result: string; date: string }[];
}
