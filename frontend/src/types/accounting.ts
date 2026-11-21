export interface CashAccount {
  id: string;
  code: string;
  name: string;
  balance: number | string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankAccount {
  id: string;
  code: string;
  bankName: string;
  accountNumber: string;
  branchName?: string;
  iban?: string;
  currentBalance: number | string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CashTransfer {
  id: string;
  transferNumber: string;
  transferDate: string;
  fromAccountType: 'CASH' | 'BANK';
  fromCashAccountId?: string | null;
  fromBankAccountId?: string | null;
  toAccountType: 'CASH' | 'BANK';
  toCashAccountId?: string | null;
  toBankAccountId?: string | null;
  amount: number | string;
  referenceNumber?: string | null;
  notes?: string | null;
  status: 'POSTED' | 'REVERSED';
  reversalRef?: string | null;
  fromCashAccount?: CashAccount | null;
  fromBankAccount?: BankAccount | null;
  toCashAccount?: CashAccount | null;
  toBankAccount?: BankAccount | null;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Salaries'
  | 'Electricity'
  | 'Rent'
  | 'Loading/unloading'
  | 'Transportation'
  | 'Repair and maintenance'
  | 'Office expenses'
  | 'Other';

export interface Expense {
  id: string;
  expenseNumber: string;
  category: ExpenseCategory | string;
  title: string;
  description?: string | null;
  amount: number | string;
  expenseDate: string;
  paymentMethod: 'CASH' | 'BANK';
  cashAccountId?: string | null;
  bankAccountId?: string | null;
  paidTo?: string | null;
  status: 'POSTED' | 'REVERSED';
  reversalRef?: string | null;
  cashAccount?: CashAccount | null;
  bankAccount?: BankAccount | null;
  createdAt: string;
}

export type OtherIncomeCategory =
  | 'Rice Milling Charges'
  | 'Bardana / Jute Bags Sale'
  | 'Husk & Bhoosa Sale'
  | 'Weighbridge Fee (Kanda Parchi)'
  | 'Bank Profit / Profit on Deposit'
  | 'Scrap & Empty Drum Sale'
  | 'Other';

export interface OtherIncome {
  id: string;
  incomeNumber: string;
  category: OtherIncomeCategory | string;
  title: string;
  description?: string | null;
  amount: number | string;
  incomeDate: string;
  paymentMethod: 'CASH' | 'BANK';
  cashAccountId?: string | null;
  bankAccountId?: string | null;
  receivedFrom?: string | null;
  status: 'POSTED' | 'REVERSED';
  reversalRef?: string | null;
  cashAccount?: CashAccount | null;
  bankAccount?: BankAccount | null;
  createdAt: string;
}

export interface JournalEntryLine {
  id?: string;
  entryId?: string;
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  debit: number | string;
  credit: number | string;
  memo?: string | null;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  voucherType: 'GENERAL' | 'JOURNAL' | 'PAYMENT' | 'RECEIPT' | 'CASH_TRANSFER' | 'EXPENSE' | 'OTHER_INCOME' | 'REVERSAL';
  referenceNo?: string | null;
  narration?: string | null;
  totalDebit: number | string;
  totalCredit: number | string;
  status: 'POSTED' | 'REVERSED';
  createdAt: string;
  lines: JournalEntryLine[];
}

export interface GeneralLedgerLine {
  id: string;
  date: string;
  voucherNo: string;
  voucherType: string;
  referenceNo?: string;
  narration?: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: string;
  credit: string;
  runningBalance: string;
}

export type GeneralLedgerReport = GeneralLedgerLine[];

export interface TrialBalanceLine {
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: string;
  credit: string;
}

export interface TrialBalanceReport {
  asOfDate: string;
  lines: TrialBalanceLine[];
  totalDebits: string;
  totalCredits: string;
  isBalanced: boolean;
}

export interface CashOrBankTransaction {
  date: string;
  type: string;
  ref: string;
  description: string;
  deposit: string;
  withdrawal: string;
  runningBalance: string;
}

export interface CashBookReport {
  account: { id: string; name: string; balance: string };
  totalDeposits: string;
  totalWithdrawals: string;
  netFlow: string;
  transactions: CashOrBankTransaction[];
}

export interface BankBookReport {
  account: { id: string; bankName: string; accountNumber: string; currentBalance: string };
  totalDeposits: string;
  totalWithdrawals: string;
  netFlow: string;
  transactions: CashOrBankTransaction[];
}

export interface ProfitLossReport {
  period: { startDate?: string | null; endDate?: string | null };
  totalRevenue: string;
  costOfGoodsSold: string;
  grossProfit: string;
  grossMarginPct: string;
  totalExpenses: string;
  totalOtherIncome: string;
  netProfit: string;
  netMarginPct: string;
  expenseBreakdown: { category: string; amount: string }[];
  incomeBreakdown: { category: string; amount: string }[];
}

export interface BalanceSheetReport {
  asOfDate: string;
  assets: {
    currentAssets: {
      cashInHand: string;
      bankBalance: string;
      accountsReceivable: string;
      inventoryValuation: string;
      totalBagsInStock: number;
      totalWeightInStockKg: string;
      total: string;
    };
    fixedAssets: {
      plantMachinery: string;
      weighbridgeKanda: string;
      total: string;
    };
    totalAssets: string;
  };
  liabilities: {
    currentLiabilities: {
      accountsPayable: string;
      accruedExpenses: string;
      total: string;
    };
    totalLiabilities: string;
  };
  equity: {
    ownerCapital: string;
    retainedEarnings: string;
    totalEquity: string;
  };
  accountingEquationVerified: boolean;
}
