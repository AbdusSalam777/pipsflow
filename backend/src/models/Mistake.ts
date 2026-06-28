import mongoose, { Document, Schema } from 'mongoose';
import { MISTAKE_TYPES } from '../types';

export interface IMistake extends Document {
  name: typeof MISTAKE_TYPES[number];
  description: string;
  createdAt: Date;
}

const mistakeSchema = new Schema<IMistake>(
  {
    name: { type: String, enum: MISTAKE_TYPES, required: true, unique: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Mistake = mongoose.model<IMistake>('Mistake', mistakeSchema);
