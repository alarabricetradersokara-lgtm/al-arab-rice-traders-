import { Router } from 'express';
import {
  getWarehouseTransfers,
  getWarehouseTransferById,
  createWarehouseTransfer,
  receiveWarehouseTransfer,
  reconcileWarehouseStock,
} from '../controllers/warehouseTransfer.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.use(authenticateJWT);

// Inter-warehouse stock transfers
router.get('/', getWarehouseTransfers);
router.post('/', createWarehouseTransfer);
router.get('/:id', getWarehouseTransferById);
router.post('/:id/receive', receiveWarehouseTransfer);

// Physical Stock Reconciliation Audit
router.post('/reconcile', reconcileWarehouseStock);

export default router;
