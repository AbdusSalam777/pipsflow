import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { tradeService } from '../services/trade.service';
import { sendSuccess } from '../utils/response';

/** Pulls the optional screenshots out of multer's field map. */
const extractFiles = (req: AuthRequest) => {
  const files: { before?: Express.Multer.File; after?: Express.Multer.File } = {};
  if (req.files && typeof req.files === 'object') {
    const uploaded = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (uploaded.beforeImage?.[0]) files.before = uploaded.beforeImage[0];
    if (uploaded.afterImage?.[0]) files.after = uploaded.afterImage[0];
  }
  return files;
};

export const createTrade = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trade = await tradeService.create(req.user!.id, req.body, extractFiles(req));
    sendSuccess(res, trade, 201, 'Trade created');
  } catch (error) {
    next(error);
  }
};

export const getTrades = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await tradeService.findAll(req.user!.id, req.query as never);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getTrade = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trade = await tradeService.findById(req.user!.id, String(req.params.id));
    sendSuccess(res, trade);
  } catch (error) {
    next(error);
  }
};

export const updateTrade = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trade = await tradeService.update(
      req.user!.id,
      String(req.params.id),
      req.body,
      extractFiles(req)
    );
    sendSuccess(res, trade, 200, 'Trade updated');
  } catch (error) {
    next(error);
  }
};

export const getPositionSize = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await tradeService.getPositionSize(req.user!.id, req.body);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const deleteTrade = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await tradeService.delete(req.user!.id, String(req.params.id));
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const exportTrades = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as string) || 'csv';
    const data = await tradeService.exportTrades(req.user!.id, format as 'csv' | 'json');

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=trades.csv');
      return res.send(data);
    }

    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
