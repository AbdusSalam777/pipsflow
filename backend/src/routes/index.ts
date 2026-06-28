import { Router } from 'express';
import authRoutes from './auth.routes';
import tradeRoutes from './trade.routes';
import analyticsRoutes from './analytics.routes';
import { journalRouter, goalRouter, profileRouter } from './misc.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'PipsFlow API is running' });
});

router.use('/auth', authRoutes);
router.use('/trades', tradeRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/journal', journalRouter);
router.use('/goals', goalRouter);
router.use('/profile', profileRouter);

export default router;
