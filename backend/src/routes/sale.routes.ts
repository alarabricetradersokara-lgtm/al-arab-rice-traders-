import { Router } from 'express';
import {
  createSale,
  getSales,
  getSaleById,
  createSalesReturn,
} from '../controllers/sale.controller';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.use(authenticateJWT);

router.get('/', requirePermission('sales:view'), getSales);
router.post('/', requirePermission('sales:create'), createSale);
router.post('/return', requirePermission('sales:create'), createSalesReturn);
router.get('/:id', requirePermission('sales:view'), getSaleById);

export default router;
