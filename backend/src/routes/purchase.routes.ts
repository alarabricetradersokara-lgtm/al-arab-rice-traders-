import { Router } from 'express';
import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  deletePurchase,
  createPurchaseReturn,
  getPurchaseRateHistory,
  getSupplierStatement,
} from '../controllers/purchase.controller';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.use(authenticateJWT);

router.post('/', requirePermission('procurement:create'), createPurchase);
router.get('/', requirePermission('procurement:create'), getPurchases);
router.get('/rates', requirePermission('procurement:create'), getPurchaseRateHistory);
router.get('/statement/:supplierId', requirePermission('accounts:view'), getSupplierStatement);
router.get('/:id', requirePermission('procurement:create'), getPurchaseById);
router.delete('/:id', requirePermission('procurement:create'), deletePurchase);
router.post('/return', requirePermission('procurement:create'), createPurchaseReturn);

export default router;
