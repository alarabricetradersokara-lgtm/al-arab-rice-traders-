import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../common/Button';
import { MetricCard } from '../common/MetricCard';
import { accountingService } from '../../services/accounting.service';
import type { Expense, BankAccount, CashAccount } from '../../types/accounting';
import {
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Wallet,
  Building2,
  Receipt,
  Coffee,
  Truck,
  Zap,
  Home,
  Wrench,
  HelpCircle,
  Share2,
} from 'lucide-react';

interface BranchExpensesSectionProps {
  selectedDate: string;
  onTotalExpensesChange?: (cashExpensesAmount: number) => void;
  showToast: (msg: string) => void;
}

const EXPENSE_CATEGORIES = [
  { id: 'Tea/Office', label: 'چائے و کھانا (Tea & Refreshments)', icon: Coffee },
  { id: 'Mill Labor', label: 'پلے داری و لوڈنگ (Labor / Palledari)', icon: Truck },
  { id: 'Electricity', label: 'بجلی و یوٹیلیٹیز (Electricity & Bills)', icon: Zap },
  { id: 'Rent', label: 'دکان / گودام کرایہ (Shop / Godown Rent)', icon: Home },
  { id: 'Transportation', label: 'گاڑی کرایہ و مال برداری (Freight & Cartage)', icon: Truck },
  { id: 'Repair', label: 'مرمت و دیکھ بھال (Repair & Maintenance)', icon: Wrench },
  { id: 'Other', label: 'متفرق اخراجات (Miscellaneous Expenses)', icon: HelpCircle },
];

