import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CashAccount, BankAccount, ExpenseCategory } from '../../types/accounting';
import { DollarSign, AlertCircle, ArrowDownRight } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  cashAccounts: CashAccount[];
  bankAccounts: BankAccount[];
}

const CATEGORIES: ExpenseCategory[] = [
  'Salaries',
  'Electricity',
  'Rent',
  'Loading/unloading',
  'Transportation',
  'Repair and maintenance',
  'Office expenses',
  'Other',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  cashAccounts,
  bankAccounts,
}) => {
  const [category, setCategory] = useState<ExpenseCategory>('Salaries');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [cashAccountId, setCashAccountId] = useState(cashAccounts[0]?.id || '');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [paidTo, setPaidTo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError('Expense title is required');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    if (paymentMethod === 'CASH' && !cashAccountId) {
      setError('Please select a cash account');
      return;
    }
    if (paymentMethod === 'BANK' && !bankAccountId) {
      setError('Please select a bank account');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        category,
        title,
        description,
        amount: Number(amount),
        expenseDate: new Date(expenseDate).toISOString(),
        paymentMethod,
        cashAccountId: paymentMethod === 'CASH' ? cashAccountId : null,
        bankAccountId: paymentMethod === 'BANK' ? bankAccountId : null,
        paidTo,
      });
      setTitle('');
      setDescription('');
      setAmount('');
      setPaidTo('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCash = cashAccounts.find((c) => c.id === cashAccountId);
  const selectedBank = bankAccounts.find((b) => b.id === bankAccountId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Business Expense"
      subtitle="Withdraw funds and post double-entry expense voucher to General Ledger"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Expense Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Expense Date *</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1">Expense Title / Reason *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Mill Generator Diesel Fuel / Staff Lunch / Office Stationery"
            className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Amount (PKR) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-[#718078]">Rs</span>
              <input
                type="number"
                step="any"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm font-bold text-[#172B25] focus:outline-none focus:border-emerald-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Paid To (Recipient)</label>
            <input
              type="text"
              value={paidTo}
              onChange={(e) => setPaidTo(e.target.value)}
              placeholder="e.g. PSO Petrol Pump / Electrician Tariq"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1.5">Payment Method & Source</label>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                paymentMethod === 'CASH'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                  : 'bg-white border-[#E4EAE5] text-[#718078] hover:bg-slate-50'
              }`}
            >
              💵 Cash in Hand
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('BANK')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                paymentMethod === 'BANK'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                  : 'bg-white border-[#E4EAE5] text-[#718078] hover:bg-slate-50'
              }`}
            >
              🏦 Bank Transfer / Cheque
            </button>
          </div>

          {paymentMethod === 'CASH' ? (
            <div>
              <label className="block text-xs text-[#718078] mb-1">Select Cash Drawer</label>
              <select
                value={cashAccountId}
                onChange={(e) => setCashAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
              >
                {cashAccounts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Balance: Rs {Number(c.balance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-[#718078] mb-1">Select Bank Account</label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountNumber} (Balance: Rs {Number(b.currentBalance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1">Additional Notes / Memo</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Invoice / voucher details, bill numbers..."
            className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Live Double Entry Posting Preview */}
        {Number(amount) > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1 mb-1.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
              Double-Entry General Ledger Posting Preview:
            </span>
            <div className="flex justify-between text-slate-600 py-0.5">
              <span>Dr. Operating Expense [{category}]</span>
              <span className="font-mono font-semibold text-emerald-700">+Rs {Number(amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600 py-0.5">
              <span>
                Cr.{' '}
                {paymentMethod === 'CASH'
                  ? selectedCash?.name || 'Cash in Hand'
                  : `${selectedBank?.bankName || 'Bank'} (${selectedBank?.accountNumber || ''})`}
              </span>
              <span className="font-mono font-semibold text-red-600">-Rs {Number(amount).toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4EAE5]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#E4EAE5] rounded-xl text-sm font-semibold text-[#718078] hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Posting Voucher...' : 'Confirm & Post Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
