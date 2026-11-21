import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { RiceCategory, Warehouse, GrainVariety, GrainGrade } from '../../types/inventory';
import { inventoryService } from '../../services/inventory.service';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: RiceCategory[];
  warehouses: Warehouse[];
  onSuccess: () => void;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  categories,
  warehouses,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [variety, setVariety] = useState<GrainVariety>('BASMATI_1121_KAINAT');
  const [grade, setGrade] = useState<GrainGrade>('STEAM');
  const [baseUnit, setBaseUnit] = useState('KG');
  const [defaultBagWeightKg, setDefaultBagWeightKg] = useState('50.0');
  const [costPricePerKg, setCostPricePerKg] = useState('240.0');
  const [salePricePerKg, setSalePricePerKg] = useState('275.0');
  const [reorderLevelKg, setReorderLevelKg] = useState('3000.0');

  // Optional opening stock
  const [withOpeningStock, setWithOpeningStock] = useState(false);
  const [initialWarehouseId, setInitialWarehouseId] = useState('');
  const [initialBags, setInitialBags] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !code || !categoryId) {
      setError('Product Name, SKU code, and Category are required');
      return;
    }

    try {
      setIsLoading(true);
      await inventoryService.createProduct({
        name,
        code,
        categoryId,
        variety,
        grade,
        baseUnit,
        defaultBagWeightKg: parseFloat(defaultBagWeightKg) || 50,
        costPricePerKg: parseFloat(costPricePerKg) || 0,
        salePricePerKg: parseFloat(salePricePerKg) || 0,
        reorderLevelKg: parseFloat(reorderLevelKg) || 1000,
        initialWarehouseId: withOpeningStock ? initialWarehouseId : undefined,
        initialBags: withOpeningStock && initialBags ? parseInt(initialBags, 10) : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create rice product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Rice Variety"
      subtitle="Define quality specifications, standard packaging and pricing formula"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#172B25] block mb-1">
              Variety Commercial Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 1121 Kainat Steam Basmati"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-sm text-[#172B25] focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30 focus:border-[#087A55]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#172B25] block mb-1">
              SKU / Product Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. RICE-1121-STM"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-sm text-[#172B25] font-mono focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30 focus:border-[#087A55]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-[#172B25] block mb-1">Category *</label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-sm text-[#172B25] focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30 cursor-pointer"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#172B25] block mb-1">Grain Variety *</label>
            <select
              value={variety}
              onChange={(e) => setVariety(e.target.value as GrainVariety)}
              className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-sm text-[#172B25] focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30 cursor-pointer"
            >
              <option value="SUPER_KERNEL_BASMATI">Super Kernel Basmati</option>
              <option value="BASMATI_1121_KAINAT">1121 Kainat Basmati</option>
              <option value="BASMATI_385">Basmati 385</option>
              <option value="IRRI_6">IRRI-6 Coarse</option>
              <option value="IRRI_9">IRRI-9 Long Grain</option>
              <option value="PK_386">PK-386 Fragrant</option>
              <option value="RAW_PADDY_DHAN">Raw Paddy / Munji</option>
              <option value="BROKEN_RICE_TOTA">Broken Rice (Tota)</option>
              <option value="RICE_BRAN_PHAK">Rice Bran (Phak)</option>
              <option value="RICE_HUSK_BHOOSA">Rice Husk (Bhoosa)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#172B25] block mb-1">Processing Grade</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as GrainGrade)}
              className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-sm text-[#172B25] focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30 cursor-pointer"
            >
              <option value="RAW_WHITE">Raw White (Kacha)</option>
              <option value="STEAM">Steam Processed</option>
              <option value="SELLA_PARBOILED">Sella Parboiled</option>
              <option value="BROWN">Brown Rice (Cargo)</option>
              <option value="SECOND_GRADE">Second Grade</option>
              <option value="COMMERCIAL">Commercial Mix</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5]">
          <div>
            <label className="text-xs font-semibold text-[#718078] block mb-1">
              Std Bag Packaging
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                value={defaultBagWeightKg}
                onChange={(e) => setDefaultBagWeightKg(e.target.value)}
                className="w-full bg-white border border-[#E4EAE5] rounded-lg pl-3 pr-8 py-2 text-sm font-bold text-[#172B25]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#718078]">Kg</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#718078] block mb-1">
              Cost Rate / Kg (PKR)
            </label>
            <input
              type="number"
              step="0.5"
              value={costPricePerKg}
              onChange={(e) => setCostPricePerKg(e.target.value)}
              className="w-full bg-white border border-[#E4EAE5] rounded-lg px-3 py-2 text-sm font-bold text-[#172B25]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#718078] block mb-1">
              Sale Rate / Kg (PKR)
            </label>
            <input
              type="number"
              step="0.5"
              value={salePricePerKg}
              onChange={(e) => setSalePricePerKg(e.target.value)}
              className="w-full bg-white border border-[#E4EAE5] rounded-lg px-3 py-2 text-sm font-bold text-[#087A55]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#718078] block mb-1">
              Min Reorder Buffer
            </label>
            <div className="relative">
              <input
                type="number"
                value={reorderLevelKg}
                onChange={(e) => setReorderLevelKg(e.target.value)}
                className="w-full bg-white border border-[#E4EAE5] rounded-lg pl-3 pr-8 py-2 text-sm font-bold text-[#172B25]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#718078]">Kg</span>
            </div>
          </div>
        </div>

        {/* Optional Initial Stock Section */}
        <div className="p-4 border border-[#E4EAE5] rounded-xl space-y-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={withOpeningStock}
              onChange={(e) => setWithOpeningStock(e.target.checked)}
              className="w-4 h-4 text-[#087A55] rounded-sm focus:ring-[#087A55]"
            />
            <span className="text-xs font-bold text-[#172B25]">
              Initialize Opening Physical Stock Now
            </span>
          </label>

          {withOpeningStock && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-[#718078] block mb-1">Godown</label>
                <select
                  required={withOpeningStock}
                  value={initialWarehouseId}
                  onChange={(e) => setInitialWarehouseId(e.target.value)}
                  className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-1.5 text-xs text-[#172B25]"
                >
                  <option value="">Select Godown</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#718078] block mb-1">
                  Opening Bags ({defaultBagWeightKg} kg each)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={initialBags}
                  onChange={(e) => setInitialBags(e.target.value)}
                  className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-1.5 text-xs text-[#172B25] font-bold"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4EAE5]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Confirm & Save Variety
          </Button>
        </div>
      </form>
    </Modal>
  );
};
