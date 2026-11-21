import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StockRecord } from '../../types/inventory';
import { inventoryService } from '../../services/inventory.service';
import { PackageX } from 'lucide-react';

interface WastageModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockRecord | null;
  onSuccess: () => void;
}

export const WastageModal: React.FC<WastageModalProps> = ({
  isOpen,
  onClose,
  stock,
  onSuccess,
}) => {
  if (!stock) return null;

  const [bagCount, setBagCount] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [reason, setReason] = useState('Moisture shrinkage & dust aspiration during warehousing');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time loss calculation
  const calculatedLoss =
    typeof weightKg === 'number'
      ? (weightKg * parseFloat(stock.product.costPricePerKg as string)).toFixed(2)
      : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (weightKg === '' || Number(weightKg) <= 0) {
      setError('Wastage weight must be greater than zero');
      return;
    }

    try {
      setIsLoading(true);
      await inventoryService.recordWastage({
        warehouseId: stock.warehouse.id,
        productId: stock.product.id,
        bagCount: Number(bagCount || 0),
        weightKg: Number(weightKg),
        reason,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to record wastage');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Grain Wastage & Damage"
      subtitle={`Deduct damaged/evaporated inventory for ${stock.product.name} in ${stock.warehouse.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="p-3.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#718078] block">Available Godown Physical Stock</span>
            <span className="text-sm font-bold text-[#172B25] mt-0.5 block">
              {stock.availableBags} Bags · {parseFloat(stock.availableWeightKg as string).toLocaleString()} Kg
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-[#718078] uppercase">Cost Rate</span>
            <span className="text-sm font-bold text-[#087A55] block font-mono-num">
              PKR {parseFloat(stock.product.costPricePerKg as string).toFixed(2)} / Kg
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#172B25] block mb-1">
              Damaged Bags (If Any)
            </label>
            <input
              type="number"
              placeholder="e.g. 2"
              value={bagCount}
              onChange={(e) => setBagCount(e.target.value ? parseInt(e.target.value, 10) : '')}
              className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-sm font-bold text-[#172B25]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#172B25] block mb-1">
              Wastage Weight (Kg) *
            </label>
            <input
              type="number"
              step="0.5"
              required
              placeholder="e.g. 100"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-sm font-bold text-[#DC2626]"
            />
          </div>
        </div>

        {/* Financial Loss Callout */}
        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#DC2626]">
            <PackageX className="w-4 h-4" />
            <span>Computed Financial Loss:</span>
          </div>
          <span className="text-sm font-bold text-[#DC2626] font-mono-num">
            PKR {parseFloat(calculatedLoss).toLocaleString()}
          </span>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#718078] block mb-1">Damage / Loss Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-xs text-[#172B25] mb-2"
          >
            <option value="Moisture shrinkage & dust aspiration during warehousing">
              Moisture shrinkage & dust aspiration during warehousing
            </option>
            <option value="Rain water seepage / leak damage">Rain water seepage / leak damage</option>
            <option value="Torn bags spillage & contamination">Torn bags spillage & contamination</option>
            <option value="Insect/weevil infestation during prolonged storage">
              Insect/weevil infestation during prolonged storage
            </option>
            <option value="Milling machine jam / stone separator purge">
              Milling machine jam / stone separator purge
            </option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4EAE5]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" isLoading={isLoading}>
            Write Off Wastage
          </Button>
        </div>
      </form>
    </Modal>
  );
};
