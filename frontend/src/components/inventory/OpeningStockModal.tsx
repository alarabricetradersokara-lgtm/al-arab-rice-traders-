import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { RiceProduct, Warehouse } from '../../types/inventory';
import { inventoryService } from '../../services/inventory.service';
import { Calculator } from 'lucide-react';

interface OpeningStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: RiceProduct[];
  warehouses: Warehouse[];
  onSuccess: () => void;
}

export const OpeningStockModal: React.FC<OpeningStockModalProps> = ({
  isOpen,
  onClose,
  products,
  warehouses,
  onSuccess,
}) => {
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [bagCount, setBagCount] = useState<number | ''>('');
  const [looseKg, setLooseKg] = useState<number | ''>('');
  const [bagWeightKg, setBagWeightKg] = useState<number | ''>(50.0);
  const [unitCostPerKg, setUnitCostPerKg] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-populate bag weight and cost rate when product changes
  useEffect(() => {
    if (productId) {
      const selected = products.find((p) => p.id === productId);
      if (selected) {
        setBagWeightKg(parseFloat(selected.defaultBagWeightKg as string) || 50.0);
        setUnitCostPerKg(parseFloat(selected.costPricePerKg as string) || 0);
      }
    }
  }, [productId, products]);

  // Calculations: (Bags * Bag Weight) + Loose KGs
  const bags = typeof bagCount === 'number' ? bagCount : 0;
  const bagWt = typeof bagWeightKg === 'number' ? bagWeightKg : 50;
  const loose = typeof looseKg === 'number' ? looseKg : 0;
  const calculatedWeightKg = (bags * bagWt) + loose;
  const calculatedMaunds = (calculatedWeightKg / 40).toFixed(2);
  const calculatedValuation =
    typeof unitCostPerKg === 'number' ? (calculatedWeightKg * unitCostPerKg).toFixed(2) : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productId || !warehouseId || calculatedWeightKg <= 0 || !unitCostPerKg) {
      setError('براہ کرم چاول، گودام، بوریاں یا کھلا وزن اور لاگت ریٹ درج کریں۔');
      return;
    }

    try {
      setIsLoading(true);
      await inventoryService.createOpeningStock({
        productId,
        warehouseId,
        bagCount: bags,
        weightKg: calculatedWeightKg,
        unitCostPerKg: Number(unitCostPerKg),
        notes: notes ? `${notes} (بوریاں: ${bags} + کھلا: ${loose} کلو)` : `افتتاحی اسٹاک: ${bags} بوریاں + ${loose} کلو کھلا چاول`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'افتتاحی اسٹاک درج کرنے میں غلطی ہوئی۔');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Opening Stock Entry"
      subtitle="Establish baseline inventory balance and valuation for fiscal accounting"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#172B25] block mb-1">
              Rice Variety *
            </label>
            <select
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-sm text-[#172B25] focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30 cursor-pointer"
            >
              <option value="">Select Rice Variety</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#172B25] block mb-1">
              Destination Godown *
            </label>
            <select
              required
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-sm text-[#172B25] focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30 cursor-pointer"
            >
              <option value="">Select Godown</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              کل بوریاں (Bags)
            </label>
            <input
              type="number"
              min="0"
              placeholder="مثلاً 500"
              value={bagCount}
              onChange={(e) => setBagCount(e.target.value ? parseInt(e.target.value, 10) : '')}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-emerald-900 block mb-1">
              کھلا چاول (Loose KGs)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="مثلاً 30 کلو"
              value={looseKg}
              onChange={(e) => setLooseKg(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full bg-emerald-50/60 border border-emerald-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-950 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              وزن فی بوری (Kg)
            </label>
            <input
              type="number"
              step="0.5"
              required
              value={bagWeightKg}
              onChange={(e) => setBagWeightKg(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              لاگت ریٹ فی کلو (PKR) *
            </label>
            <input
              type="number"
              step="0.5"
              required
              placeholder="مثلاً 240.0"
              value={unitCostPerKg}
              onChange={(e) => setUnitCostPerKg(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-800 outline-none"
            />
          </div>
        </div>

        {/* Real-Time Calculation Matrix */}
        <div className="p-4 bg-[#E8F5E9] border border-[#A7F3D0] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#087A55] text-white">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#064E3B] uppercase tracking-wide">
                Computed Catch-Weight & Valuation
              </p>
              <p className="text-sm font-medium text-[#172B25] mt-0.5">
                <span className="font-bold">{calculatedWeightKg.toLocaleString()} Kg</span> (
                {calculatedMaunds} Maunds)
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-[#718078] uppercase">Total Asset Value</p>
            <p className="text-lg font-bold text-[#087A55] font-mono-num">
              PKR {parseFloat(calculatedValuation).toLocaleString()}
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#718078] block mb-1">
            Fiscal Audit Notes / Mandi Reference
          </label>
          <input
            type="text"
            placeholder="e.g. Mandi Lot Physical Count by Supervisor"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-xs text-[#172B25]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4EAE5]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Post Opening Balance
          </Button>
        </div>
      </form>
    </Modal>
  );
};
