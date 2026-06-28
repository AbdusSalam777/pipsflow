import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

export interface TokenPayload extends JwtPayload {
  id: string;
  email: string;
  username: string;
  role: string;
}

export type TradeDirection = 'Long' | 'Short';
export type TradeResult = 'Profit' | 'Loss';
export type TradingSession = 'London' | 'New York' | 'Asia';

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
