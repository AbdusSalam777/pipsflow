import mongoose, { Document, Schema, Types } from 'mongoose';
import { GOAL_TYPES } from '../types';

export interface IGoal extends Document {
  userId: Types.ObjectId;
  title: string;
  type: typeof GOAL_TYPES[number];
  target: number;
  current: number;
  unit: string;
  deadline?: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: GOAL_TYPES, required: true },
    target: { type: Number, required: true },
    current: { type: Number, default: 0 },
    unit: { type: String, default: '' },
    deadline: { type: Date },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Goal = mongoose.model<IGoal>('Goal', goalSchema);
