import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import inventoryRoutes from './inventory.routes';
import purchaseRoutes from './purchase.routes';
import saleRoutes from './sale.routes';
import partyRoutes from './party.routes';
import dashboardRoutes from './dashboard.routes';
import accountingRoutes from './accounting.routes';
import productionRoutes from './production.routes';
import commissionRoutes from './commission.routes';
import exportRoutes from './export.routes';
import warehouseTransferRoutes from './warehouseTransfer.routes';
import settingsRoutes from './settings.routes';
import dailySalesRoutes from './dailySales.routes';
import reportRoutes from './report.routes';
import userRoutes from './user.routes';
import auditRoutes from './audit.routes';
import { sendSuccess } from '../utils/response';
import prisma from '../config/prisma';

const router = Router();

// Health Check
router.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'error';
  }

  sendSuccess(res, {
    system: 'AL ARAB RICE TRADERS ERP & POS API',
    version: '1.0.0',
    status: 'ONLINE',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Mount Core & Module Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/sales', saleRoutes);
router.use('/parties', partyRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/accounts', accountingRoutes);
router.use('/accounting', accountingRoutes);
router.use('/production', productionRoutes);
router.use('/commission', commissionRoutes);
router.use('/export', exportRoutes);
router.use('/warehouse-transfers', warehouseTransferRoutes);
router.use('/transfers/warehouse', warehouseTransferRoutes);
router.use('/settings', settingsRoutes);
router.use('/daily-sales', dailySalesRoutes);
router.use('/reports', reportRoutes);

export default router;
