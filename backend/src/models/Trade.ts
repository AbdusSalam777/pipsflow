import mongoose, { Document, Schema, Types } from 'mongoose';
import { FOREX_PAIRS, MISTAKE_TYPES, SETUP_TAGS, TradeDirection, TradeResult, TradingSession } from '../types';

export interface ITrade extends Document {
  userId: Types.ObjectId;
  pair: typeof FOREX_PAIRS[number];
  direction: TradeDirection;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  risk: number;
  reward: number;
  riskRewardRatio: number;
  result: TradeResult;
  pnl: number;
  tradeNotes: string;
  psychologyNotes: string;
  tags: string[];
  mistakes: string[];
  session: TradingSession;
  beforeImage?: string;
  afterImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tradeSchema = new Schema<ITrade>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pair: { type: String, enum: FOREX_PAIRS, required: true },
    direction: { type: String, enum: ['Long', 'Short'], required: true },
    entryPrice: { type: Number, required: true },
    stopLoss: { type: Number, required: true },
    takeProfit: { type: Number, required: true },
    lotSize: { type: Number, required: true, min: 0.01 },
    risk: { type: Number, default: 0 },
    reward: { type: Number, default: 0 },
    riskRewardRatio: { type: Number, default: 0 },
    result: { type: String, enum: ['Profit', 'Loss'], required: true },
    pnl: { type: Number, required: true },
    tradeNotes: { type: String, default: '' },
    psychologyNotes: { type: String, default: '' },
    tags: { type: [String], enum: SETUP_TAGS, default: [] },
    mistakes: { type: [String], enum: MISTAKE_TYPES, default: [] },
    session: { type: String, enum: ['London', 'New York', 'Asia'], required: true },
    beforeImage: { type: String, default: '' },
    afterImage: { type: String, default: '' },
  },
  { timestamps: true }
);

tradeSchema.index({ userId: 1, createdAt: -1 });
tradeSchema.index({ userId: 1, pair: 1 });
tradeSchema.index({ userId: 1, result: 1 });

export const Trade = mongoose.model<ITrade>('Trade', tradeSchema);
