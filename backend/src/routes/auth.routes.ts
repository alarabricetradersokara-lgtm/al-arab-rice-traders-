import { Router } from 'express';
import {
  login,
  register,
  refreshToken,
  getCurrentUser,
  changePassword,
} from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth';
import { requireRole } from '../middlewares/rbac';
import { loginRateLimiter } from '../middlewares/rateLimiter';
import { RoleName } from '@prisma/client';

const router = Router();

router.post('/login', loginRateLimiter, login);
router.post('/refresh', refreshToken);
router.post('/register', authenticateJWT, requireRole(RoleName.ADMIN, RoleName.SUPER_ADMIN), register);
router.get('/me', authenticateJWT, getCurrentUser);
router.post('/change-password', authenticateJWT, changePassword);

export default router;
