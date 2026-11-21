import { Router } from 'express';
import {
  getStockOverview,
  getStockMovements,
  adjustStock,
  getProducts,
  createProduct,
  createOpeningStock,
  recordWastage,
  getStockAlerts,
  getCategories,
  getWarehouses,
} from '../controllers/inventory.controller';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.use(authenticateJWT);

router.get('/products', requirePermission('inventory:view'), getProducts);
router.post('/products', requirePermission('inventory:create'), createProduct);

router.get('/categories', requirePermission('inventory:view'), getCategories);
router.get('/warehouses', requirePermission('inventory:view'), getWarehouses);

router.get('/overview', requirePermission('inventory:view'), getStockOverview);
router.get('/movements', requirePermission('inventory:view'), getStockMovements);
router.get('/alerts', requirePermission('inventory:view'), getStockAlerts);

router.post('/adjust', requirePermission('inventory:adjust'), adjustStock);
router.post('/opening-stock', requirePermission('inventory:create'), createOpeningStock);
router.post('/wastage', requirePermission('inventory:adjust'), recordWastage);

export default router;
