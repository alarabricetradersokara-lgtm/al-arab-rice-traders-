import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CashAccount, BankAccount, OtherIncomeCategory } from '../../types/accounting';
import { AlertCircle, ArrowUpRight } from 'lucide-react';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  cashAccounts: CashAccount[];
  bankAccounts: BankAccount[];
}

const INCOME_CATEGORIES: OtherIncomeCategory[] = [
  'Rice Milling Charges',
  'Bardana / Jute Bags Sale',
  'Husk & Bhoosa Sale',
  'Weighbridge Fee (Kanda Parchi)',
  'Bank Profit / Profit on Deposit',
  'Scrap & Empty Drum Sale',
  'Other',
];

export const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  cashAccounts,
  bankAccounts,
}) => {
  const [category, setCategory] = useState<OtherIncomeCategory>('Rice Milling Charges');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [cashAccountId, setCashAccountId] = useState(cashAccounts[0]?.id || '');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError('Income description / title is required');
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
        incomeDate: new Date(incomeDate).toISOString(),
        paymentMethod,
        cashAccountId: paymentMethod === 'CASH' ? cashAccountId : null,
        bankAccountId: paymentMethod === 'BANK' ? bankAccountId : null,
        receivedFrom,
      });
      setTitle('');
      setDescription('');
      setAmount('');
      setReceivedFrom('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to record income');
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
      title="Record Other Business Income"
      subtitle="Deposit funds from milling, by-products or weighbridge into cash/bank and post to General Ledger"
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
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Income Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as OtherIncomeCategory)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-medium"
            >
              {INCOME_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Receipt Date *</label>
            <input
              type="date"
              value={incomeDate}
              onChange={(e) => setIncomeDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1">Income Title / Particulars *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Commercial Paddy Husking Charges (500 Bags) / 100 Maund Husk Sale"
            className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Amount Received (PKR) *</label>
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
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Received From (Payer)</label>
            <input
              type="text"
              value={receivedFrom}
              onChange={(e) => setReceivedFrom(e.target.value)}
              placeholder="e.g. Haji Bashir / Malik Poultry Feeds"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1.5">Deposit Destination</label>
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
              💵 Deposit to Cash Drawer
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
              🏦 Deposit to Bank Account
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
                    {c.name} (Current: Rs {Number(c.balance).toLocaleString()})
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
                    {b.bankName} - {b.accountNumber} (Current: Rs {Number(b.currentBalance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1">Receipt Remarks / Particulars</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Vehicle number, weight slip number, receipt details..."
            className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Live Double Entry Posting Preview */}
        {Number(amount) > 0 && (
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs">
            <span className="font-bold text-emerald-800 flex items-center gap-1 mb-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
              Double-Entry General Ledger Posting Preview:
            </span>
            <div className="flex justify-between text-slate-700 py-0.5">
              <span>
                Dr.{' '}
                {paymentMethod === 'CASH'
                  ? selectedCash?.name || 'Cash in Hand'
                  : `${selectedBank?.bankName || 'Bank'} (${selectedBank?.accountNumber || ''})`}
              </span>
              <span className="font-mono font-semibold text-emerald-700">+Rs {Number(amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-700 py-0.5">
              <span>Cr. Revenue / Other Income [{category}]</span>
              <span className="font-mono font-semibold text-emerald-800">+Rs {Number(amount).toLocaleString()}</span>
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
            {isSubmitting ? 'Posting Income...' : 'Confirm & Deposit Income'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
