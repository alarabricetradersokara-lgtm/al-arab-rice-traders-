import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CommissionAgent } from '../../types/advanced';
import { AlertCircle, Calculator } from 'lucide-react';

interface CommissionAccrualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  agents: CommissionAgent[];
}

export const CommissionAccrualModal: React.FC<CommissionAccrualModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  agents,
}) => {
  const [agentId, setAgentId] = useState(agents[0]?.id || '');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceType, setReferenceType] = useState('SALE');
  const [referenceNo, setReferenceNo] = useState('');
  const [baseAmount, setBaseAmount] = useState<number | ''>(1000000);
  const [bagCount, setBagCount] = useState<number | ''>(500);
  const [weightKg, setWeightKg] = useState<number | ''>(25000);
  const [rateType, setRateType] = useState<'PERCENTAGE' | 'PER_BAG' | 'PER_KG'>('PERCENTAGE');
  const [rateValue, setRateValue] = useState<number | ''>(1.5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAgent = agents.find((a) => a.id === agentId);

  const numBase = Number(baseAmount) || 0;
  const numBags = Number(bagCount) || 0;
  const numWeight = Number(weightKg) || 0;
  const numRate = Number(rateValue) || 0;

  let calculatedCommission = 0;
  if (rateType === 'PERCENTAGE') {
    calculatedCommission = (numBase * numRate) / 100;
  } else if (rateType === 'PER_BAG') {
    calculatedCommission = numBags * numRate;
  } else if (rateType === 'PER_KG') {
    calculatedCommission = numWeight * numRate;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentId) {
      setError('Please select an agent');
      return;
    }
    if (!referenceNo) {
      setError('Reference invoice / deal number is required');
      return;
    }
    if (calculatedCommission <= 0) {
      setError('Calculated commission must be greater than zero');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        agentId,
        transactionDate: new Date(transactionDate).toISOString(),
        referenceType,
        referenceNo,
        baseAmount: numBase,
        bagCount: numBags,
        weightKg: numWeight,
        rateType,
        rateValue: numRate,
        notes,
      });
      setReferenceNo('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to accrue commission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Accrue Broker Commission (Payable)"
      subtitle="Record brokerage fee against sale/purchase invoice and post to General Ledger"
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
          <label className="block text-xs font-semibold text-[#172B25] mb-1">Commission Agent *</label>
          <select
            value={agentId}
            onChange={(e) => {
              setAgentId(e.target.value);
              const ag = agents.find((a) => a.id === e.target.value);
              if (ag) {
                setRateType(ag.commissionType);
                setRateValue(Number(ag.defaultRate));
              }
            }}
            className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-600"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (Balance: Rs {Number(a.currentBalance).toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Transaction Date *</label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Reference Deal / Invoice # *</label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. INV-9021 / DSE-8821"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-600"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Base Amount (Rs)</label>
            <input
              type="number"
              value={baseAmount}
              onChange={(e) => setBaseAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="1000000"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Bags</label>
            <input
              type="number"
              value={bagCount}
              onChange={(e) => setBagCount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="500"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Weight (KG)</label>
            <input
              type="number"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="25000"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Rate Type</label>
            <select
              value={rateType}
              onChange={(e) => setRateType(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-600"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="PER_BAG">Per Bag (Fixed Rs)</option>
              <option value="PER_KG">Per KG (Fixed Rs)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Rate Value</label>
            <input
              type="number"
              step="any"
              value={rateValue}
              onChange={(e) => setRateValue(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="1.5"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-600"
              required
            />
          </div>
        </div>

        {/* Live Calculation Banner */}
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <Calculator className="w-4 h-4 text-emerald-700" />
            <span>Calculated Commission Payable:</span>
          </div>
          <span className="text-base font-extrabold text-emerald-950 font-mono">
            Rs {calculatedCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
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
            {isSubmitting ? 'Accruing...' : 'Accrue Commission'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
