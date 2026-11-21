import { Router } from 'express';
import { getDashboardStats, getDashboardCharts, getDashboardRecent } from '../controllers/dashboard.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/stats', getDashboardStats);
router.get('/charts', getDashboardCharts);
router.get('/recent', getDashboardRecent);

export default router;
