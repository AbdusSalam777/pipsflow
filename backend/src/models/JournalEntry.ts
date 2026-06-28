import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IJournalEntry extends Document {
  userId: Types.ObjectId;
  title: string;
  content: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const journalEntrySchema = new Schema<IJournalEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

export const JournalEntry = mongoose.model<IJournalEntry>('JournalEntry', journalEntrySchema);
