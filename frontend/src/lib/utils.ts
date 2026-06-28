import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getPnlColor(pnl: number): string {
  return pnl >= 0 ? 'text-profit' : 'text-loss';
}

export function getHeatmapColor(pnl: number, result: string): string {
  const intensity = Math.min(Math.abs(pnl) / 200, 1);
  if (result === 'Profit') {
    const g = Math.round(100 + intensity * 55);
    return `rgb(34, ${g}, 94)`;
  }
  const r = Math.round(150 + intensity * 105);
  return `rgb(${r}, 68, 68)`;
}
