import { Router } from 'express';
import { getCompanySettings, updateCompanySettings } from '../controllers/settings.controller';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.use(authenticateJWT);

router.get('/', getCompanySettings);
router.put('/', requirePermission('settings:manage'), updateCompanySettings);
router.get('/company', getCompanySettings);
router.put('/company', requirePermission('settings:manage'), updateCompanySettings);

export default router;
