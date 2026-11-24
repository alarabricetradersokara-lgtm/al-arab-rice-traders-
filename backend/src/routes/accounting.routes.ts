import { Router } from 'express';
import {
  getCashAccounts,
  createCashAccount,
  getBankAccounts,
  createBankAccount,
  deleteBankAccount,
  getCashTransfers,
  createCashTransfer,
  reverseCashTransfer,
  getExpenses,
  createExpense,
  reverseExpense,
  deleteExpense,
  getOtherIncomes,
  createOtherIncome,
  reverseOtherIncome,
  getJournalEntries,
  createJournalEntry,
  getGeneralLedger,
  getTrialBalance,
  getCashBook,
  getBankBook,
  getProfitLossStatement,
  getBalanceSheet,
} from '../controllers/accounting.controller';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.use(authenticateJWT);

// Cash & Bank Accounts
router.get('/cash-accounts', requirePermission('accounts:view'), getCashAccounts);
router.post('/cash-accounts', requirePermission('accounts:manage'), createCashAccount);
router.get('/bank-accounts', requirePermission('accounts:view'), getBankAccounts);
router.post('/bank-accounts', requirePermission('accounts:manage'), createBankAccount);
router.delete('/bank-accounts/:id', requirePermission('accounts:manage'), deleteBankAccount);

// Cash & Bank Transfers
router.get('/transfers', requirePermission('accounts:view'), getCashTransfers);
router.post('/transfers', requirePermission('accounts:manage'), createCashTransfer);
router.post('/transfers/:id/reverse', requirePermission('accounts:manage'), reverseCashTransfer);

// Expenses
router.get('/expenses', requirePermission('accounts:view'), getExpenses);
router.post('/expenses', requirePermission('payments:manage'), createExpense);
router.post('/expenses/:id/reverse', requirePermission('payments:manage'), reverseExpense);
router.delete('/expenses/:id', requirePermission('payments:manage'), deleteExpense);

// Other Incomes
router.get('/incomes', requirePermission('accounts:view'), getOtherIncomes);
router.post('/incomes', requirePermission('receipts:manage'), createOtherIncome);
router.post('/incomes/:id/reverse', requirePermission('receipts:manage'), reverseOtherIncome);

// Journal Entries (Double-Entry General Journal)
router.get('/journal', requirePermission('ledgers:view'), getJournalEntries);
router.post('/journal', requirePermission('ledgers:manage'), createJournalEntry);

// Ledgers and Statements
router.get('/reports/general-ledger', requirePermission('ledgers:view'), getGeneralLedger);
router.get('/reports/trial-balance', requirePermission('reports:financial'), getTrialBalance);
router.get('/reports/cash-book', requirePermission('accounts:view'), getCashBook);
router.get('/reports/bank-book', requirePermission('accounts:view'), getBankBook);

// Confidential Financial Reports
router.get('/reports/profit-loss', requirePermission('reports:financial'), getProfitLossStatement);
router.get('/reports/balance-sheet', requirePermission('reports:financial'), getBalanceSheet);

// Backward Compatibility Aliases
router.get('/profit-loss', requirePermission('reports:financial'), getProfitLossStatement);
router.get('/balance-sheet', requirePermission('reports:financial'), getBalanceSheet);

export default router;
