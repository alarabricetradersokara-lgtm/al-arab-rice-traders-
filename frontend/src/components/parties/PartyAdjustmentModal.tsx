import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { partyService } from '../../services/party.service';
import { Customer, Supplier } from '../../types/party';
import { DollarSign, Scale, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PartyAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyType: 'CUSTOMER' | 'SUPPLIER';
  party: Customer | Supplier | null;
  onSuccess: (newBalance: string) => void;
}

export const PartyAdjustmentModal: React.FC<PartyAdjustmentModalProps> = ({
  isOpen,
  onClose,
  partyType,
  party,
  onSuccess,
}) => {
  const [type, setType] = useState<'DEBIT' | 'CREDIT'>('CREDIT');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reasonCategory, setReasonCategory] = useState('Special Discount / Rate Correction');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setType(partyType === 'CUSTOMER' ? 'CREDIT' : 'DEBIT');
      setReasonCategory(
        partyType === 'CUSTOMER'
          ? 'Special Discount / Rate Correction'
          : 'Quality Claim / Bardana Damage'
      );
      setNotes('');
      setError(null);
    }
  }, [isOpen, partyType]);

  if (!party) return null;

  const currentBal = Number(party.currentBalance || 0);
  const numAmount = parseFloat(amount) || 0;

  // Calculate projected balance based on accounting rules
  let projectedBal = currentBal;
  if (partyType === 'CUSTOMER') {
    // Customer: DEBIT increases receivable, CREDIT decreases receivable
    projectedBal = type === 'DEBIT' ? currentBal + numAmount : currentBal - numAmount;
  } else {
    // Supplier: CREDIT increases payable, DEBIT decreases payable
    projectedBal = type === 'CREDIT' ? currentBal + numAmount : currentBal - numAmount;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || numAmount <= 0) {
      setError('Please enter a valid positive adjustment amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let res: any;
      if (partyType === 'CUSTOMER') {
        res = await partyService.recordCustomerAdjustment(party.id, {
          type,
          amount: numAmount,
          date: new Date(date).toISOString(),
          reason: reasonCategory,
          notes: notes.trim() || undefined,
        });
      } else {
        res = await partyService.recordSupplierAdjustment(party.id, {
          type,
          amount: numAmount,
          date: new Date(date).toISOString(),
          reason: reasonCategory,
          notes: notes.trim() || undefined,
        });
      }

      onSuccess(res.newBalance);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post Khatabook adjustment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Post Khatabook Adjustment: ${party.name} (${partyType})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* Party Banner */}
        <div className="p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5] flex justify-between items-center text-xs">
          <div>
            <span className="font-bold text-[#172B25] text-sm block">{party.name}</span>
            <span className="text-[#718078]">{party.city} • {party.phone}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#718078] uppercase font-bold block">
              Current Khatabook Balance
            </span>
            <span className="font-mono font-bold text-sm text-[#087A55]">
              PKR {currentBal.toLocaleString()} ({partyType === 'CUSTOMER' ? 'Dr' : 'Cr'})
            </span>
          </div>
        </div>

        {/* Debit vs Credit Selection */}
        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1.5">
            Adjustment Accounting Nature <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('CREDIT')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                type === 'CREDIT'
                  ? 'border-[#087A55] bg-emerald-50 text-[#087A55] font-bold shadow-2xs'
                  : 'border-[#E4EAE5] bg-white text-[#718078] hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-[#087A55]" />
                <span className="text-xs">CREDIT NOTE</span>
              </div>
              <span className="text-[10px] font-normal block mt-1">
                {partyType === 'CUSTOMER'
                  ? 'Discount / Reduces Customer Debt'
                  : 'Charge / Increases Supplier Payable'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setType('DEBIT')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                type === 'DEBIT'
                  ? 'border-amber-600 bg-amber-50 text-amber-800 font-bold shadow-2xs'
                  : 'border-[#E4EAE5] bg-white text-[#718078] hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-amber-600" />
                <span className="text-xs">DEBIT NOTE</span>
              </div>
              <span className="text-[10px] font-normal block mt-1">
                {partyType === 'CUSTOMER'
                  ? 'Debit Charge / Increases Customer Debt'
                  : 'Quality Rebate / Reduces Supplier Payable'}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Adjustment Amount (PKR) <span className="text-red-500">*</span>
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
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1">
            Reason / Classification
          </label>
          <select
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl outline-none font-medium"
          >
            {partyType === 'CUSTOMER' ? (
              <>
                <option value="Special Discount / Rate Correction">Special Discount / Rate Correction</option>
                <option value="Cash Settlement Rounding Off">Cash Settlement Rounding Off</option>
                <option value="Quality Grain Rebate Allowance">Quality Grain Rebate Allowance</option>
                <option value="Freight / Unloading Cartage Charge">Freight / Unloading Cartage Charge</option>
                <option value="Bad Debt Write-Off">Bad Debt Write-Off</option>
              </>
            ) : (
              <>
                <option value="Quality Claim / Bardana Damage">Quality Claim / Bardana Damage</option>
                <option value="Moisture / Excess Karda Settlement">Moisture / Excess Karda Settlement</option>
                <option value="Mandi Commission Brokerage Fee">Mandi Commission Brokerage Fee</option>
                <option value="Price Difference Correction">Price Difference Correction</option>
                <option value="Weighbridge Shortage Allowance">Weighbridge Shortage Allowance</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1">
            Audit Remarks / Explanatory Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. As agreed with Seth Tariq over phone"
            className="w-full px-3 py-2 text-xs border border-[#E4EAE5] rounded-xl outline-none"
          />
        </div>

        {/* Projected Result */}
        <div className="p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5] text-xs flex justify-between items-center font-mono">
          <span className="text-[#718078]">Projected New Balance:</span>
          <span className="font-bold text-sm text-[#087A55]">
            PKR {projectedBal.toLocaleString()} ({partyType === 'CUSTOMER' ? 'Dr' : 'Cr'})
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#E4EAE5]">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Posting...' : 'Post Khatabook Adjustment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
