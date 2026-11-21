import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CommissionAgent } from '../../types/advanced';
import { CashAccount, BankAccount } from '../../types/accounting';
import { AlertCircle } from 'lucide-react';

interface CommissionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  agents: CommissionAgent[];
  cashAccounts: CashAccount[];
  bankAccounts: BankAccount[];
}

export const CommissionPaymentModal: React.FC<CommissionPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  agents,
  cashAccounts,
  bankAccounts,
}) => {
  const [agentId, setAgentId] = useState(agents[0]?.id || '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [cashAccountId, setCashAccountId] = useState(cashAccounts[0]?.id || '');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAgent = agents.find((a) => a.id === agentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentId) {
      setError('Please select an agent');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Payment amount must be greater than zero');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        agentId,
        paymentDate: new Date(paymentDate).toISOString(),
        amount: Number(amount),
        paymentMethod,
        cashAccountId: paymentMethod === 'CASH' ? cashAccountId : null,
        bankAccountId: paymentMethod === 'BANK' ? bankAccountId : null,
        referenceNumber,
        notes,
      });
      setAmount('');
      setReferenceNumber('');
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disburse Commission Payment"
      subtitle="Pay outstanding brokerage to agent via cash drawer or bank transfer"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1">Select Broker *</label>
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-600"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (Outstanding: Rs {Number(a.currentBalance).toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Payment Date *</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Disbursed Amount (PKR) *</label>
            <input
              type="number"
              step="any"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1.5">Payment Method & Account</label>
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
              🏦 Bank Cheque / Transfer
            </button>
          </div>

          {paymentMethod === 'CASH' ? (
            <select
              value={cashAccountId}
              onChange={(e) => setCashAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            >
              {cashAccounts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Bal: Rs {Number(c.balance).toLocaleString()})
                </option>
              ))}
            </select>
          ) : (
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            >
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} - {b.accountNumber} (Bal: Rs {Number(b.currentBalance).toLocaleString()})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Receipt / Voucher #</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. VCH-0921"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment remarks..."
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
            {isSubmitting ? 'Processing...' : 'Disburse Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
