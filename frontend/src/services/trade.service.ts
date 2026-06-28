import api from './api';
import { ApiResponse, Trade, DashboardData, User } from '@/types';

export const tradeApi = {
  create: (data: FormData) =>
    api.post<ApiResponse<Trade>>('/trades', data, { headers: { 'Content-Type': 'multipart/form-data' } }),

  getAll: (params?: Record<string, string | number>) =>
    api.get<ApiResponse<{ trades: Trade[]; pagination: { page: number; limit: number; total: number; pages: number } }>>('/trades', { params }),

  getById: (id: string) => api.get<ApiResponse<Trade>>(`/trades/${id}`),

  update: (id: string, data: FormData) =>
    api.put<ApiResponse<Trade>>(`/trades/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),

  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/trades/${id}`),

  export: (format: 'csv' | 'json') =>
    api.get(`/trades/export`, { params: { format }, responseType: format === 'csv' ? 'blob' : 'json' }),
};

export const analyticsApi = {
  getDashboard: () => api.get<ApiResponse<DashboardData>>('/analytics/dashboard'),

  getPerformance: (params?: { period?: string; startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<Record<string, unknown>>>('/analytics/performance', { params }),

  getWinRate: (params?: { period?: string; startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<{ date: string; winRate: number; trades: number }[]>>('/analytics/winrate', { params }),

  getEquity: () => api.get<ApiResponse<{ date: string; equity: number; pnl: number }[]>>('/analytics/equity'),

  getMistakes: () => api.get<ApiResponse<{ mistakes: { name: string; frequency: number; pnlImpact: number; winRateImpact: number }[]; mostCommon: unknown[]; worstPerforming: unknown[] }>>('/analytics/mistakes'),

  getCalendar: (year: number, month: number) =>
    api.get<ApiResponse<{ date: string; trades: number; pnl: number; tradeIds: string[] }[]>>('/analytics/calendar', { params: { year, month } }),
};

export const journalApi = {
  getAll: () => api.get<ApiResponse<import('@/types').JournalEntry[]>>('/journal'),
  getById: (id: string) => api.get<ApiResponse<import('@/types').JournalEntry>>(`/journal/${id}`),
  create: (data: { title: string; content: string; date?: string }) =>
    api.post<ApiResponse<import('@/types').JournalEntry>>('/journal', data),
  update: (id: string, data: { title: string; content: string; date?: string }) =>
    api.put<ApiResponse<import('@/types').JournalEntry>>(`/journal/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/journal/${id}`),
};

export const goalApi = {
  getAll: () => api.get<ApiResponse<import('@/types').Goal[]>>('/goals'),
  create: (data: { title: string; type: string; target: number; current?: number; unit?: string; deadline?: string }) =>
    api.post<ApiResponse<import('@/types').Goal>>('/goals', data),
  update: (id: string, data: Partial<import('@/types').Goal>) =>
    api.put<ApiResponse<import('@/types').Goal>>(`/goals/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/goals/${id}`),
};

export const profileApi = {
  get: () => api.get<ApiResponse<User & { totalTrades: number; winRate: number; lifetimePnL: number }>>('/profile'),
  updatePicture: (file: File) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return api.put('/profile/picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};