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
  /** When the trade was actually taken — distinct from when it was logged. */
  tradeDate: Date;
  /** Dollars at risk if the stop had been hit. Basis for rMultiple. */
  riskAmount: number;
  /** Result expressed in multiples of initial risk. */
  rMultiple: number;
  stopLossPips: number;
  tradeNotes: string;
  psychologyNotes: string;
  tags: string[];
  mistakes: string[];
  /** Titles of the trader's active strategy rules that were followed on entry. */
  rulesFollowed: string[];
  /** How many active rules existed when this trade was saved — the denominator for adherence %. */
  rulesTotal: number;
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
    tradeDate: { type: Date, required: true, default: Date.now, index: true },
    riskAmount: { type: Number, default: 0 },
    rMultiple: { type: Number, default: 0 },
    stopLossPips: { type: Number, default: 0 },
    tradeNotes: { type: String, default: '' },
    psychologyNotes: { type: String, default: '' },
    tags: { type: [String], enum: SETUP_TAGS, default: [] },
    mistakes: { type: [String], enum: MISTAKE_TYPES, default: [] },
    rulesFollowed: { type: [String], default: [] },
    rulesTotal: { type: Number, default: 0 },
    session: { type: String, enum: ['London', 'New York', 'Asia'], required: true },
    beforeImage: { type: String, default: '' },
    afterImage: { type: String, default: '' },
  },
  { timestamps: true }
);

tradeSchema.index({ userId: 1, tradeDate: -1 });
tradeSchema.index({ userId: 1, createdAt: -1 });
tradeSchema.index({ userId: 1, pair: 1 });
tradeSchema.index({ userId: 1, result: 1 });

/** Backfill tradeDate for documents written before the field existed. */
tradeSchema.pre('save', function (next) {
  if (!this.tradeDate) this.tradeDate = this.createdAt ?? new Date();
  next();
});

export const Trade = mongoose.model<ITrade>('Trade', tradeSchema);
