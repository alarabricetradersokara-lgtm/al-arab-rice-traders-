import { Router } from 'express';
import { getAuditLogs, getAuditSummary } from '../controllers/audit.controller';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.use(authenticateJWT);
router.use(requirePermission('audit:view'));

router.get('/', getAuditLogs);
router.get('/summary', getAuditSummary);

export default router;
