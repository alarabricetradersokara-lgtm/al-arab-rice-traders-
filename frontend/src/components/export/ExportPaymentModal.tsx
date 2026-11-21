import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ExportInvoice } from '../../types/advanced';
import { BankAccount } from '../../types/accounting';
import { AlertCircle, DollarSign, TrendingUp, TrendingDown, Building2 } from 'lucide-react';

interface ExportPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  invoices: ExportInvoice[];
  bankAccounts: BankAccount[];
}

export const ExportPaymentModal: React.FC<ExportPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  invoices,
  bankAccounts,
}) => {
  // Filter invoices with outstanding balances, or show all if empty
  const unpaidInvoices = invoices.filter(
    (inv) => Number(inv.totalFcyAmount) - Number(inv.paidFcyAmount) > 0.01
  );
  const activeInvoices = unpaidInvoices.length > 0 ? unpaidInvoices : invoices;

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(activeInvoices[0]?.id || '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [realizationDate, setRealizationDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountFcy, setAmountFcy] = useState<number | ''>('');
  const [realizedExchangeRate, setRealizedExchangeRate] = useState<number | ''>(282.5);
  const [bankChargesPkr, setBankChargesPkr] = useState<number | ''>(0);
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [bankRefNo, setBankRefNo] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  useEffect(() => {
    if (selectedInvoice) {
      const outstandingFcy = Number(selectedInvoice.totalFcyAmount) - Number(selectedInvoice.paidFcyAmount);
      setAmountFcy(outstandingFcy > 0 ? outstandingFcy : Number(selectedInvoice.totalFcyAmount));
      // Default realized rate slightly above or equal to booked rate
      setRealizedExchangeRate(Number(selectedInvoice.exchangeRate));
    }
  }, [selectedInvoiceId, invoices]);

  const numAmountFcy = Number(amountFcy) || 0;
  const numRealizedRate = Number(realizedExchangeRate) || 0;
  const numBankCharges = Number(bankChargesPkr) || 0;
  const bookedRate = selectedInvoice ? Number(selectedInvoice.exchangeRate) : 0;

  const grossRealizedPkr = numAmountFcy * numRealizedRate;
  const netBankDepositPkr = grossRealizedPkr - numBankCharges;
  const bookedPkr = numAmountFcy * bookedRate;
  const fxGainLoss = grossRealizedPkr - bookedPkr;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      setError('Please select an export invoice');
      return;
    }
    if (!bankAccountId) {
      setError('Please select a receiving bank account');
      return;
    }
    if (numAmountFcy <= 0) {
      setError('Foreign currency remittance amount must be greater than zero');
      return;
    }
    if (numRealizedRate <= 0) {
      setError('Realized exchange rate must be greater than zero');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        exportInvoiceId: selectedInvoiceId,
        paymentDate: new Date(paymentDate).toISOString(),
        realizationDate: new Date(realizationDate).toISOString(),
        amountFcy: numAmountFcy,
        realizedExchangeRate: numRealizedRate,
        bankChargesPkr: numBankCharges,
        bankAccountId,
        bankRefNo: bankRefNo.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to record export payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Export Remittance & FX Realization" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center text-sm">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Invoice Picker */}
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Select Export Invoice *
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              required
            >
              <option value="">-- Choose Export Invoice --</option>
              {activeInvoices.map((inv) => {
                const remFcy = Number(inv.totalFcyAmount) - Number(inv.paidFcyAmount);
                return (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} | {inv.exportCustomer?.companyName} ({inv.exportCustomer?.country}) | {inv.currency} {remFcy.toLocaleString()} Unpaid (Total: {inv.currency} {Number(inv.totalFcyAmount).toLocaleString()})
                  </option>
                );
              })}
            </select>
          </div>

          {selectedInvoice && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-emerald-200/60">
              <div>
                <span className="text-[#718078] block">Buyer:</span>
                <span className="font-semibold text-[#172B25]">{selectedInvoice.exportCustomer?.companyName}</span>
              </div>
              <div>
                <span className="text-[#718078] block">Destination:</span>
                <span className="font-semibold text-[#172B25]">{selectedInvoice.portOfDischarge || selectedInvoice.exportCustomer?.destinationPort || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#718078] block">Booked FX Rate:</span>
                <span className="font-semibold text-[#087A55]">1 {selectedInvoice.currency} = {Number(selectedInvoice.exchangeRate).toFixed(2)} PKR</span>
              </div>
              <div>
                <span className="text-[#718078] block">Outstanding:</span>
                <span className="font-bold text-[#DC5050]">
                  {selectedInvoice.currency} {(Number(selectedInvoice.totalFcyAmount) - Number(selectedInvoice.paidFcyAmount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Remittance & Realization Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Payment Voucher Date *
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Bank Realization Date *
            </label>
            <input
              type="date"
              value={realizationDate}
              onChange={(e) => setRealizationDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Remittance Amount ({selectedInvoice?.currency || 'USD'}) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amountFcy}
                onChange={(e) => setAmountFcy(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55] font-semibold"
                placeholder="e.g. 15000"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Realized Bank Exchange Rate (PKR) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={realizedExchangeRate}
                onChange={(e) => setRealizedExchangeRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55] font-semibold"
                placeholder="e.g. 282.50"
                required
              />
            </div>
            <span className="text-[11px] text-[#718078] mt-1 block">
              Official bank settlement conversion rate
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Receiving Bank Account *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55] bg-white"
                required
              >
                <option value="">-- Select Bank Account --</option>
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountNumber} (Bal: PKR {Number(b.currentBalance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Intermediary Bank Charges (PKR)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={bankChargesPkr}
              onChange={(e) => setBankChargesPkr(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              placeholder="Swift & commission fees"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Bank Swift Reference / Credit Advice #
            </label>
            <input
              type="text"
              value={bankRefNo}
              onChange={(e) => setBankRefNo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              placeholder="e.g. SWIFT-HBL-2026-99238"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Remarks & Realization Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              placeholder="Additional notes, e.g. Form E clearance, Export proceeds certificate..."
            />
          </div>
        </div>

        {/* Real-time FX Gain/Loss & Settlement Summary Card */}
        <div className="bg-[#172B25] text-white p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Settlement & Foreign Exchange Calculation
            </span>
            <div className="flex items-center space-x-1.5 text-xs">
              {fxGainLoss >= 0 ? (
                <span className="inline-flex items-center text-emerald-400 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" /> FX Gain Realized
                </span>
              ) : (
                <span className="inline-flex items-center text-red-400 font-semibold">
                  <TrendingDown className="w-3.5 h-3.5 mr-1" /> FX Loss Realized
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block">Gross Realized:</span>
              <span className="font-semibold text-sm text-white">
                PKR {grossRealizedPkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Less Bank Charges:</span>
              <span className="font-semibold text-sm text-red-300">
                - PKR {numBankCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Net Bank Deposit:</span>
              <span className="font-bold text-sm text-emerald-300">
                PKR {netBankDepositPkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Exchange Fluctuation:</span>
              <span className={`font-bold text-sm ${fxGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fxGainLoss >= 0 ? '+' : ''}PKR {fxGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-gray-300 italic border-t border-white/10 pt-2">
            Automated GL Entries: Dr. Bank Account (Net), Dr. Bank Charges (Expense), Cr. Accounts Receivable (Booked PKR), and Cr./Dr. Foreign Exchange Gain/Loss.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-2 border-t border-[#E4EAE5]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#E4EAE5] rounded-lg text-sm font-medium text-[#718078] hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-[#087A55] text-white rounded-lg text-sm font-medium hover:bg-[#064E3B] flex items-center shadow-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting Settlement...' : 'Post Remittance & Realization'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
