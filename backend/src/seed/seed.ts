import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { User, Trade, JournalEntry, Goal } from '../models';
import { FOREX_PAIRS, SETUP_TAGS, MISTAKE_TYPES } from '../types';
import { calculateRiskReward, getTradingSession } from '../utils/trade';

const seed = async () => {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB for seeding');

  await Promise.all([
    User.deleteMany({}),
    Trade.deleteMany({}),
    JournalEntry.deleteMany({}),
    Goal.deleteMany({}),
  ]);

  const hashedPassword = await bcrypt.hash('Password123!', 12);
  const user = await User.create({
    username: 'demo_trader',
    email: 'demo@pipsflow.com',
    password: hashedPassword,
    profilePicture: '',
  });

  console.log('Created demo user: demo@pipsflow.com / Password123!');

  const pairs = FOREX_PAIRS.slice(0, 8);
  const directions: ('Long' | 'Short')[] = ['Long', 'Short'];
  const trades = [];

  for (let i = 0; i < 50; i++) {
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const direction = directions[Math.floor(Math.random() * 2)];
    const entryPrice = pair === 'XAUUSD' ? 1950 + Math.random() * 50 : 1 + Math.random() * 0.5;
    const stopLoss = direction === 'Long' ? entryPrice - 0.005 : entryPrice + 0.005;
    const takeProfit = direction === 'Long' ? entryPrice + 0.01 : entryPrice - 0.01;
    const { risk, reward, riskRewardRatio } = calculateRiskReward(direction, entryPrice, stopLoss, takeProfit);
    const isWin = Math.random() > 0.4;
    const pnl = isWin ? Math.round((50 + Math.random() * 200) * 100) / 100 : -Math.round((30 + Math.random() * 150) * 100) / 100;
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));

    trades.push({
      userId: user._id,
      pair,
      direction,
      entryPrice: Math.round(entryPrice * 100000) / 100000,
      stopLoss: Math.round(stopLoss * 100000) / 100000,
      takeProfit: Math.round(takeProfit * 100000) / 100000,
      lotSize: 0.1,
      risk,
      reward,
      riskRewardRatio,
      result: isWin ? 'Profit' : 'Loss',
      pnl,
      tradeNotes: `Trade #${i + 1} on ${pair}`,
      psychologyNotes: ['Confident', 'FOMO', 'Fear', 'Disciplined'][Math.floor(Math.random() * 4)],
      tags: [SETUP_TAGS[Math.floor(Math.random() * SETUP_TAGS.length)]],
      mistakes: Math.random() > 0.7 ? [MISTAKE_TYPES[Math.floor(Math.random() * MISTAKE_TYPES.length)]] : [],
      session: getTradingSession(date),
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

  await Goal.insertMany([
    { userId: user._id, title: 'Monthly Profit Target', type: 'Profit', target: 5000, current: 2340, unit: 'USD' },
    { userId: user._id, title: 'Win Rate Goal', type: 'Win Rate', target: 60, current: 55, unit: '%' },
    { userId: user._id, title: 'Weekly Trade Count', type: 'Trade Count', target: 10, current: 7, unit: 'trades' },
    { userId: user._id, title: 'Discipline Goal', type: 'Discipline', target: 100, current: 75, unit: '%' },
  ]);

  console.log('Seed completed successfully');
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
