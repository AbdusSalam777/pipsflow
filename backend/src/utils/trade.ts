import { TradingSession } from '../types';

export const getTradingSession = (date: Date): TradingSession => {
  const utcHour = date.getUTCHours();

  // London: 07:00 - 16:00 UTC
  if (utcHour >= 7 && utcHour < 16) return 'London';
  // New York: 12:00 - 21:00 UTC
  if (utcHour >= 12 && utcHour < 21) return 'New York';
  // Asia: 00:00 - 09:00 UTC
  return 'Asia';
};

export const calculateRiskReward = (
  direction: 'Long' | 'Short',
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): { risk: number; reward: number; riskRewardRatio: number } => {
  let risk: number;
  let reward: number;

  if (direction === 'Long') {
    risk = entryPrice - stopLoss;
    reward = takeProfit - entryPrice;
  } else {
    risk = stopLoss - entryPrice;
    reward = entryPrice - takeProfit;
  }

  const riskRewardRatio = risk > 0 ? Math.abs(reward / risk) : 0;

  return {
    risk: Math.abs(risk),
    reward: Math.abs(reward),
    riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
  };
};

export const getDayOfWeek = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};
