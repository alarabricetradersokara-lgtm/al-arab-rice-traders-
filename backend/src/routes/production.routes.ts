import { Router } from 'express';
import {
  getProductionBatches,
  getProductionBatchById,
  createProductionBatch,
  getMillingYieldAnalytics,
} from '../controllers/production.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/batches/analytics', getMillingYieldAnalytics);
router.get('/batches/:id', getProductionBatchById);
router.get('/batches', getProductionBatches);
router.post('/batches', createProductionBatch);

// Aliases
router.get('/analytics', getMillingYieldAnalytics);
router.get('/:id', getProductionBatchById);
router.get('/', getProductionBatches);
router.post('/', createProductionBatch);

export default router;
