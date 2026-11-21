import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { partyService } from '../../services/party.service';
import { purchaseService } from '../../services/purchase.service';
import { Customer } from '../../types/party';
import { CashAccount, BankAccount } from '../../types/purchase';
import { DollarSign, CreditCard, Calendar, CheckCircle2, AlertTriangle, Building2 } from 'lucide-react';

interface CustomerReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess: (newBalance: string) => void;
}

export const CustomerReceiptModal: React.FC<CustomerReceiptModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK' | 'CHEQUE'>('CASH');
  const [selectedCashAccountId, setSelectedCashAccountId] = useState('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setReceiptDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('CASH');
      setChequeNumber('');
      setChequeDate('');
      setReferenceNumber('');
      setNotes('');
      setError(null);

      // Load accounts
      Promise.all([purchaseService.getCashAccounts(), purchaseService.getBankAccounts()])
        .then(([cash, banks]) => {
          setCashAccounts(cash);
          setBankAccounts(banks);
          if (cash.length > 0) setSelectedCashAccountId(cash[0].id);
          if (banks.length > 0) setSelectedBankAccountId(banks[0].id);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!customer) return null;

  const currentBal = Number(customer.currentBalance || 0);
  const numAmount = parseFloat(amount) || 0;
  const projectedBalance = Math.max(0, currentBal - numAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || numAmount <= 0) {
      setError('Please enter a valid receipt amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await partyService.recordCustomerReceipt(customer.id, {
        amount: numAmount,
        receiptDate: new Date(receiptDate).toISOString(),
        paymentMethod,
        cashAccountId: paymentMethod === 'CASH' ? selectedCashAccountId : undefined,
        bankAccountId: paymentMethod === 'BANK' || paymentMethod === 'CHEQUE' ? selectedBankAccountId : undefined,
        chequeNumber: paymentMethod === 'CHEQUE' ? chequeNumber : undefined,
        chequeDate: paymentMethod === 'CHEQUE' && chequeDate ? new Date(chequeDate).toISOString() : undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onSuccess(res.newBalance);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Customer Cash / Bank Receipt (Vasooli)" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* Customer Context Banner */}
        <div className="p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5] flex justify-between items-center text-xs">
          <div>
            <span className="font-bold text-[#172B25] block text-sm">{customer.name}</span>
            <span className="text-[#718078]">{customer.businessName || customer.city} • {customer.phone}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#718078] uppercase font-bold block">Current Receivable</span>
            <span className="font-mono font-bold text-[#087A55] text-sm">
              PKR {currentBal.toLocaleString()} (Dr)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Receipt Amount (PKR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none font-mono font-bold text-[#087A55]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl focus:border-[#087A55] outline-none font-semibold"
            >
              <option value="CASH">Cash Counter Receipt</option>
              <option value="BANK">Online Bank Transfer</option>
              <option value="CHEQUE">Bank Clearing Cheque</option>
            </select>
          </div>
        </div>

        {paymentMethod === 'CASH' && (
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Deposit to Cash Drawer / Till
            </label>
            <select
              value={selectedCashAccountId}
              onChange={(e) => setSelectedCashAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl outline-none"
            >
              {cashAccounts.map((ca) => (
                <option key={ca.id} value={ca.id}>
                  {ca.name} ({ca.code}) — Current Bal: PKR {Number(ca.balance).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {(paymentMethod === 'BANK' || paymentMethod === 'CHEQUE') && (
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Deposit into Bank Account
            </label>
            <select
              value={selectedBankAccountId}
              onChange={(e) => setSelectedBankAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl outline-none"
            >
              {bankAccounts.map((ba) => (
                <option key={ba.id} value={ba.id}>
                  {ba.bankName} - {ba.accountTitle} ({ba.accountNumber})
                </option>
              ))}
            </select>
          </div>
        )}

        {paymentMethod === 'CHEQUE' && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200">
            <div>
              <label className="block text-xs font-semibold text-[#172B25] mb-1">Cheque Number</label>
              <input
                type="text"
                value={chequeNumber}
                onChange={(e) => setChequeNumber(e.target.value)}
                placeholder="e.g. CHQ-991204"
                className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172B25] mb-1">Cheque Maturity Date</label>
              <input
                type="date"
                value={chequeDate}
                onChange={(e) => setChequeDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl outline-none"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Receipt Date</label>
            <input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Deposit Slip / Ref #</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. SLIP-491"
              className="w-full px-3 py-2 text-xs border border-[#E4EAE5] rounded-xl outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1">Notes / Description</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Cleared bill INV-8821 via online IBFT"
            className="w-full px-3 py-2 text-xs border border-[#E4EAE5] rounded-xl outline-none"
          />
        </div>

        {/* Projected Balance Pill */}
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex justify-between items-center font-mono">
          <span className="text-[#087A55] font-semibold">Remaining Customer Debt:</span>
          <span className="font-bold text-sm text-[#087A55]">
            PKR {projectedBalance.toLocaleString()} (Dr)
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#E4EAE5]">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Posting Receipt...' : 'Save & Credit Khatabook'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
