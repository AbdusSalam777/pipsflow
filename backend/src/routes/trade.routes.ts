import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import { tradeSchema, updateTradeSchema, tradeQuerySchema, positionSizeSchema } from '../validators';
import * as tradeController from '../controllers/trade.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  upload.fields([
    { name: 'beforeImage', maxCount: 1 },
    { name: 'afterImage', maxCount: 1 },
  ]),
  validate(tradeSchema),
  tradeController.createTrade
);

router.post('/position-size', validate(positionSizeSchema), tradeController.getPositionSize);

router.get('/', validate(tradeQuerySchema, 'query'), tradeController.getTrades);
router.get('/export', tradeController.exportTrades);
router.get('/:id', tradeController.getTrade);

router.put(
  '/:id',
  upload.fields([
    { name: 'beforeImage', maxCount: 1 },
    { name: 'afterImage', maxCount: 1 },
  ]),
  validate(updateTradeSchema),
  tradeController.updateTrade
);

router.delete('/:id', tradeController.deleteTrade);

export default router;
