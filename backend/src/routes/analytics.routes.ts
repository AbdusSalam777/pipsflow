import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { analyticsQuerySchema } from '../validators';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/performance', validate(analyticsQuerySchema, 'query'), analyticsController.getPerformance);
router.get('/winrate', validate(analyticsQuerySchema, 'query'), analyticsController.getWinRate);
router.get('/equity', analyticsController.getEquity);
router.get('/mistakes', analyticsController.getMistakeAnalysis);
router.get('/calendar', analyticsController.getCalendar);

export default router;
