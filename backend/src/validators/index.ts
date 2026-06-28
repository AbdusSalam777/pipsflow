import { z } from 'zod';
import { FOREX_PAIRS, GOAL_TYPES, MISTAKE_TYPES, SETUP_TAGS } from '../types';

const passwordSchema = z
  .string()
  .min(1, 'Password is required');

export const registerSchema = z
  .object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z
  .object({
    username: z.string().optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => data.username || data.email, {
    message: 'Username or email is required',
  });

export const resetPasswordSchema = z
  .object({
    token: z.string(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  email: z.string().email().optional(),
});

export const tradeSchema = z.object({
  pair: z.enum(FOREX_PAIRS as unknown as [string, ...string[]]),
  direction: z.enum(['Long', 'Short']),
  entryPrice: z.number().positive(),
  stopLoss: z.number().positive(),
  takeProfit: z.number().positive(),
  lotSize: z.number().positive(),
  result: z.enum(['Profit', 'Loss']),
  pnl: z.number(),
  tradeNotes: z.string().optional(),
  psychologyNotes: z.string().optional(),
  tags: z.array(z.enum(SETUP_TAGS as unknown as [string, ...string[]])).optional(),
  mistakes: z.array(z.enum(MISTAKE_TYPES as unknown as [string, ...string[]])).optional(),
});

export const tradeQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  pair: z.string().optional(),
  result: z.enum(['Profit', 'Loss']).optional(),
  session: z.enum(['London', 'New York', 'Asia']).optional(),
  tags: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['createdAt', 'pnl', 'pair', 'riskRewardRatio']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const journalSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  date: z.string().or(z.date()).optional(),
});

export const goalSchema = z.object({
  title: z.string().min(1),
  type: z.enum(GOAL_TYPES as unknown as [string, ...string[]]),
  target: z.number().positive(),
  current: z.number().optional(),
  unit: z.string().optional(),
  deadline: z.string().optional(),
});

export const analyticsQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']).default('monthly'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
