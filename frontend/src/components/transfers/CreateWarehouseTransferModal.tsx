import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Warehouse, RiceProduct } from '../../types/inventory';
import { AlertCircle, Truck, Plus, Trash2, ArrowRight } from 'lucide-react';

interface CreateWarehouseTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  warehouses: Warehouse[];
  products: RiceProduct[];
}

interface TransferItemState {
  productId: string;
  sentBags: number | '';
  sentWeightKg: number | '';
}

export const CreateWarehouseTransferModal: React.FC<CreateWarehouseTransferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  warehouses,
  products,
}) => {
  const [fromWarehouseId, setFromWarehouseId] = useState(warehouses[0]?.id || '');
  const [toWarehouseId, setToWarehouseId] = useState(warehouses[1]?.id || warehouses[0]?.id || '');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [driverName, setDriverName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [biltyNumber, setBiltyNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<TransferItemState[]>([
    { productId: products[0]?.id || '', sentBags: 100, sentWeightKg: 5000 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProductChange = (index: number, pId: string) => {
    const prod = products.find((p) => p.id === pId);
    const updated = [...items];
    const bagWeight = Number(prod?.defaultBagWeightKg || 50);
    const bags = Number(updated[index].sentBags) || 0;
    updated[index] = {
      ...updated[index],
      productId: pId,
      sentWeightKg: bags * bagWeight,
    };
    setItems(updated);
  };

  const handleBagsChange = (index: number, val: number | '') => {
    const updated = [...items];
    const prod = products.find((p) => p.id === updated[index].productId);
    const bagWeight = Number(prod?.defaultBagWeightKg || 50);
    const bags = Number(val) || 0;
    updated[index] = {
      ...updated[index],
      sentBags: val,
      sentWeightKg: val === '' ? '' : bags * bagWeight,
    };
    setItems(updated);
  };

  const handleWeightChange = (index: number, val: number | '') => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      sentWeightKg: val,
    };
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      { productId: products[0]?.id || '', sentBags: 50, sentWeightKg: 2500 },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalBags = items.reduce((sum, item) => sum + (Number(item.sentBags) || 0), 0);
  const totalWeightKg = items.reduce((sum, item) => sum + (Number(item.sentWeightKg) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromWarehouseId || !toWarehouseId) {
      setError('Please select both source and destination warehouses');
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      setError('Source and destination warehouses cannot be the same');
      return;
    }
    if (items.length === 0) {
      setError('At least one item must be included in the transfer');
      return;
    }
    for (const item of items) {
      if (!item.productId) {
        setError('All transfer rows must have a valid product selected');
        return;
      }
      if ((Number(item.sentWeightKg) || 0) <= 0) {
        setError('Sent weight must be greater than zero');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        fromWarehouseId,
        toWarehouseId,
        transferDate: new Date(transferDate).toISOString(),
        driverName: driverName.trim() || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        biltyNumber: biltyNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          sentBags: Number(i.sentBags) || 0,
          sentWeightKg: Number(i.sentWeightKg) || 0,
        })),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to dispatch warehouse transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dispatch Inter-Warehouse Stock Transfer" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center text-sm">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Warehouse Route Selection */}
        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Source Warehouse (Dispatch From) *
            </label>
            <select
              value={fromWarehouseId}
              onChange={(e) => setFromWarehouseId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              required
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id} disabled={w.id === toWarehouseId}>
                  {w.name} ({w.code}) {w.id === toWarehouseId ? '(Destination)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 flex justify-center text-[#087A55] pt-4 sm:pt-0">
            <ArrowRight className="w-6 h-6" />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Destination Warehouse (Receive At) *
            </label>
            <select
              value={toWarehouseId}
              onChange={(e) => setToWarehouseId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              required
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id} disabled={w.id === fromWarehouseId}>
                  {w.name} ({w.code}) {w.id === fromWarehouseId ? '(Source)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dispatch & Logistics Details */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Dispatch Date *
            </label>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Truck / Vehicle #
            </label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              placeholder="e.g. LES-7844"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Driver Name & Contact
            </label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              placeholder="e.g. Muhammad Aslam"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
              Bilty / Gate Pass #
            </label>
            <input
              type="text"
              value={biltyNumber}
              onChange={(e) => setBiltyNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              placeholder="e.g. GP-2026-441"
            />
          </div>
        </div>

        {/* Transfer Items Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-[#172B25] uppercase tracking-wider flex items-center">
              <Truck className="w-4 h-4 mr-1.5 text-[#087A55]" />
              Transfer Items (Paddy / Rice Varieties)
            </h4>
            <button
              type="button"
              onClick={addItem}
              className="px-2.5 py-1 text-xs font-semibold text-[#087A55] bg-[#087A55]/10 hover:bg-[#087A55]/20 rounded-md transition-all flex items-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Rice Product
            </button>
          </div>

          <div className="border border-[#E4EAE5] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold uppercase tracking-wider border-b border-[#E4EAE5]">
                <tr>
                  <th className="py-2.5 px-3">Rice Variety / Product</th>
                  <th className="py-2.5 px-3 w-32">Dispatched Bags</th>
                  <th className="py-2.5 px-3 w-36">Total Weight (Kg)</th>
                  <th className="py-2.5 px-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EAE5]">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60">
                    <td className="py-2 px-3">
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-[#E4EAE5] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#087A55]"
                        required
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.code}) - {p.defaultBagWeightKg}kg/bag
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.sentBags}
                        onChange={(e) => handleBagsChange(idx, e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs border border-[#E4EAE5] rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#087A55]"
                        placeholder="Bags"
                        required
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={item.sentWeightKg}
                        onChange={(e) => handleWeightChange(idx, e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs border border-[#E4EAE5] rounded-lg font-semibold text-[#087A55] focus:outline-none focus:ring-2 focus:ring-[#087A55]"
                        placeholder="Weight (Kg)"
                        required
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length <= 1}
                        className={`p-1 rounded text-red-500 hover:bg-red-50 ${
                          items.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transfer Totals & Summary Card */}
        <div className="bg-[#172B25] text-white p-4 rounded-xl flex flex-wrap items-center justify-between text-xs gap-3">
          <div>
            <span className="text-gray-400 block">Total Dispatched Bags:</span>
            <span className="font-bold text-base text-white">{totalBags} Bags</span>
          </div>
          <div>
            <span className="text-gray-400 block">Total Dispatched Weight:</span>
            <span className="font-bold text-base text-emerald-400">
              {totalWeightKg.toLocaleString()} Kg ({(totalWeightKg / 40).toFixed(1)} Maunds)
            </span>
          </div>
          <div className="text-[11px] text-gray-300 italic max-w-sm">
            Status will be marked <span className="text-amber-300 font-semibold">IN_TRANSIT</span>. Stock will be deducted immediately from source warehouse and credited to destination upon arrival verification.
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
            Transfer Notes & Gate Clearance Remarks
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55]"
            placeholder="Special loading instructions, seal numbers..."
          />
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
            {isSubmitting ? 'Dispatching Stock...' : 'Dispatch Transfer (In-Transit)'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