export const BranchExpensesSection: React.FC<BranchExpensesSectionProps> = ({
  selectedDate,
  onTotalExpensesChange,
  showToast,
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [category, setCategory] = useState<string>('Tea/Office');
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [selectedCashId, setSelectedCashId] = useState<string>('');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [paidTo, setPaidTo] = useState<string>('');

  useEffect(() => {
    loadAccounts();
    loadExpenses();
  }, [selectedDate]);

  const loadAccounts = async () => {
    try {
      const [cash, banks] = await Promise.all([
        accountingService.getCashAccounts(),
        accountingService.getBankAccounts(),
      ]);
      setCashAccounts(cash || []);
      setBankAccounts(banks || []);
      if (cash && cash.length > 0 && !selectedCashId) setSelectedCashId(cash[0].id);
      if (banks && banks.length > 0 && !selectedBankId) setSelectedBankId(banks[0].id);
    } catch (err) {
      console.warn('Failed to load accounts for expenses', err);
    }
  };

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const res = await accountingService.getExpenses({
        startDate: selectedDate,
        endDate: selectedDate,
      });
      setExpenses(res.expenses || []);
    } catch (err) {
      console.warn('Failed to load daily expenses', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculations
  const { totalExpense, cashExpenseTotal, bankExpenseTotal } = useMemo(() => {
    let total = 0;
    let cash = 0;
    let bank = 0;

    for (const exp of expenses) {
      if (exp.status !== 'REVERSED') {
        const val = Number(exp.amount) || 0;
        total += val;
        if (exp.paymentMethod === 'CASH') cash += val;
        else if (exp.paymentMethod === 'BANK') bank += val;
      }
    }
    return { totalExpense: total, cashExpenseTotal: cash, bankExpenseTotal: bank };
  }, [expenses]);

  // Report cash expenses to parent for Galla reconciliation
  useEffect(() => {
    if (onTotalExpensesChange) {
      onTotalExpensesChange(cashExpenseTotal);
    }
  }, [cashExpenseTotal, onTotalExpensesChange]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showToast('براہ کرم خرچے کی درست رقم درج کریں۔');
      return;
    }
    if (!title.trim()) {
      showToast('براہ کرم خرچے کی تفصیل لکھیں۔');
      return;
    }

    try {
      setIsSubmitting(true);
      const newExp = await accountingService.createExpense({
        category,
        title: title.trim(),
        amount: numAmount,
        expenseDate: selectedDate,
        paymentMethod,
        cashAccountId: paymentMethod === 'CASH' ? selectedCashId : undefined,
        bankAccountId: paymentMethod === 'BANK' ? selectedBankId : undefined,
        paidTo: paidTo.trim() || undefined,
      });

      setExpenses((prev) => [newExp, ...prev]);
      setTitle('');
      setAmount('');
      setPaidTo('');
      showToast(`خرچہ (PKR ${numAmount.toLocaleString()}) کامیابی سے درج ہو گیا۔`);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'خرچہ درج کرنے میں ناکامی');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string, expTitle: string) => {
    if (window.confirm(`کیا آپ واقعی خرچہ "${expTitle}" کو ڈیلیٹ کرنا چاہتے ہیں؟ اس کی رقم گلے میں واپس بحال ہو جائے گی۔`)) {
      try {
        await accountingService.deleteExpense(id);
        setExpenses((prev) => prev.filter((x) => x.id !== id));
        showToast('خرچہ کامیابی سے حذف کر دیا گیا اور رقم بحال ہو گئی۔');
      } catch (err: any) {
        showToast(err.response?.data?.message || err.message || 'خرچہ ڈیلیٹ کرنے میں خرابی ہوئی۔');
      }
    }
  };

  const handleShareWhatsApp = () => {
    if (expenses.length === 0) {
      showToast('آج کوئی خرچہ درج نہیں ہے۔');
      return;
    }

    let text = `*العرب رائس ٹریڈرز (مانسہرہ دکان کے اخراجات)*%0A` +
      `📅 *تاریخ:* ${selectedDate}%0A` +
      `━━━━━━━━━━━━━━━━━━%0A`;

    expenses.forEach((exp, idx) => {
      text += `${idx + 1}. *${exp.title}* (${exp.category})%0A` +
        `   رقم: PKR ${Number(exp.amount).toLocaleString()} [${exp.paymentMethod === 'CASH' ? 'نقد گلہ' : 'بینک'}]%0A` +
        (exp.paidTo ? `   ادائیگی: ${exp.paidTo}%0A` : '');
    });

    text += `━━━━━━━━━━━━━━━━━━%0A` +
      `💰 *آج کے کل اخراجات:* PKR ${totalExpense.toLocaleString()}%0A` +
      `💵 *نقد ادا شدہ:* PKR ${cashExpenseTotal.toLocaleString()}%0A` +
      `🏦 *بینک سے ادا شدہ:* PKR ${bankExpenseTotal.toLocaleString()}%0A` +
      `شکریہ - مانسہرہ برانچ`;

    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Context */}
      <div className="bg-linear-to-r from-slate-900 via-rose-950 to-slate-900 p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider text-rose-300 uppercase">
              مانسہرہ برانچ روزانہ اخراجات رجسٹر
            </span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-rose-400" />
            <span>دکان کے روزانہ کے خرچے (Daily Branch Expenses)</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            بجلی کا بل، چائے، کھانا، پلے داری، گاڑی کرایہ اور متفرق خرچے یہاں درج کریں تاکہ گلے کا حساب بالکل درست رہے۔
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 text-right">
            <span className="block text-[10px] text-rose-200 font-medium">منتخب تاریخ</span>
            <span className="font-mono font-bold text-sm text-white flex items-center gap-1.5 justify-end">
              <Calendar className="w-3.5 h-3.5 text-rose-300" />
              {selectedDate}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShareWhatsApp}
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
            className="border-white/20 text-white hover:bg-white/10 text-xs"
          >
            واٹس ایپ شیئر
          </Button>
        </div>
      </div>

      {/* 2. Quick KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="آج کے کل اخراجات"
          value={`PKR ${totalExpense.toLocaleString()}`}
          unit="ٹوٹل خرچہ"
          icon={<DollarSign className="w-5 h-5" />}
          variant="amber"
        />
        <MetricCard
          label="نقد گلہ سے ادائیگی"
          value={`PKR ${cashExpenseTotal.toLocaleString()}`}
          unit="گلے سے مائنس"
          icon={<Wallet className="w-5 h-5 text-rose-700" />}
          variant="default"
        />
        <MetricCard
          label="بینک سے ادائیگی"
          value={`PKR ${bankExpenseTotal.toLocaleString()}`}
          unit="بینک ٹرانسفر"
          icon={<Building2 className="w-5 h-5 text-blue-700" />}
          variant="blue"
        />
        <MetricCard
          label="کل اخراجات اینٹریز"
          value={expenses.length.toString()}
          unit="رسیدیں"
          icon={<Receipt className="w-5 h-5 text-slate-600" />}
          variant="default"
        />
      </div>

      {/* 3. Main Action Grid: Input Form (Left) & Expenses List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-rose-600" />
              <span>نیا خرچہ درج کریں (Record Expense)</span>
            </h3>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              دکان کا خرچ
            </span>
          </div>

          <form onSubmit={handleSaveExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 text-right">
                خرچے کی قسم (Category) *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500/20 outline-none cursor-pointer"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 text-right">
                خرچے کی تفصیل (Title / Details) *
              </label>
              <input
                type="text"
                required
                placeholder="مثلاً چائے بسکٹ، گاڑی پلے داری، لیسکو بل"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500/20 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-right">
                  رقم (Amount in PKR) *
                </label>
                <div className="flex items-center bg-white border border-rose-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-rose-500/20">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full px-3 py-2 text-sm font-mono font-bold text-rose-800 outline-none"
                  />
                  <span className="px-2.5 py-2 bg-rose-50 text-[11px] font-bold text-rose-800 border-l border-rose-200 shrink-0">
                    روپے
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-right">
                  کس کو ادا کیا (Paid To)
                </label>
                <input
                  type="text"
                  placeholder="مثلاً پلے دار، ہوٹل، واپڈا"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500/20 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 text-right">
                ادائیگی کا ذریعہ (Payment Source) *
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'CASH'
                      ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5 text-rose-600" />
                  <span>نقد گلہ کیش</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'BANK'
                      ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>بینک ٹرانسفر</span>
                </button>
              </div>

              {paymentMethod === 'BANK' && (
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs font-semibold text-blue-900 outline-none"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - {b.accountNumber}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 bg-rose-700 hover:bg-rose-600 font-bold text-xs shadow-xs text-white"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              isLoading={isSubmitting}
            >
              خرچہ محفوظ کریں (Save Expense)
            </Button>
          </form>
        </div>

        {/* Expenses Table */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                آج کے اخراجات کی تفصیل ({expenses.length} رسیدیں)
              </h3>
              <p className="text-[11px] text-slate-500">یہ اخراجات گلے کی نقد رقم سے خود بخود منہا ہوں گے</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-rose-700 block">
                کل خرچہ: PKR {totalExpense.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">تفصیل و مد</th>
                  <th className="py-2.5 px-3">قسم</th>
                  <th className="py-2.5 px-3">ادائیگی ذریعہ</th>
                  <th className="py-2.5 px-3">کس کو دیا</th>
                  <th className="py-2.5 px-3 text-right font-bold text-rose-700">رقم</th>
                  <th className="py-2.5 px-3 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      آج ابھی تک کوئی خرچہ درج نہیں ہوا ہے۔ بائیں طرف سے نیا خرچہ درج کریں۔
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{exp.title}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          exp.paymentMethod === 'CASH'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {exp.paymentMethod === 'CASH' ? '💵 نقد گلہ' : `🏦 ${exp.bankAccount?.bankName || 'بینک'}`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{exp.paidTo || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                        PKR {Number(exp.amount).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp.id, exp.title)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                          title="حذف کریں"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
