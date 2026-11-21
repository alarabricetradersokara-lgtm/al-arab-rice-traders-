import { Router } from 'express';
import {
  getUsers,
  getRoles,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
} from '../controllers/user.controller';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.use(authenticateJWT);
router.use(requirePermission('users:manage'));

router.get('/', getUsers);
router.get('/roles', getRoles);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/status', toggleUserStatus);
router.post('/:id/reset-password', resetUserPassword);

export default router;
