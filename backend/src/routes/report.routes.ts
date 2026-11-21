import { Router } from 'express';
import {
  getDailySalesReport,
  getDailyClosingReport,
  getMonthlySalesReport,
  getPurchaseReport,
  getProfitLossReport,
  getStockValuationReport,
  getStockLedgerReport,
  getCustomerOutstandingReport,
  getSupplierOutstandingReport,
  getExpensesReport,
  getCommissionReport,
  getWarehouseReport,
} from '../controllers/report.controller';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.use(authenticateJWT);

// Financial statements require confidential financial permission
router.get('/profit-loss', requirePermission('reports:financial'), getProfitLossReport);

// General operational reports require reports:view permission
router.get('/daily-sales', requirePermission('reports:view'), getDailySalesReport);
router.get('/daily-closing', requirePermission('reports:view'), getDailyClosingReport);
router.get('/monthly-sales', requirePermission('reports:view'), getMonthlySalesReport);
router.get('/purchases', requirePermission('reports:view'), getPurchaseReport);
router.get('/stock-valuation', requirePermission('reports:view'), getStockValuationReport);
router.get('/stock-ledger', requirePermission('reports:view'), getStockLedgerReport);
router.get('/customer-outstanding', requirePermission('reports:view'), getCustomerOutstandingReport);
router.get('/supplier-outstanding', requirePermission('reports:view'), getSupplierOutstandingReport);
router.get('/expenses', requirePermission('reports:view'), getExpensesReport);
router.get('/commission', requirePermission('reports:view'), getCommissionReport);
router.get('/warehouses', requirePermission('reports:view'), getWarehouseReport);

export default router;
