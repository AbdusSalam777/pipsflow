import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { User, Trade, JournalEntry, StrategyRule } from '../models';
import { FOREX_PAIRS, SETUP_TAGS, MISTAKE_TYPES } from '../types';
import {
  calculatePips,
  calculatePositionSize,
  calculateRMultiple,
  calculateRiskAmount,
  calculateRiskReward,
  getPipSize,
  getTradingSession,
  round,
} from '../utils/trade';

const STARTING_CAPITAL = 10000;
const RISK_PERCENT = 1;

/** Plausible mid-market prices so pip maths and lot sizes come out realistic. */
const BASE_PRICES: Record<string, number> = {
  EURUSD: 1.085, GBPUSD: 1.27, USDJPY: 149.5, AUDUSD: 0.655,
  NZDUSD: 0.6, USDCAD: 1.36, USDCHF: 0.885, EURGBP: 0.855,
};

const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];
const between = (min: number, max: number) => min + Math.random() * (max - min);

const STRATEGY_RULES = [
  { title: 'HTF trend aligned', description: 'Daily and 4H both point the same direction as the trade.' },
  { title: 'Liquidity swept before entry', description: 'Price took out a prior high/low before reversing.' },
  { title: 'Clear structure break', description: 'A confirmed BOS or CHoCH on the entry timeframe.' },
  { title: 'Risk at or under 1%', description: 'Position size keeps this trade’s risk within the plan.' },
  { title: 'No news in the next 30 min', description: 'Checked the calendar for high-impact releases.' },
];

const seed = async () => {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB for seeding');

  await Promise.all([
    User.deleteMany({}),
    Trade.deleteMany({}),
    JournalEntry.deleteMany({}),
    StrategyRule.deleteMany({}),
  ]);

  const hashedPassword = await bcrypt.hash('Password123!', 12);
  const user = await User.create({
    username: 'demo_trader',
    email: 'demo@pipsflow.com',
    password: hashedPassword,
    profilePicture: '',
    startingCapital: STARTING_CAPITAL,
    defaultRiskPercent: RISK_PERCENT,
  });

  console.log('Created demo user: demo@pipsflow.com / Password123!');

  const rules = await StrategyRule.insertMany(
    STRATEGY_RULES.map((rule, order) => ({ userId: user._id, ...rule, order }))
  );
  const ruleTitles = rules.map((r) => r.title);
  console.log(`Created ${rules.length} strategy rules`);

  const pairs = Object.keys(BASE_PRICES).concat('XAUUSD');
  const trades = [];
  let balance = STARTING_CAPITAL;

  for (let i = 0; i < 60; i++) {
    const pair = pick(pairs);
    const direction = pick(['Long', 'Short'] as const);
    const pipSize = getPipSize(pair);

    // Drift the price a little per trade so the book isn't all one level.
    const base = pair === 'XAUUSD' ? 2350 : BASE_PRICES[pair];
    const entryPrice = round(base * between(0.98, 1.02), pair.endsWith('JPY') || pair === 'XAUUSD' ? 2 : 5);

    const stopPips = Math.round(between(15, 60));
    const plannedRR = round(between(1.5, 3), 2);
    const sign = direction === 'Long' ? 1 : -1;
    const stopLoss = round(entryPrice - sign * stopPips * pipSize, 5);
    const takeProfit = round(entryPrice + sign * stopPips * plannedRR * pipSize, 5);

    const { risk, reward, riskRewardRatio } = calculateRiskReward(direction, entryPrice, stopLoss, takeProfit);

    // Size the position to risk RISK_PERCENT of the running balance, exactly as
    // the app's calculator would, so R-multiples come out meaningful.
    const { lots } = calculatePositionSize({
      pair, accountBalance: balance, riskPercent: RISK_PERCENT, entryPrice, stopLoss,
    });
    const lotSize = Math.max(lots, 0.01);
    const riskAmount = calculateRiskAmount({ pair, entryPrice, stopLoss, lotSize });

    // ~55% win rate; winners land somewhere between half target and full target,
    // losers between a partial cut and the full stop.
    const isWin = Math.random() > 0.45;
    const rMultipleTarget = isWin ? between(riskRewardRatio * 0.5, riskRewardRatio) : -between(0.4, 1);
    const pnl = round(riskAmount * rMultipleTarget);
    balance += pnl;

    // Winners skew toward having followed more of the checklist — enough
    // demo signal for the rule-adherence chart to show a real correlation,
    // without making it a deterministic 1:1 relationship.
    const adherenceChance = isWin ? 0.85 : 0.5;
    const rulesFollowed = ruleTitles.filter(() => Math.random() < adherenceChance);

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    date.setHours(Math.floor(between(0, 24)), Math.floor(between(0, 60)), 0, 0);

    trades.push({
      userId: user._id,
      pair,
      direction,
      entryPrice,
      stopLoss,
      takeProfit,
      lotSize,
      risk,
      reward,
      riskRewardRatio,
      result: pnl >= 0 ? 'Profit' : 'Loss',
      pnl,
      riskAmount,
      rMultiple: calculateRMultiple(pnl, riskAmount),
      stopLossPips: calculatePips(pair, entryPrice, stopLoss),
      tradeNotes: `${pick(['Swept liquidity then reclaimed', 'Clean break and retest', 'Faded the extension', 'Continuation off the 4H level'])} on ${pair}.`,
      psychologyNotes: pick(['Confident', 'FOMO', 'Fear', 'Disciplined', 'Impatient']),
      tags: [pick(SETUP_TAGS)],
      mistakes: Math.random() > 0.7 ? [pick(MISTAKE_TYPES)] : [],
      rulesFollowed,
      rulesTotal: ruleTitles.length,
      session: getTradingSession(date),
      tradeDate: date,
      createdAt: date,
      updatedAt: date,
    });
  }

  await Trade.insertMany(trades);
  console.log(`Created ${trades.length} sample trades`);

  await JournalEntry.insertMany([
    {
      userId: user._id,
      title: 'Week 1 Review',
      content: 'Good week overall. Need to work on patience and waiting for confirmation.',
      date: new Date(),
    },
    {
      userId: user._id,
      title: 'Trading Psychology Notes',
      content: 'Noticed revenge trading after 2 consecutive losses. Need to stick to the plan.',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log('Seed completed successfully');
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
