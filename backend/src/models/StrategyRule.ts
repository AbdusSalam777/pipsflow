import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStrategyRule extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const strategyRuleSchema = new Schema<IStrategyRule>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 1000 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

strategyRuleSchema.index({ userId: 1, order: 1 });

export const StrategyRule = mongoose.model<IStrategyRule>('StrategyRule', strategyRuleSchema);
