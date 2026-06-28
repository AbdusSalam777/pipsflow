import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITradeImage extends Document {
  tradeId: Types.ObjectId;
  userId: Types.ObjectId;
  type: 'before' | 'after';
  url: string;
  publicId: string;
  createdAt: Date;
}

const tradeImageSchema = new Schema<ITradeImage>(
  {
    tradeId: { type: Schema.Types.ObjectId, ref: 'Trade', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['before', 'after'], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { timestamps: true }
);

export const TradeImage = mongoose.model<ITradeImage>('TradeImage', tradeImageSchema);
