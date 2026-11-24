import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Warehouse } from '../../types/inventory';
import { inventoryService } from '../../services/inventory.service';
import { Sparkles, Calculator } from 'lucide-react';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: any[];
  warehouses: Warehouse[];
  onSuccess: () => void;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  warehouses,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [defaultBagWeightKg, setDefaultBagWeightKg] = useState('50.0');
  const [costPricePerKg, setCostPricePerKg] = useState('240.0');
  const [salePricePerKg, setSalePricePerKg] = useState('275.0');
  const [reorderLevelKg, setReorderLevelKg] = useState('1000.0');

  // Optional opening stock
  const [withOpeningStock, setWithOpeningStock] = useState(false);
  const [initialWarehouseId, setInitialWarehouseId] = useState(warehouses[0]?.id || '');
  const [initialBags, setInitialBags] = useState('');
  const [initialLooseKg, setInitialLooseKg] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed opening stock
  const bagWt = parseFloat(defaultBagWeightKg) || 50;
  const numBags = parseInt(initialBags, 10) || 0;
  const numLoose = parseFloat(initialLooseKg) || 0;
  const computedOpeningKg = numBags * bagWt + numLoose;
  const computedOpeningMaunds = (computedOpeningKg / 40).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('براہ کرم چاول کا نام درج کریں۔');
      return;
    }

    try {
      setIsLoading(true);
      await inventoryService.createProduct({
        name: name.trim(),
        code: code.trim() || undefined, // Backend auto-assigns sequence code (AR-001, AR-002...) if undefined
        defaultBagWeightKg: bagWt,
        costPricePerKg: parseFloat(costPricePerKg) || 0,
        salePricePerKg: parseFloat(salePricePerKg) || 0,
        reorderLevelKg: parseFloat(reorderLevelKg) || 1000,
        initialWarehouseId: withOpeningStock ? (initialWarehouseId || warehouses[0]?.id) : undefined,
        initialBags: withOpeningStock && numBags > 0 ? numBags : undefined,
        initialLooseKg: withOpeningStock && numLoose > 0 ? numLoose : undefined,
        initialWeightKg: withOpeningStock && computedOpeningKg > 0 ? computedOpeningKg : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'چاول ورائٹی محفوظ کرنے میں غلطی ہوئی۔');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="نیا چاول ورائٹی رجسٹر کریں (Register Rice Variety)"
      subtitle="سادہ و آسان اندراج: نام، وزن، ریٹ اور افتتاحی اسٹاک درج کریں"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Variety Name & Auto-SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-800 block mb-1">
              چاول کا نام (Variety Name) *
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً 1121 کائنات سٹیم یا سپر کرنل باسمتی"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              SKU کوڈ (Code)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="خودکار (Auto Assigned)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                تسلسل سے
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              خالی چھوڑیں تو سسٹم خود (AR-001) نمبر دے گا
            </span>
          </div>
        </div>

        {/* Packaging and Rates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              معیاری بوری کا وزن (Bag Weight)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                required
                value={defaultBagWeightKg}
                onChange={(e) => setDefaultBagWeightKg(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700/20 outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Kg</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              خریداری ریٹ فی کلو (Cost / Kg)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={costPricePerKg}
                onChange={(e) => setCostPricePerKg(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700/20 outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">PKR</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              فروخت ریٹ فی کلو (Sale / Kg) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                value={salePricePerKg}
                onChange={(e) => setSalePricePerKg(e.target.value)}
                className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-700/20 outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-700">PKR</span>
            </div>
          </div>
        </div>

        {/* Optional Opening Stock with Bags + Loose KG */}
        <div className="p-4 bg-white border border-emerald-200 rounded-2xl shadow-xs space-y-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={withOpeningStock}
              onChange={(e) => setWithOpeningStock(e.target.checked)}
              className="w-4 h-4 text-emerald-700 rounded-md focus:ring-emerald-700"
            />
            <span className="text-xs font-bold text-slate-900">
              دکان میں پہلے سے موجود اسٹاک درج کریں (Add Opening Stock Now)
            </span>
          </label>

          {withOpeningStock && (
            <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    گودام / شاپ (Location)
                  </label>
                  <select
                    value={initialWarehouseId}
                    onChange={(e) => setInitialWarehouseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    کل بوریاں (Opening Bags)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="مثلاً 500"
                    value={initialBags}
                    onChange={(e) => setInitialBags(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 outline-none"
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
                    placeholder="مثلاً 35 کلو"
                    value={initialLooseKg}
                    onChange={(e) => setInitialLooseKg(e.target.value)}
                    className="w-full bg-emerald-50/70 border border-emerald-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>
              </div>

              {/* Realtime Calculation Display */}
              {computedOpeningKg > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <Calculator className="w-4 h-4 text-emerald-700" />
                    <span>
                      کل افتتاحی اسٹاک: {numBags} بوریاں ({bagWt} کلو والی) + {numLoose} کلو کھلا
                    </span>
                  </div>
                  <div className="font-mono font-black text-sm text-emerald-900">
                    {computedOpeningKg.toLocaleString()} Kg (~ {computedOpeningMaunds} من)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            منسوخ کریں
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} className="bg-emerald-700 hover:bg-emerald-600 font-bold text-sm">
            چاول محفوظ کریں (Save Rice Variety)
          </Button>
        </div>
      </form>
    </Modal>
  );
};
