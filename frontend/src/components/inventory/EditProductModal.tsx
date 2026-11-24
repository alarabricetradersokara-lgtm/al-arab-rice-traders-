import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { RiceProduct, RiceCategory, GrainVariety, GrainGrade } from '../../types/inventory';
import { inventoryService } from '../../services/inventory.service';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: RiceProduct | null;
  categories: RiceCategory[];
  onSuccess: () => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  categories,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [variety, setVariety] = useState<GrainVariety>('BASMATI_1121_KAINAT');
  const [grade, setGrade] = useState<GrainGrade>('STEAM');
  const [defaultBagWeightKg, setDefaultBagWeightKg] = useState('50.0');
  const [costPricePerKg, setCostPricePerKg] = useState('240.0');
  const [salePricePerKg, setSalePricePerKg] = useState('275.0');
  const [reorderLevelKg, setReorderLevelKg] = useState('3000.0');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCategoryId(product.category?.id || '');
      setVariety((product.variety as GrainVariety) || 'BASMATI_1121_KAINAT');
      setGrade((product.grade as GrainGrade) || 'STEAM');
      setDefaultBagWeightKg(String(product.defaultBagWeightKg || '50'));
      setCostPricePerKg(String(product.costPricePerKg || '0'));
      setSalePricePerKg(String(product.salePricePerKg || '0'));
      setReorderLevelKg(String(product.reorderLevelKg || '1000'));
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setError(null);

    if (!name.trim()) {
      setError('چاول کا کمرشل نام درج کرنا ضروری ہے۔');
      return;
    }

    try {
      setIsLoading(true);
      await inventoryService.updateProduct(product.id, {
        name: name.trim(),
        categoryId: categoryId || undefined,
        variety,
        grade,
        defaultBagWeightKg: parseFloat(defaultBagWeightKg) || 50,
        costPricePerKg: parseFloat(costPricePerKg) || 0,
        salePricePerKg: parseFloat(salePricePerKg) || 0,
        reorderLevelKg: parseFloat(reorderLevelKg) || 1000,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'چاول میں ترمیم کرنے میں ناکامی ہوئی');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="چاول ورائٹی میں ترمیم (Edit Rice Variety)"
      subtitle={`کوڈ: ${product?.code || ''} — ریٹ، وزن اور کوالٹی کی تفصیلات تبدیل کریں`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              ورائٹی کمرشل نام (Variety Name) *
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً 1121 کائنات سٹیم باسمتی"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              کیٹیگری (Category)
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
            >
              <option value="">کیٹیگری منتخب کریں</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              اناج کا گریڈ / پروسیسنگ (Grade)
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as GrainGrade)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
            >
              <option value="STEAM">سٹیم (Steam Processed)</option>
              <option value="SELLA">سیلا (Parboiled / Sella)</option>
              <option value="WHITE_RAW">سفید کچا (Raw White)</option>
              <option value="BROWN">براؤن (Brown / Unpolished)</option>
              <option value="BROKEN_TOTA">ٹوٹا (Broken / Tota)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              معیاری بوری کا وزن (Default Bag Weight Kg) *
            </label>
            <input
              type="number"
              step="any"
              required
              value={defaultBagWeightKg}
              onChange={(e) => setDefaultBagWeightKg(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              خریداری لاگت فی کلو (Cost Price / Kg)
            </label>
            <input
              type="number"
              step="any"
              value={costPricePerKg}
              onChange={(e) => setCostPricePerKg(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              فروخت ریٹ فی کلو (Sale Price / Kg) *
            </label>
            <input
              type="number"
              step="any"
              required
              value={salePricePerKg}
              onChange={(e) => setSalePricePerKg(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            منسوخ کریں
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} className="bg-emerald-700 hover:bg-emerald-600">
            تبدیلی محفوظ کریں (Save Changes)
          </Button>
        </div>
      </form>
    </Modal>
  );
};
