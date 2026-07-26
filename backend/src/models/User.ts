import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  profilePicture?: string;
  role: 'user' | 'admin';
  refreshToken?: string;
  /** Account equity before the first logged trade. Anchors the equity curve. */
  startingCapital: number;
  /** Risk per trade the position sizer defaults to, in percent. */
  defaultRiskPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    refreshToken: {
      type: String,
      default: '',
    },
    startingCapital: {
      type: Number,
      default: 10000,
      min: 0,
    },
    defaultRiskPercent: {
      type: Number,
      default: 1,
      min: 0.01,
      max: 100,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
