import { Router } from 'express';
import {
  getDailySalesSheet,
  saveDailySalesDraft,
  confirmDailySales,
  reverseDailySales,
  getDailySalesHistory,
  getDailyClosingReport,
} from '../controllers/dailySales.controller';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.use(authenticateJWT);

router.get('/sheet', requirePermission('pos:sale'), getDailySalesSheet);
router.post('/draft', requirePermission('pos:sale'), saveDailySalesDraft);
router.post('/:id/confirm', requirePermission('pos:close_shift'), confirmDailySales);
router.post('/:id/reverse', requirePermission('pos:close_shift'), reverseDailySales);
router.get('/history', requirePermission('pos:sale'), getDailySalesHistory);
router.get('/:id/report', requirePermission('reports:view'), getDailyClosingReport);

export default router;
