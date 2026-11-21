import { Router } from 'express';
import {
  getCommissionAgents,
  getCommissionAgentById,
  createCommissionAgent,
  getCommissionTransactions,
  createCommissionTransaction,
  getCommissionPayments,
  createCommissionPayment,
  getAgentStatement,
} from '../controllers/commission.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.use(authenticateJWT);

// Agents / Brokers
router.get('/agents', getCommissionAgents);
router.post('/agents', createCommissionAgent);
router.get('/agents/:id', getCommissionAgentById);
router.get('/agents/:id/statement', getAgentStatement);

// Transactions (Accrued Brokerage)
router.get('/transactions', getCommissionTransactions);
router.post('/transactions', createCommissionTransaction);

// Payments (Disbursements to Brokers)
router.get('/payments', getCommissionPayments);
router.post('/payments', createCommissionPayment);

export default router;
