import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { RiceProduct } from '../../types/inventory';
import { inventoryService } from '../../services/inventory.service';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: RiceProduct | null;
  categories?: any[];
  onSuccess: () => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [defaultBagWeightKg, setDefaultBagWeightKg] = useState('50.0');
  const [costPricePerKg, setCostPricePerKg] = useState('240.0');
  const [salePricePerKg, setSalePricePerKg] = useState('275.0');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDefaultBagWeightKg(String(product.defaultBagWeightKg || '50'));
      setCostPricePerKg(String(product.costPricePerKg || '0'));
      setSalePricePerKg(String(product.salePricePerKg || '0'));
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setError(null);

    if (!name.trim()) {
      setError('چاول کا نام درج کرنا ضروری ہے۔');
      return;
    }

    try {
      setIsLoading(true);
      await inventoryService.updateProduct(product.id, {
        name: name.trim(),
        defaultBagWeightKg: parseFloat(defaultBagWeightKg) || 50,
        costPricePerKg: parseFloat(costPricePerKg) || 0,
        salePricePerKg: parseFloat(salePricePerKg) || 0,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'چاول میں ترمیم کرنے میں ناکامی ہوئی۔');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="چاول ورائٹی میں ترمیم (Edit Rice Variety)"
      subtitle={`SKU کوڈ: ${product?.code || ''} — نام، وزن اور ریٹ تبدیل کریں`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            چاول کا نام (Variety Commercial Name) *
          </label>
          <input
            type="text"
            required
            placeholder="مثلاً 1121 کائنات سٹیم یا سپر کرنل"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              معیاری بوری وزن (Kg) *
            </label>
            <input
              type="number"
              step="0.5"
              required
              value={defaultBagWeightKg}
              onChange={(e) => setDefaultBagWeightKg(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700/20 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              خریداری ریٹ فی کلو
            </label>
            <input
              type="number"
              step="any"
              value={costPricePerKg}
              onChange={(e) => setCostPricePerKg(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700/20 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              فروخت ریٹ فی کلو *
            </label>
            <input
              type="number"
              step="any"
              required
              value={salePricePerKg}
              onChange={(e) => setSalePricePerKg(e.target.value)}
              className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-700/20 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            منسوخ کریں
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} className="bg-emerald-700 hover:bg-emerald-600 font-bold text-sm">
            تبدیلی محفوظ کریں (Save Changes)
          </Button>
        </div>
      </form>
    </Modal>
  );
};
