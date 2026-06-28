import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { analyticsService } from '../services/analytics.service';
import { sendSuccess } from '../utils/response';

export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getDashboard(req.user!.id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getPerformance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { period, startDate, endDate } = req.query as { period: string; startDate?: string; endDate?: string };
    const data = await analyticsService.getPerformance(req.user!.id, period, startDate, endDate);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getWinRate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { period, startDate, endDate } = req.query as { period: string; startDate?: string; endDate?: string };
    const data = await analyticsService.getWinRateTrend(req.user!.id, period, startDate, endDate);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getEquity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getEquityCurve(req.user!.id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getMistakeAnalysis = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getMistakeAnalysis(req.user!.id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getCalendar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const data = await analyticsService.getCalendar(req.user!.id, year, month);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
