import { TradeDirection, TradingSession } from '../types';

/**
 * Session windows in UTC. Checked most-specific first so overlapping hours
 * (London and New York both cover 12:00-16:00) resolve to the session that
 * actually dominates the tape rather than whichever branch is listed first.
 */
export const getTradingSession = (date: Date): TradingSession => {
  const hour = date.getUTCHours();

  // New York only: 16:00 - 21:00 (London has closed)
  if (hour >= 16 && hour < 21) return 'New York';
  // London: 07:00 - 16:00 (includes the 12:00-16:00 overlap with NY)
  if (hour >= 7 && hour < 16) return 'London';
  // Asia: 21:00 - 07:00
  return 'Asia';
};

export const calculateRiskReward = (
  direction: TradeDirection,
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): { risk: number; reward: number; riskRewardRatio: number } => {
  const risk = direction === 'Long' ? entryPrice - stopLoss : stopLoss - entryPrice;
  const reward = direction === 'Long' ? takeProfit - entryPrice : entryPrice - takeProfit;

  const absRisk = Math.abs(risk);
  const absReward = Math.abs(reward);
  const riskRewardRatio = absRisk > 0 ? absReward / absRisk : 0;

  return {
    risk: round(absRisk, 5),
    reward: round(absReward, 5),
    riskRewardRatio: round(riskRewardRatio, 2),
  };
};

export const getDayOfWeek = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

/* -------------------------------------------------------------------------- */
/*                                 Pip math                                    */
/* -------------------------------------------------------------------------- */

/** Units of the base asset in one standard lot. Gold trades in 100oz contracts. */
export const getContractSize = (pair: string): number => (pair === 'XAUUSD' ? 100 : 100_000);

/** Price increment of one pip. JPY quotes move in 0.01, gold in 0.1. */
export const getPipSize = (pair: string): number => {
  if (pair === 'XAUUSD') return 0.1;
  if (pair.endsWith('JPY')) return 0.01;
  return 0.0001;
};

export const getBaseCurrency = (pair: string): string => pair.slice(0, 3);
export const getQuoteCurrency = (pair: string): string => pair.slice(3, 6);

/**
 * Approximate quote-currency -> USD rates, used only for cross pairs where the
 * pair's own price cannot tell us the conversion. Callers should pass a live
 * `quoteToUsd` when precision matters; results are flagged `approximate` when
 * this table is used so the UI can say so.
 */
export const FALLBACK_QUOTE_USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  JPY: 0.0067,
  AUD: 0.65,
  NZD: 0.6,
  CAD: 0.73,
  CHF: 1.13,
};

export interface PipValueResult {
  /** USD gained or lost per pip, per standard lot. */
  pipValuePerLot: number;
  /** True when a hardcoded FX rate was used instead of derivable/live data. */
  approximate: boolean;
}

/**
 * Value of one pip per standard lot, in USD.
 *
 * - Quote is USD (EURUSD, XAUUSD): the pair's price already is USD, so the
 *   value is exact and constant.
 * - Base is USD (USDJPY, USDCAD): divide by the pair's own price — exact.
 * - Cross (EURGBP, GBPJPY): needs an external quote->USD rate.
 */
export const getPipValuePerLot = (
  pair: string,
  price: number,
  quoteToUsd?: number
): PipValueResult => {
  const pipSize = getPipSize(pair);
  const contractSize = getContractSize(pair);
  const perPipInQuote = pipSize * contractSize;

  if (getQuoteCurrency(pair) === 'USD') {
    return { pipValuePerLot: perPipInQuote, approximate: false };
  }

  if (getBaseCurrency(pair) === 'USD') {
    if (!price || price <= 0) return { pipValuePerLot: 0, approximate: true };
    return { pipValuePerLot: perPipInQuote / price, approximate: false };
  }

  const quote = getQuoteCurrency(pair);
  const rate = quoteToUsd ?? FALLBACK_QUOTE_USD_RATES[quote];
  if (!rate) return { pipValuePerLot: 0, approximate: true };

  return { pipValuePerLot: perPipInQuote * rate, approximate: quoteToUsd === undefined };
};

/** Distance between two prices expressed in pips. */
export const calculatePips = (pair: string, from: number, to: number): number =>
  round(Math.abs(to - from) / getPipSize(pair), 1);

export interface PositionSizeResult {
  riskAmount: number;
  stopLossPips: number;
  pipValuePerLot: number;
  /** Standard lots, floored to broker-typical 0.01 granularity. */
  lots: number;
  units: number;
  /** Actual dollars at risk once lots are rounded to 0.01. */
  actualRisk: number;
  approximate: boolean;
}

/**
 * Core sizing formula: lots = riskAmount / (stopPips * pipValuePerLot).
 * Lots are floored, never rounded up, so rounding can only reduce risk.
 */
export const calculatePositionSize = (params: {
  pair: string;
  accountBalance: number;
  riskPercent: number;
  entryPrice: number;
  stopLoss: number;
  quoteToUsd?: number;
}): PositionSizeResult => {
  const { pair, accountBalance, riskPercent, entryPrice, stopLoss, quoteToUsd } = params;

  const riskAmount = round((accountBalance * riskPercent) / 100, 2);
  const stopLossPips = calculatePips(pair, entryPrice, stopLoss);
  const { pipValuePerLot, approximate } = getPipValuePerLot(pair, entryPrice, quoteToUsd);

  const riskPerLot = stopLossPips * pipValuePerLot;
  const rawLots = riskPerLot > 0 ? riskAmount / riskPerLot : 0;
  const lots = Math.floor(rawLots * 100) / 100;

  return {
    riskAmount,
    stopLossPips,
    pipValuePerLot: round(pipValuePerLot, 4),
    lots,
    units: Math.round(lots * getContractSize(pair)),
    actualRisk: round(lots * riskPerLot, 2),
    approximate,
  };
};

/**
 * Dollars actually at risk on a logged trade, derived from the position the
 * trader took. Used to express results in R.
 */
export const calculateRiskAmount = (params: {
  pair: string;
  entryPrice: number;
  stopLoss: number;
  lotSize: number;
  quoteToUsd?: number;
}): number => {
  const { pair, entryPrice, stopLoss, lotSize, quoteToUsd } = params;
  const stopPips = calculatePips(pair, entryPrice, stopLoss);
  const { pipValuePerLot } = getPipValuePerLot(pair, entryPrice, quoteToUsd);
  return round(stopPips * pipValuePerLot * lotSize, 2);
};

/** Result in R: how many multiples of the initial risk the trade returned. */
export const calculateRMultiple = (pnl: number, riskAmount: number): number =>
  riskAmount > 0 ? round(pnl / riskAmount, 2) : 0;

export const round = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
