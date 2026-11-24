import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import {
  CashAccount,
  BankAccount,
  CashTransfer,
  Expense,
  OtherIncome,
  JournalEntry,
} from '../../types/accounting';
import { accountingService } from '../../services/accounting.service';
import { ExpenseModal } from './ExpenseModal';
import { IncomeModal } from './IncomeModal';
import { TransferModal } from './TransferModal';
import { JournalEntryModal } from './JournalEntryModal';
import { TrialBalanceModal } from './TrialBalanceModal';
import { ProfitLossModal } from './ProfitLossModal';
import { BalanceSheetModal } from './BalanceSheetModal';
import { CashBookModal } from './CashBookModal';
import { BankBookModal } from './BankBookModal';
import { GeneralLedgerModal } from './GeneralLedgerModal';
import { CreateBankAccountModal } from './CreateBankAccountModal';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  ArrowLeftRight,
  FileText,
  BookOpen,
  Scale,
  Landmark,
  Wallet,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  Filter,
  Eye,
} from 'lucide-react';

export const FinancialDashboardScreen: React.FC = () => {
  // Data states
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<OtherIncome[]>([]);
  const [transfers, setTransfers] = useState<CashTransfer[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'INCOMES' | 'TRANSFERS' | 'JOURNALS' | 'ACCOUNTS'>('EXPENSES');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isTrialBalanceOpen, setIsTrialBalanceOpen] = useState(false);
  const [isProfitLossOpen, setIsProfitLossOpen] = useState(false);
  const [isBalanceSheetOpen, setIsBalanceSheetOpen] = useState(false);
  const [isCashBookOpen, setIsCashBookOpen] = useState(false);
  const [isBankBookOpen, setIsBankBookOpen] = useState(false);
  const [isGeneralLedgerOpen, setIsGeneralLedgerOpen] = useState(false);
  const [isCreateBankOpen, setIsCreateBankOpen] = useState(false);

  // Reversal state
  const [reversingId, setReversingId] = useState<string | null>(null);

  const handleDeleteBank = async (id: string, name: string) => {
    if (window.confirm(`کیا آپ واقعی بینک کھاتہ "${name}" کو حذف کرنا چاہتے ہیں؟`)) {
      try {
        await accountingService.deleteBankAccount(id);
        loadAllData();
      } catch (err: any) {
        alert(err.response?.data?.message || err.message || 'بینک اکاؤنٹ ڈیلیٹ کرنے میں خرابی ہوئی۔');
      }
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [cashRes, bankRes, expRes, incRes, trfRes, jvRes] = await Promise.all([
        accountingService.getCashAccounts(),
        accountingService.getBankAccounts(),
        accountingService.getExpenses(),
        accountingService.getOtherIncomes(),
        accountingService.getTransfers(),
        accountingService.getJournalEntries(),
      ]);

      setCashAccounts(cashRes);
      setBankAccounts(bankRes);
      setExpenses(expRes.expenses);
      setIncomes(incRes.incomes);
      setTransfers(trfRes);
      setJournals(jvRes);
    } catch (e) {
      console.error('Failed to load accounting data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Totals calculations
  const totalCashInHand = cashAccounts.reduce((acc, c) => acc + Number(c.balance || 0), 0);
  const totalBankBalances = bankAccounts.reduce((acc, b) => acc + Number(b.currentBalance || 0), 0);
  const totalActiveExpenses = expenses
    .filter((e) => e.status !== 'REVERSED')
    .reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const totalActiveIncomes = incomes
    .filter((i) => i.status !== 'REVERSED')
    .reduce((acc, i) => acc + Number(i.amount || 0), 0);
  const totalLiquidity = totalCashInHand + totalBankBalances;

  // Handlers for modal submissions
  const handleExpenseSubmit = async (data: any) => {
    await accountingService.createExpense(data);
    await loadAllData();
  };

  const handleIncomeSubmit = async (data: any) => {
    await accountingService.createOtherIncome(data);
    await loadAllData();
  };

  const handleTransferSubmit = async (data: any) => {
    await accountingService.createTransfer(data);
    await loadAllData();
  };

  const handleJournalSubmit = async (data: any) => {
    await accountingService.createJournalEntry(data);
    await loadAllData();
  };

  // Reversals
  const handleReverseExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to reverse this expense? This will post a compensating double-entry journal reversal and restore the account balance.')) {
      return;
    }
    try {
      setReversingId(id);
      await accountingService.reverseExpense(id, 'User initiated compensation reversal');
      await loadAllData();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to reverse expense');
    } finally {
      setReversingId(null);
    }
  };

  const handleReverseIncome = async (id: string) => {
    if (!window.confirm('Are you sure you want to reverse this income entry? This will post a compensating double-entry journal reversal and deduct the balance.')) {
      return;
    }
    try {
      setReversingId(id);
      await accountingService.reverseOtherIncome(id, 'User initiated compensation reversal');
      await loadAllData();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to reverse income');
    } finally {
      setReversingId(null);
    }
  };

  const handleReverseTransfer = async (id: string) => {
    if (!window.confirm('Are you sure you want to reverse this funds transfer? Both source and destination accounts will be restored.')) {
      return;
    }
    try {
      setReversingId(id);
      await accountingService.reverseTransfer(id, 'User initiated transfer reversal');
      await loadAllData();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to reverse transfer');
    } finally {
      setReversingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[#172B25] tracking-tight">
              Financial Accounting & Treasury
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Double-Entry ERP
            </span>
          </div>
          <p className="text-xs text-[#718078] mt-1">
            General Ledger, Cash & Bank Books, Operating Expenses, Other Income, and Real-Time Financial Statements
          </p>
        </div>

        {/* Quick Transaction Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
          <button
            onClick={() => setIsIncomeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Other Income
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#064E3B] hover:bg-[#043327] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Funds Transfer
          </button>
          <button
            onClick={() => setIsJournalModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Journal Voucher (JV)
          </button>
          <button
            onClick={loadAllData}
            disabled={loading}
            className="p-2 bg-white border border-[#E4EAE5] text-[#718078] hover:text-[#172B25] rounded-xl text-xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Financial Health KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Cash in Hand */}
        <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cash in Hand</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#172B25] mt-2">
            Rs {totalCashInHand.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Across {cashAccounts.length} Cash Drawers</p>
        </div>

        {/* Bank Balances */}
        <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bank Accounts</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#172B25] mt-2">
            Rs {totalBankBalances.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Across {bankAccounts.length} Bank Accounts</p>
        </div>

        {/* Total Liquidity */}
        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Liquidity</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-emerald-950 mt-2">
            Rs {totalLiquidity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-emerald-700 mt-0.5">Immediate Available Cash</p>
        </div>

        {/* Total Expenses */}
        <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Operating Expenses</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-red-600 mt-2">
            Rs {totalActiveExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{expenses.filter((e) => e.status !== 'REVERSED').length} Active Postings</p>
        </div>

        {/* Other Income */}
        <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Other Income</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-emerald-800 mt-2">
            Rs {totalActiveIncomes.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Milling, By-Products & Kanda</p>
        </div>
      </div>

      {/* Financial Statements Quick-Access Strip */}
      <div className="bg-[#F5F7F5] border border-[#E4EAE5] p-3.5 rounded-2xl">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-[#172B25] uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            Certified Financial Statements & Audit Ledgers
          </span>
          <span className="text-[11px] text-[#718078]">Derived directly from transactional general ledger</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => setIsTrialBalanceOpen(true)}
            className="flex items-center gap-2 p-2.5 bg-white hover:bg-emerald-50/60 border border-[#E4EAE5] hover:border-emerald-300 rounded-xl transition-all cursor-pointer text-left shadow-2xs"
          >
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#172B25]">Trial Balance</p>
              <p className="text-[10px] text-[#718078]">Dr = Cr proof</p>
            </div>
          </button>

          <button
            onClick={() => setIsProfitLossOpen(true)}
            className="flex items-center gap-2 p-2.5 bg-white hover:bg-emerald-50/60 border border-[#E4EAE5] hover:border-emerald-300 rounded-xl transition-all cursor-pointer text-left shadow-2xs"
          >
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#172B25]">Profit & Loss</p>
              <p className="text-[10px] text-[#718078]">Income Statement</p>
            </div>
          </button>

          <button
            onClick={() => setIsBalanceSheetOpen(true)}
            className="flex items-center gap-2 p-2.5 bg-white hover:bg-emerald-50/60 border border-[#E4EAE5] hover:border-emerald-300 rounded-xl transition-all cursor-pointer text-left shadow-2xs"
          >
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-800">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#172B25]">Balance Sheet</p>
              <p className="text-[10px] text-[#718078]">Assets = L + E</p>
            </div>
          </button>

          <button
            onClick={() => setIsCashBookOpen(true)}
            className="flex items-center gap-2 p-2.5 bg-white hover:bg-emerald-50/60 border border-[#E4EAE5] hover:border-emerald-300 rounded-xl transition-all cursor-pointer text-left shadow-2xs"
          >
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#172B25]">Cash Book</p>
              <p className="text-[10px] text-[#718078]">Roznamcha Naqd</p>
            </div>
          </button>

          <button
            onClick={() => setIsBankBookOpen(true)}
            className="flex items-center gap-2 p-2.5 bg-white hover:bg-emerald-50/60 border border-[#E4EAE5] hover:border-emerald-300 rounded-xl transition-all cursor-pointer text-left shadow-2xs"
          >
            <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#172B25]">Bank Book</p>
              <p className="text-[10px] text-[#718078]">Roznamcha Bank</p>
            </div>
          </button>

          <button
            onClick={() => setIsGeneralLedgerOpen(true)}
            className="flex items-center gap-2 p-2.5 bg-white hover:bg-emerald-50/60 border border-[#E4EAE5] hover:border-emerald-300 rounded-xl transition-all cursor-pointer text-left shadow-2xs"
          >
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-800">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#172B25]">General Ledger</p>
              <p className="text-[10px] text-[#718078]">Chart of Accounts</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-[#E4EAE5] shadow-xs overflow-hidden">
        <div className="flex border-b border-[#E4EAE5] bg-[#F5F7F5] px-4 pt-2">
          <button
            onClick={() => setActiveTab('EXPENSES')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'EXPENSES'
                ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-[#718078] hover:text-[#172B25]'
            }`}
          >
            Operating Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('INCOMES')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'INCOMES'
                ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-[#718078] hover:text-[#172B25]'
            }`}
          >
            Other Income ({incomes.length})
          </button>
          <button
            onClick={() => setActiveTab('TRANSFERS')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'TRANSFERS'
                ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-[#718078] hover:text-[#172B25]'
            }`}
          >
            Cash & Bank Transfers ({transfers.length})
          </button>
          <button
            onClick={() => setActiveTab('JOURNALS')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'JOURNALS'
                ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-[#718078] hover:text-[#172B25]'
            }`}
          >
            General Journal (JV) ({journals.length})
          </button>
          <button
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'ACCOUNTS'
                ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-[#718078] hover:text-[#172B25]'
            }`}
          >
            Accounts Directory ({cashAccounts.length + bankAccounts.length})
          </button>
        </div>

        {/* Tab 1: Operating Expenses */}
        {activeTab === 'EXPENSES' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[#172B25] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-28">Expense #</th>
                    <th className="py-2.5 px-3 w-24">Date</th>
                    <th className="py-2.5 px-3 w-36">Category</th>
                    <th className="py-2.5 px-3">Title / Particulars</th>
                    <th className="py-2.5 px-3 w-32">Payment Source</th>
                    <th className="py-2.5 px-3 w-36">Paid To</th>
                    <th className="py-2.5 px-3 w-28 text-right">Amount (Rs)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Status</th>
                    <th className="py-2.5 px-3 w-20 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Loading operating expenses...
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No expenses recorded yet. Click "+ Record Expense" to post your first expense.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{exp.expenseNumber}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {new Date(exp.expenseDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#172B25]">
                          <div>{exp.title}</div>
                          {exp.description && <div className="text-[10px] text-slate-400">{exp.description}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {exp.paymentMethod === 'CASH'
                            ? `💵 ${exp.cashAccount?.name || 'Cash'}`
                            : `🏦 ${exp.bankAccount?.bankName || 'Bank'}`}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{exp.paidTo || '-'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600">
                          Rs {Number(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {exp.status === 'POSTED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              POSTED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800" title={`Reversal ref: ${exp.reversalRef}`}>
                              REVERSED
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {exp.status === 'POSTED' && (
                            <button
                              onClick={() => handleReverseExpense(exp.id)}
                              disabled={reversingId === exp.id}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-30"
                              title="Reverse Expense Voucher"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Other Incomes */}
        {activeTab === 'INCOMES' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[#172B25] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-28">Income #</th>
                    <th className="py-2.5 px-3 w-24">Date</th>
                    <th className="py-2.5 px-3 w-44">Category</th>
                    <th className="py-2.5 px-3">Title / Particulars</th>
                    <th className="py-2.5 px-3 w-32">Deposit Account</th>
                    <th className="py-2.5 px-3 w-36">Received From</th>
                    <th className="py-2.5 px-3 w-28 text-right">Amount (Rs)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Status</th>
                    <th className="py-2.5 px-3 w-20 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Loading other business incomes...
                      </td>
                    </tr>
                  ) : incomes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No other income records found. Click "+ Other Income" to record commercial milling or byproduct sales.
                      </td>
                    </tr>
                  ) : (
                    incomes.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{inc.incomeNumber}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {new Date(inc.incomeDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {inc.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#172B25]">
                          <div>{inc.title}</div>
                          {inc.description && <div className="text-[10px] text-slate-400">{inc.description}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {inc.paymentMethod === 'CASH'
                            ? `💵 ${inc.cashAccount?.name || 'Cash'}`
                            : `🏦 ${inc.bankAccount?.bankName || 'Bank'}`}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{inc.receivedFrom || '-'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          Rs {Number(inc.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {inc.status === 'POSTED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              POSTED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800" title={`Reversal ref: ${inc.reversalRef}`}>
                              REVERSED
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {inc.status === 'POSTED' && (
                            <button
                              onClick={() => handleReverseIncome(inc.id)}
                              disabled={reversingId === inc.id}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-30"
                              title="Reverse Income Voucher"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Cash & Bank Transfers */}
        {activeTab === 'TRANSFERS' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[#172B25] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-28">Transfer #</th>
                    <th className="py-2.5 px-3 w-24">Date</th>
                    <th className="py-2.5 px-3">From Source</th>
                    <th className="py-2.5 px-3">To Destination</th>
                    <th className="py-2.5 px-3 w-28">Slip / Ref</th>
                    <th className="py-2.5 px-3 w-28 text-right">Amount (Rs)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Status</th>
                    <th className="py-2.5 px-3 w-20 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Loading cash transfers...
                      </td>
                    </tr>
                  ) : transfers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No funds transfers recorded yet. Click "+ Funds Transfer" to move cash to bank or between drawers.
                      </td>
                    </tr>
                  ) : (
                    transfers.map((trf) => (
                      <tr key={trf.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{trf.transferNumber}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {new Date(trf.transferDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {trf.fromAccountType === 'CASH'
                            ? `💵 ${trf.fromCashAccount?.name || 'Cash'}`
                            : `🏦 ${trf.fromBankAccount?.bankName || 'Bank'} (${trf.fromBankAccount?.accountNumber || ''})`}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-emerald-800">
                          {trf.toAccountType === 'CASH'
                            ? `💵 ${trf.toCashAccount?.name || 'Cash'}`
                            : `🏦 ${trf.toBankAccount?.bankName || 'Bank'} (${trf.toBankAccount?.accountNumber || ''})`}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{trf.referenceNumber || '-'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          Rs {Number(trf.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {trf.status === 'POSTED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              POSTED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              REVERSED
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {trf.status === 'POSTED' && (
                            <button
                              onClick={() => handleReverseTransfer(trf.id)}
                              disabled={reversingId === trf.id}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-30"
                              title="Reverse Transfer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: General Journal (JV) */}
        {activeTab === 'JOURNALS' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[#172B25] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-28">Voucher #</th>
                    <th className="py-2.5 px-3 w-24">Date</th>
                    <th className="py-2.5 px-3 w-28">Type</th>
                    <th className="py-2.5 px-3">Narration</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total Debit</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total Credit</th>
                    <th className="py-2.5 px-3 w-24 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Loading Journal Entries...
                      </td>
                    </tr>
                  ) : journals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No journal entries posted yet.
                      </td>
                    </tr>
                  ) : (
                    journals.map((jv) => (
                      <tr key={jv.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{jv.entryNumber}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {new Date(jv.entryDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                            {jv.voucherType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#172B25]">{jv.narration}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-800">
                          Rs {Number(jv.totalDebit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-800">
                          Rs {Number(jv.totalCredit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {jv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Accounts Directory */}
        {activeTab === 'ACCOUNTS' && (
          <div className="p-5 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-[#172B25] uppercase tracking-wider mb-3">Cash Drawers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cashAccounts.map((c) => (
                  <div key={c.id} className="p-4 bg-white border border-[#E4EAE5] rounded-xl shadow-2xs flex justify-between items-center">
                    <div>
                      <span className="font-mono text-xs text-slate-400">[{c.code}]</span>
                      <h4 className="text-base font-bold text-[#172B25]">{c.name}</h4>
                      <span className="text-[10px] text-emerald-700 font-semibold">Active Counter Drawer</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Balance</span>
                      <p className="text-lg font-extrabold text-emerald-800 font-mono">
                        Rs {Number(c.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#172B25] uppercase tracking-wider">
                  Bank Accounts (بینک کھاتے)
                </h3>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsCreateBankOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="bg-blue-700 hover:bg-blue-600 font-bold text-xs"
                >
                  + نیا بینک اکاؤنٹ درج کریں
                </Button>
              </div>

              {bankAccounts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                  <Landmark className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">ابھی کوئی بینک اکاؤنٹ درج نہیں ہے۔</p>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsCreateBankOpen(true)}
                    className="mt-3 bg-blue-700 hover:bg-blue-600 font-bold text-xs"
                  >
                    + پہلا بینک اکاؤنٹ شامل کریں
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bankAccounts.map((b) => (
                    <div key={b.id} className="p-4 bg-white border border-[#E4EAE5] rounded-xl shadow-2xs flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-400">[{b.code}]</span>
                          <h4 className="text-base font-bold text-[#172B25]">{b.bankName}</h4>
                        </div>
                        <p className="text-xs text-slate-600 font-mono">A/C: {b.accountNumber}</p>
                        {b.branchName && <p className="text-[11px] text-slate-500 font-medium">{b.branchName}</p>}
                        {b.iban && <p className="text-[10px] text-slate-400 font-mono">IBAN: {b.iban}</p>}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500">Available Balance</span>
                        <p className="text-lg font-extrabold text-blue-900 font-mono">
                          Rs {Number(b.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleDeleteBank(b.id, b.bankName)}
                          className="text-[10px] text-red-500 hover:text-red-700 hover:underline mt-1 font-semibold cursor-pointer block ml-auto"
                        >
                          حذف کریں (Delete)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateBankAccountModal
        isOpen={isCreateBankOpen}
        onClose={() => setIsCreateBankOpen(false)}
        onSuccess={() => {
          loadAllData();
        }}
      />
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={handleExpenseSubmit}
        cashAccounts={cashAccounts}
        bankAccounts={bankAccounts}
      />

      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSubmit={handleIncomeSubmit}
        cashAccounts={cashAccounts}
        bankAccounts={bankAccounts}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSubmit={handleTransferSubmit}
        cashAccounts={cashAccounts}
        bankAccounts={bankAccounts}
      />

      <JournalEntryModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        onSubmit={handleJournalSubmit}
      />

      <TrialBalanceModal
        isOpen={isTrialBalanceOpen}
        onClose={() => setIsTrialBalanceOpen(false)}
      />

      <ProfitLossModal
        isOpen={isProfitLossOpen}
        onClose={() => setIsProfitLossOpen(false)}
      />

      <BalanceSheetModal
        isOpen={isBalanceSheetOpen}
        onClose={() => setIsBalanceSheetOpen(false)}
      />

      <CashBookModal
        isOpen={isCashBookOpen}
        onClose={() => setIsCashBookOpen(false)}
        cashAccounts={cashAccounts}
      />

      <BankBookModal
        isOpen={isBankBookOpen}
        onClose={() => setIsBankBookOpen(false)}
        bankAccounts={bankAccounts}
      />

      <GeneralLedgerModal
        isOpen={isGeneralLedgerOpen}
        onClose={() => setIsGeneralLedgerOpen(false)}
      />
    </div>
  );
};
