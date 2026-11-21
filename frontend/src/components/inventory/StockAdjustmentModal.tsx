import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StockRecord } from '../../types/inventory';
import { inventoryService } from '../../services/inventory.service';
import { AlertCircle, SlidersHorizontal } from 'lucide-react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockRecord | null;
  onSuccess: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  stock,
  onSuccess,
}) => {
  if (!stock) return null;

  const [actualBags, setActualBags] = useState<number | ''>(stock.currentBags);
  const [actualWeightKg, setActualWeightKg] = useState<number | ''>(
    parseFloat(stock.currentWeightKg as string)
  );
  const [reason, setReason] = useState('Monthly physical stock cycle audit');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bagDelta = typeof actualBags === 'number' ? actualBags - stock.currentBags : 0;
  const weightDelta =
    typeof actualWeightKg === 'number'
      ? actualWeightKg - parseFloat(stock.currentWeightKg as string)
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (actualBags === '' || actualWeightKg === '') {
      setError('Actual bags and weight are required');
      return;
    }

    try {
      setIsLoading(true);
      await inventoryService.adjustStock({
        warehouseId: stock.warehouse.id,
        productId: stock.product.id,
        actualBags: Number(actualBags),
        actualWeightKg: Number(actualWeightKg),
        reason,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to adjust stock');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Physical Stock Audit Adjustment"
      subtitle={`Reconcile physical inventory for ${stock.product.name} in ${stock.warehouse.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Current System Balance */}
        <div className="p-3.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#718078] block">Current System Recorded Balance</span>
            <span className="text-sm font-bold text-[#172B25] mt-0.5 block">
              {stock.currentBags} Bags · {parseFloat(stock.currentWeightKg as string).toLocaleString()} Kg
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-[#718078] uppercase">Maunds</span>
            <span className="text-sm font-bold text-[#087A55] block font-mono-num">{stock.maunds}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#172B25] block mb-1">
              Actual Physical Count (Bags)
            </label>
            <input
              type="number"
              required
              value={actualBags}
              onChange={(e) => setActualBags(e.target.value ? parseInt(e.target.value, 10) : '')}
              className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-sm font-bold text-[#172B25]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#172B25] block mb-1">
              Actual Net Weight (Kg)
            </label>
            <input
              type="number"
              step="0.5"
              required
              value={actualWeightKg}
              onChange={(e) => setActualWeightKg(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-sm font-bold text-[#172B25]"
            />
          </div>
        </div>

        {/* Variance Display */}
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
            bagDelta === 0 && weightDelta === 0
              ? 'bg-[#F0FDF4] border-[#A7F3D0] text-[#087A55]'
              : bagDelta < 0 || weightDelta < 0
              ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
              : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]'
          }`}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Audit Variance Discrepancy:</span>
          </div>
          <span className="font-mono-num font-bold">
            {bagDelta > 0 ? `+${bagDelta}` : bagDelta} Bags (
            {weightDelta > 0 ? `+${weightDelta.toFixed(2)}` : weightDelta.toFixed(2)} Kg)
          </span>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#718078] block mb-1">Audit Reason / Justification</label>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-xs text-[#172B25]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4EAE5]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Post Audit Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
