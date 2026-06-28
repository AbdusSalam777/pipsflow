import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema, source: 'body' | 'query' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(source === 'query' ? req.query : req.body);
      if (source === 'query') {
        req.query = parsed as typeof req.query;
      } else {
        req.body = parsed;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
