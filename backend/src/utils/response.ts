import { Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from './AppError';

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200, message?: string) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (err: unknown, res: Response) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
