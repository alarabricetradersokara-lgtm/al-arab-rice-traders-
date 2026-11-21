import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { AgentCommissionType } from '../../types/advanced';
import { AlertCircle } from 'lucide-react';

interface CommissionAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const CommissionAgentModal: React.FC<CommissionAgentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [mandiCity, setMandiCity] = useState('');
  const [commissionType, setCommissionType] = useState<AgentCommissionType>('PERCENTAGE');
  const [defaultRate, setDefaultRate] = useState<number | ''>(1.5);
  const [openingBalance, setOpeningBalance] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Broker / Agent name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        name,
        phone,
        mandiCity,
        commissionType,
        defaultRate: Number(defaultRate) || 0,
        openingBalance: Number(openingBalance) || 0,
        notes,
      });
      setName('');
      setPhone('');
      setMandiCity('');
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create commission agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Commission Agent / Broker"
      subtitle="Create broker profile with commission rate structure and opening balance"
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
          <label className="block text-xs font-semibold text-[#172B25] mb-1">Broker Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Haji Abdul Sattar (Kamoke Broker)"
            className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Phone / Mobile</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0300-1234567"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Mandi / City</label>
            <input
              type="text"
              value={mandiCity}
              onChange={(e) => setMandiCity(e.target.value)}
              placeholder="e.g. Kamoke, Gujranwala, Hafizabad"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Commission Type</label>
            <select
              value={commissionType}
              onChange={(e) => setCommissionType(e.target.value as AgentCommissionType)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-medium"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="PER_BAG">Per Bag (Fixed Rs)</option>
              <option value="PER_KG">Per KG (Fixed Rs)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Default Rate</label>
            <input
              type="number"
              step="any"
              value={defaultRate}
              onChange={(e) => setDefaultRate(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="1.5"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1">Opening Payable Balance (PKR)</label>
          <input
            type="number"
            step="any"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1">Remarks / Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Mandi commission terms, payment cycles..."
            className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
          />
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
            {isSubmitting ? 'Registering...' : 'Register Broker'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
