import { z } from 'zod';
import { FOREX_PAIRS, MISTAKE_TYPES, SETUP_TAGS } from '../types';

/**
 * Applies to register, reset, and change — not login, where any non-empty
 * string must be accepted so the rules can't be probed.
 *
 * The User model's `minlength: 8` never enforced this: it only ever sees the
 * 60-character bcrypt hash, so a one-character password used to sail through.
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

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
  startingCapital: z.coerce.number().min(0).optional(),
  defaultRiskPercent: z.coerce.number().min(0.01).max(100).optional(),
});

/**
 * Trade payloads arrive as multipart/form-data (screenshots ride along), so
 * every scalar reaches us as a string and arrays arrive JSON-encoded. These
 * helpers normalise that at the validation boundary — the controllers must not
 * have to re-do it.
 */
const jsonArray = <T extends z.ZodTypeAny>(inner: T) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }, z.array(inner));

const setupTags = jsonArray(z.enum(SETUP_TAGS as unknown as [string, ...string[]]));
const mistakeTypes = jsonArray(z.enum(MISTAKE_TYPES as unknown as [string, ...string[]]));
// Free-form, unlike tags/mistakes: rules are the trader's own text, not a fixed enum.
const rulesFollowed = jsonArray(z.string().min(1).max(200));

const tradeShape = {
  pair: z.enum(FOREX_PAIRS as unknown as [string, ...string[]]),
  direction: z.enum(['Long', 'Short']),
  entryPrice: z.coerce.number().positive(),
  stopLoss: z.coerce.number().positive(),
  takeProfit: z.coerce.number().positive(),
  lotSize: z.coerce.number().positive(),
  result: z.enum(['Profit', 'Loss']),
  pnl: z.coerce.number(),
  tradeDate: z.coerce.date().optional(),
  session: z.enum(['London', 'New York', 'Asia']).optional(),
  quoteToUsd: z.coerce.number().positive().optional(),
  tradeNotes: z.string().optional(),
  psychologyNotes: z.string().optional(),
  tags: setupTags.optional(),
  mistakes: mistakeTypes.optional(),
  rulesFollowed: rulesFollowed.optional(),
};

/**
 * A stop on the wrong side of entry silently produced a 0 R:R before — the form
 * showed a ratio the server would never store. Reject it at the edge instead.
 */
const stopIsOnTheCorrectSide = (data: {
  direction: string;
  entryPrice: number;
  stopLoss: number;
}) =>
  data.direction === 'Long' ? data.stopLoss < data.entryPrice : data.stopLoss > data.entryPrice;

export const tradeSchema = z.object(tradeShape).refine(stopIsOnTheCorrectSide, {
  message: 'Stop loss must be below entry for a Long and above entry for a Short',
  path: ['stopLoss'],
});

export const updateTradeSchema = z.object(tradeShape).partial().refine(
  (data) =>
    data.direction === undefined ||
    data.entryPrice === undefined ||
    data.stopLoss === undefined ||
    stopIsOnTheCorrectSide(data as { direction: string; entryPrice: number; stopLoss: number }),
  {
    message: 'Stop loss must be below entry for a Long and above entry for a Short',
    path: ['stopLoss'],
  }
);

export const positionSizeSchema = z.object({
  pair: z.enum(FOREX_PAIRS as unknown as [string, ...string[]]),
  accountBalance: z.coerce.number().positive(),
  riskPercent: z.coerce.number().positive().max(100),
  entryPrice: z.coerce.number().positive(),
  stopLoss: z.coerce.number().positive(),
  quoteToUsd: z.coerce.number().positive().optional(),
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
  sortBy: z
    .enum(['tradeDate', 'createdAt', 'pnl', 'pair', 'riskRewardRatio', 'rMultiple'])
    .default('tradeDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const journalSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  date: z.string().or(z.date()).optional(),
});

export const ruleSchema = z.object({
  title: z.string().min(1, 'Rule text is required').max(200),
  description: z.string().max(1000).optional(),
});

export const updateRuleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const reorderRuleSchema = z.object({
  direction: z.enum(['up', 'down']),
});

export const analyticsQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']).default('monthly'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
