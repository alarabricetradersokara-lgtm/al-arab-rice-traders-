import { Router } from 'express';
import {
  getExportCustomers,
  getExportCustomerById,
  createExportCustomer,
  getExportInvoices,
  getExportInvoiceById,
  createExportInvoice,
  getExportPayments,
  createExportPayment,
} from '../controllers/export.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.use(authenticateJWT);

// Export Buyers / Customers
router.get('/customers', getExportCustomers);
router.post('/customers', createExportCustomer);
router.get('/customers/:id', getExportCustomerById);

// Export Invoices & Shipping Orders
router.get('/invoices', getExportInvoices);
router.post('/invoices', createExportInvoice);
router.get('/invoices/:id', getExportInvoiceById);

// Foreign Remittance Realization Payments
router.get('/payments', getExportPayments);
router.post('/payments', createExportPayment);

export default router;
