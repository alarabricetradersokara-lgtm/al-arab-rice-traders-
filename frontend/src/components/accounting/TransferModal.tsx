import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CashAccount, BankAccount } from '../../types/accounting';
import { AlertCircle, ArrowLeftRight } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  cashAccounts: CashAccount[];
  bankAccounts: BankAccount[];
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  cashAccounts,
  bankAccounts,
}) => {
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromAccountType, setFromAccountType] = useState<'CASH' | 'BANK'>('CASH');
  const [fromCashAccountId, setFromCashAccountId] = useState(cashAccounts[0]?.id || '');
  const [fromBankAccountId, setFromBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [toAccountType, setToAccountType] = useState<'CASH' | 'BANK'>('BANK');
  const [toCashAccountId, setToCashAccountId] = useState(cashAccounts[1]?.id || cashAccounts[0]?.id || '');
  const [toBankAccountId, setToBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [amount, setAmount] = useState<number | ''>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Transfer amount must be greater than zero');
      return;
    }

    if (fromAccountType === toAccountType) {
      if (fromAccountType === 'CASH' && fromCashAccountId === toCashAccountId) {
        setError('Source and destination cash accounts cannot be the same');
        return;
      }
      if (fromAccountType === 'BANK' && fromBankAccountId === toBankAccountId) {
        setError('Source and destination bank accounts cannot be the same');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        transferDate: new Date(transferDate).toISOString(),
        fromAccountType,
        fromCashAccountId: fromAccountType === 'CASH' ? fromCashAccountId : null,
        fromBankAccountId: fromAccountType === 'BANK' ? fromBankAccountId : null,
        toAccountType,
        toCashAccountId: toAccountType === 'CASH' ? toCashAccountId : null,
        toBankAccountId: toAccountType === 'BANK' ? toBankAccountId : null,
        amount: Number(amount),
        referenceNumber,
        notes,
      });
      setAmount('');
      setReferenceNumber('');
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSourceAccountName = () => {
    if (fromAccountType === 'CASH') {
      const c = cashAccounts.find((a) => a.id === fromCashAccountId);
      return c ? `${c.name} (Bal: Rs ${Number(c.balance).toLocaleString()})` : '';
    }
    const b = bankAccounts.find((a) => a.id === fromBankAccountId);
    return b ? `${b.bankName} - ${b.accountNumber} (Bal: Rs ${Number(b.currentBalance).toLocaleString()})` : '';
  };

  const getDestAccountName = () => {
    if (toAccountType === 'CASH') {
      const c = cashAccounts.find((a) => a.id === toCashAccountId);
      return c ? `${c.name} (Bal: Rs ${Number(c.balance).toLocaleString()})` : '';
    }
    const b = bankAccounts.find((a) => a.id === toBankAccountId);
    return b ? `${b.bankName} - ${b.accountNumber} (Bal: Rs ${Number(b.currentBalance).toLocaleString()})` : '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Funds Transfer (Cash & Bank)"
      subtitle="Transfer liquidity between cash drawers and bank accounts with automatic double-entry journal"
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
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Transfer Date *</label>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Transfer Amount (PKR) *</label>
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
        </div>

        {/* Source Section */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">📤 From Source Account</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFromAccountType('CASH')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  fromAccountType === 'CASH'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                Cash Drawer
              </button>
              <button
                type="button"
                onClick={() => setFromAccountType('BANK')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  fromAccountType === 'BANK'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                Bank Account
              </button>
            </div>
          </div>

          {fromAccountType === 'CASH' ? (
            <select
              value={fromCashAccountId}
              onChange={(e) => setFromCashAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-medium"
            >
              {cashAccounts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Balance: Rs {Number(c.balance).toLocaleString()})
                </option>
              ))}
            </select>
          ) : (
            <select
              value={fromBankAccountId}
              onChange={(e) => setFromBankAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-medium"
            >
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} - {b.accountNumber} (Balance: Rs {Number(b.currentBalance).toLocaleString()})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Transfer Indicator */}
        <div className="flex items-center justify-center -my-2 relative z-10">
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shadow-xs">
            <ArrowLeftRight className="w-4 h-4 rotate-90" />
          </div>
        </div>

        {/* Destination Section */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">📥 To Destination Account</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setToAccountType('CASH')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  toAccountType === 'CASH'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                Cash Drawer
              </button>
              <button
                type="button"
                onClick={() => setToAccountType('BANK')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  toAccountType === 'BANK'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                Bank Account
              </button>
            </div>
          </div>

          {toAccountType === 'CASH' ? (
            <select
              value={toCashAccountId}
              onChange={(e) => setToCashAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-medium"
            >
              {cashAccounts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Balance: Rs {Number(c.balance).toLocaleString()})
                </option>
              ))}
            </select>
          ) : (
            <select
              value={toBankAccountId}
              onChange={(e) => setToBankAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-medium"
            >
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} - {b.accountNumber} (Balance: Rs {Number(b.currentBalance).toLocaleString()})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Deposit Slip / Ref #</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. SLIP-8921 / CHQ-1049"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Transfer Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. End of day cash bank deposit"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

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
            {isSubmitting ? 'Transferring...' : 'Execute Funds Transfer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
