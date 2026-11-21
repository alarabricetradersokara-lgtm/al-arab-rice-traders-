import api from './api';
import {
  CashAccount,
  BankAccount,
  CashTransfer,
  Expense,
  OtherIncome,
  JournalEntry,
  GeneralLedgerLine,
  GeneralLedgerReport,
  TrialBalanceReport,
  CashBookReport,
  BankBookReport,
  ProfitLossReport,
  BalanceSheetReport,
} from '../types/accounting';

export const accountingService = {
  // Cash & Bank Accounts
  getCashAccounts: async (): Promise<CashAccount[]> => {
    const res = await api.get('/accounting/cash-accounts');
    return res.data.data;
  },
  createCashAccount: async (data: { name: string; code?: string; openingBalance?: number }): Promise<CashAccount> => {
    const res = await api.post('/accounting/cash-accounts', data);
    return res.data.data;
  },
  getBankAccounts: async (): Promise<BankAccount[]> => {
    const res = await api.get('/accounting/bank-accounts');
    return res.data.data;
  },
  createBankAccount: async (data: {
    bankName: string;
    accountNumber: string;
    branchName?: string;
    iban?: string;
    openingBalance?: number;
  }): Promise<BankAccount> => {
    const res = await api.post('/accounting/bank-accounts', data);
    return res.data.data;
  },

  // Transfers
  getTransfers: async (params?: { startDate?: string; endDate?: string; status?: string }): Promise<CashTransfer[]> => {
    const res = await api.get('/accounting/transfers', { params });
    return res.data.data;
  },
  createTransfer: async (data: {
    transferDate: string;
    fromAccountType: 'CASH' | 'BANK';
    fromCashAccountId?: string;
    fromBankAccountId?: string;
    toAccountType: 'CASH' | 'BANK';
    toCashAccountId?: string;
    toBankAccountId?: string;
    amount: number;
    referenceNumber?: string;
    notes?: string;
  }): Promise<CashTransfer> => {
    const res = await api.post('/accounting/transfers', data);
    return res.data.data;
  },
  reverseTransfer: async (id: string, reason?: string): Promise<any> => {
    const res = await api.post(`/accounting/transfers/${id}/reverse`, { reason });
    return res.data.data;
  },

  // Expenses
  getExpenses: async (params?: { category?: string; startDate?: string; endDate?: string; status?: string }): Promise<{ expenses: Expense[]; totalExpense: string }> => {
    const res = await api.get('/accounting/expenses', { params });
    return res.data.data;
  },
  createExpense: async (data: {
    category: string;
    title: string;
    description?: string;
    amount: number;
    expenseDate: string;
    paymentMethod: 'CASH' | 'BANK';
    cashAccountId?: string;
    bankAccountId?: string;
    paidTo?: string;
  }): Promise<Expense> => {
    const res = await api.post('/accounting/expenses', data);
    return res.data.data;
  },
  reverseExpense: async (id: string, reason?: string): Promise<any> => {
    const res = await api.post(`/accounting/expenses/${id}/reverse`, { reason });
    return res.data.data;
  },

  // Other Incomes
  getOtherIncomes: async (params?: { category?: string; startDate?: string; endDate?: string; status?: string }): Promise<{ incomes: OtherIncome[]; totalIncome: string }> => {
    const res = await api.get('/accounting/incomes', { params });
    return res.data.data;
  },
  createOtherIncome: async (data: {
    category: string;
    title: string;
    description?: string;
    amount: number;
    incomeDate: string;
    paymentMethod: 'CASH' | 'BANK';
    cashAccountId?: string;
    bankAccountId?: string;
    receivedFrom?: string;
  }): Promise<OtherIncome> => {
    const res = await api.post('/accounting/incomes', data);
    return res.data.data;
  },
  reverseOtherIncome: async (id: string, reason?: string): Promise<any> => {
    const res = await api.post(`/accounting/incomes/${id}/reverse`, { reason });
    return res.data.data;
  },

  // Journal Entries
  getJournalEntries: async (params?: { startDate?: string; endDate?: string; voucherType?: string }): Promise<JournalEntry[]> => {
    const res = await api.get('/accounting/journal', { params });
    return res.data.data;
  },
  createJournalEntry: async (data: {
    entryDate: string;
    voucherType?: string;
    referenceNo?: string;
    narration: string;
    lines: {
      accountCode: string;
      accountName: string;
      accountType: string;
      debit: number;
      credit: number;
      memo?: string;
    }[];
  }): Promise<JournalEntry> => {
    const res = await api.post('/accounting/journal', data);
    return res.data.data;
  },

  // Reports
  getGeneralLedger: async (params?: { accountCode?: string; startDate?: string; endDate?: string }): Promise<GeneralLedgerLine[]> => {
    const res = await api.get('/accounting/reports/general-ledger', { params });
    return res.data.data;
  },
  getTrialBalance: async (params?: { asOfDate?: string }): Promise<TrialBalanceReport> => {
    const res = await api.get('/accounting/reports/trial-balance', { params });
    return res.data.data;
  },
  getCashBook: async (cashAccountId: string, params?: { startDate?: string; endDate?: string }): Promise<CashBookReport> => {
    const res = await api.get('/accounting/reports/cash-book', { params: { cashAccountId, ...params } });
    return res.data.data;
  },
  getBankBook: async (bankAccountId: string, params?: { startDate?: string; endDate?: string }): Promise<BankBookReport> => {
    const res = await api.get('/accounting/reports/bank-book', { params: { bankAccountId, ...params } });
    return res.data.data;
  },
  getProfitLoss: async (params?: { startDate?: string; endDate?: string }): Promise<ProfitLossReport> => {
    const res = await api.get('/accounting/reports/profit-loss', { params });
    return res.data.data;
  },
  getBalanceSheet: async (params?: { asOfDate?: string }): Promise<BalanceSheetReport> => {
    const res = await api.get('/accounting/reports/balance-sheet', { params });
    return res.data.data;
  },
};
