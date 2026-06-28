import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  name: string;
  color: string;
  createdAt: Date;
}

const tagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true, unique: true },
    color: { type: String, default: '#3b82f6' },
  },
  { timestamps: true }
);

export const Tag = mongoose.model<ITag>('Tag', tagSchema);
