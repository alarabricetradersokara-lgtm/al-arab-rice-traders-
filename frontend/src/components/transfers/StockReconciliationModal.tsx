import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Warehouse, RiceProduct, StockRecord } from '../../types/inventory';
import { inventoryService } from '../../services/inventory.service';
import { AlertCircle, Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StockReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  warehouses: Warehouse[];
  products: RiceProduct[];
}

export const StockReconciliationModal: React.FC<StockReconciliationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  warehouses,
  products,
}) => {
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [physicalBags, setPhysicalBags] = useState<number | ''>('');
  const [physicalWeightKg, setPhysicalWeightKg] = useState<number | ''>('');
  const [reason, setReason] = useState('Physical Godown Audit Count');

  const [systemStock, setSystemStock] = useState<{ bags: number; weightKg: number } | null>(null);
  const [loadingStock, setLoadingStock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load system stock when warehouse or product changes
  useEffect(() => {
    const fetchCurrentStock = async () => {
      if (!warehouseId || !productId) return;
      try {
        setLoadingStock(true);
        const res = await inventoryService.getStockOverview({ warehouseId });
        const match = res.stocks.find(
          (s) => s.product?.id === productId && s.warehouse?.id === warehouseId
        );
        if (match) {
          setSystemStock({
            bags: match.currentBags,
            weightKg: Number(match.currentWeightKg),
          });
          setPhysicalBags(match.currentBags);
          setPhysicalWeightKg(Number(match.currentWeightKg));
        } else {
          setSystemStock({ bags: 0, weightKg: 0 });
          setPhysicalBags(0);
          setPhysicalWeightKg(0);
        }
      } catch (err) {
        console.error('Failed to load current stock', err);
      } finally {
        setLoadingStock(false);
      }
    };

    if (isOpen) {
      fetchCurrentStock();
    }
  }, [isOpen, warehouseId, productId]);

  const pBags = Number(physicalBags) || 0;
  const pWeight = Number(physicalWeightKg) || 0;
  const sysBags = systemStock?.bags || 0;
  const sysWeight = systemStock?.weightKg || 0;

  const bagVariance = pBags - sysBags;
  const weightVariance = pWeight - sysWeight;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId || !productId) {
      setError('Please select warehouse and rice product');
      return;
    }
    if (pWeight < 0 || pBags < 0) {
      setError('Physical counts cannot be negative');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        warehouseId,
        productId,
        physicalBags: pBags,
        physicalWeightKg: pWeight,
        reason: reason.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reconcile stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Physical Godown Stock Reconciliation" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center text-sm">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Audited Warehouse / Godown *
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              required
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Rice Product Variety *
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison System vs Physical */}
        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
            <span className="text-xs font-bold text-[#172B25] uppercase tracking-wider flex items-center">
              <Scale className="w-4 h-4 mr-1.5 text-[#087A55]" />
              System Recorded Stock vs Actual Physical Count
            </span>
            {loadingStock && <span className="text-xs text-[#718078] animate-pulse">Loading recorded stock...</span>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[#718078] block">System Bags:</span>
              <span className="font-bold text-sm text-[#172B25]">{sysBags} Bags</span>
            </div>
            <div>
              <span className="text-[#718078] block">System Weight:</span>
              <span className="font-bold text-sm text-[#172B25]">{sysWeight.toLocaleString()} Kg</span>
            </div>
            <div>
              <span className="text-[#718078] block">Physical Bags:</span>
              <span className="font-bold text-sm text-[#087A55]">{pBags} Bags</span>
            </div>
            <div>
              <span className="text-[#718078] block">Physical Weight:</span>
              <span className="font-bold text-sm text-[#087A55]">{pWeight.toLocaleString()} Kg</span>
            </div>
          </div>

          {/* Variance Indicator */}
          <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
            <span className="text-[#718078]">Audit Variance:</span>
            <div className="flex items-center space-x-3 font-semibold">
              <span className={bagVariance === 0 ? 'text-emerald-700' : bagVariance > 0 ? 'text-blue-700' : 'text-red-700'}>
                {bagVariance > 0 ? `+${bagVariance}` : bagVariance} Bags
              </span>
              <span className={weightVariance === 0 ? 'text-emerald-700' : weightVariance > 0 ? 'text-blue-700' : 'text-red-700'}>
                {weightVariance > 0 ? `+${weightVariance.toLocaleString()}` : weightVariance.toLocaleString()} Kg
              </span>
            </div>
          </div>
        </div>

        {/* Physical Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Verified Physical Bags Count *
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={physicalBags}
              onChange={(e) => setPhysicalBags(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg font-bold text-[#172B25] focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Verified Physical Weight (Kg) *
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={physicalWeightKg}
              onChange={(e) => setPhysicalWeightKg(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg font-bold text-[#087A55] focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Audit Adjustment Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#087A55]"
            >
              <option value="Physical Godown Audit Count">Physical Godown Audit Count</option>
              <option value="Annual Inventory Physical Verification">Annual Inventory Physical Verification</option>
              <option value="Moisture / Natural Drying Loss">Moisture / Natural Drying Loss</option>
              <option value="Bag Tearing / Spillage Wastage">Bag Tearing / Spillage Wastage</option>
              <option value="Surplus Unrecorded Stock Found">Surplus Unrecorded Stock Found</option>
            </select>
          </div>
        </div>

        {/* Warning / Audit Notice */}
        <div className="bg-[#172B25] text-white p-3.5 rounded-xl text-xs space-y-1">
          <span className="font-semibold text-emerald-400 block">Inventory Audit Trail Guarantee:</span>
          <p className="text-gray-300">
            Applying this reconciliation will adjust the warehouse balance to the verified physical count. An audited <span className="font-semibold text-white">ADJUSTMENT</span> stock movement will be recorded with reference to this inspection.
          </p>
        </div>

        {/* Actions */}
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
            {isSubmitting ? 'Adjusting Stock...' : 'Save Physical Stock Reconciliation'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
