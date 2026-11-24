import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStatement,
  recordCustomerReceipt,
  recordCustomerAdjustment,
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierStatement,
  recordSupplierPayment,
  recordSupplierAdjustment,
  getKhatabookSummary,
} from '../controllers/party.controller';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.use(authenticateJWT);

// Summary KPI
router.get('/khatabook-summary', requirePermission('accounts:view'), getKhatabookSummary);

// Customers
router.get('/customers', requirePermission('accounts:view'), getCustomers);
router.post('/customers', requirePermission('accounts:post'), createCustomer);
router.get('/customers/:id', requirePermission('accounts:view'), getCustomerById);
router.put('/customers/:id', requirePermission('accounts:post'), updateCustomer);
router.delete('/customers/:id', requirePermission('accounts:post'), deleteCustomer);
router.get('/customers/:id/statement', requirePermission('accounts:view'), getCustomerStatement);
router.get('/customers/:id/ledger', requirePermission('accounts:view'), getCustomerStatement); // alias
router.post('/customers/:id/receipt', requirePermission('accounts:post'), recordCustomerReceipt);
router.post('/customers/:id/adjustment', requirePermission('accounts:post'), recordCustomerAdjustment);

// Suppliers
router.get('/suppliers', requirePermission('accounts:view'), getSuppliers);
router.post('/suppliers', requirePermission('procurement:create'), createSupplier);
router.get('/suppliers/:id', requirePermission('accounts:view'), getSupplierById);
router.put('/suppliers/:id', requirePermission('procurement:create'), updateSupplier);
router.delete('/suppliers/:id', requirePermission('procurement:create'), deleteSupplier);
router.get('/suppliers/:id/statement', requirePermission('accounts:view'), getSupplierStatement);
router.get('/suppliers/:id/ledger', requirePermission('accounts:view'), getSupplierStatement); // alias
router.post('/suppliers/:id/payment', requirePermission('accounts:post'), recordSupplierPayment);
router.post('/suppliers/:id/adjustment', requirePermission('accounts:post'), recordSupplierAdjustment);

export default router;
