import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { purchaseService } from '../../services/purchase.service';
import { Purchase } from '../../types/purchase';
import { RotateCcw, AlertTriangle, Scale, DollarSign } from 'lucide-react';

interface PurchaseReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase | null;
  onSuccess: () => void;
}

export const PurchaseReturnModal: React.FC<PurchaseReturnModalProps> = ({
  isOpen,
  onClose,
  purchase,
  onSuccess,
}) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [bagsReturned, setBagsReturned] = useState('');
  const [weightReturnedKg, setWeightReturnedKg] = useState('');
  const [returnRatePerKg, setReturnRatePerKg] = useState('');
  const [reason, setReason] = useState('Quality rejection: Excess broken grains and moisture');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When purchase changes, pre-select first item
  React.useEffect(() => {
    if (purchase && purchase.items && purchase.items.length > 0) {
      const firstItem = purchase.items[0];
      setSelectedProductId(firstItem.productId);
      setReturnRatePerKg(firstItem.unitPricePerKg.toString());
      setBagsReturned(firstItem.bagCount.toString());
      setWeightReturnedKg(firstItem.netWeightKg.toString());
    }
  }, [purchase]);

  if (!purchase) return null;

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const item = purchase.items.find((i) => i.productId === prodId);
    if (item) {
      setReturnRatePerKg(item.unitPricePerKg.toString());
      setBagsReturned(item.bagCount.toString());
      setWeightReturnedKg(item.netWeightKg.toString());
    }
  };

  const calculatedRefund =
    (parseFloat(weightReturnedKg) || 0) * (parseFloat(returnRatePerKg) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !weightReturnedKg || !returnRatePerKg) {
      setError('Product, weight returned and rate are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await purchaseService.createPurchaseReturn({
        purchaseId: purchase.id,
        productId: selectedProductId,
        bagsReturned: parseInt(bagsReturned, 10) || 0,
        weightReturnedKg: parseFloat(weightReturnedKg),
        returnRatePerKg: parseFloat(returnRatePerKg),
        reason,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post purchase return debit note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Issue Debit Note / Purchase Rejection Return" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Bill Context Banner */}
        <div className="p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5] text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-[#718078]">Original Bill No:</span>
            <span className="font-mono font-bold text-[#087A55]">{purchase.purchaseNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#718078]">Supplier / Arthi:</span>
            <span className="font-bold text-[#172B25]">{purchase.supplier?.name}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1">
            Rice Variety to Return <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
          >
            {purchase.items.map((it) => (
              <option key={it.productId} value={it.productId}>
                {it.product?.name || 'Rice Variety'} — {it.bagCount} bags ({Number(it.netWeightKg).toLocaleString()} kg) @ PKR {it.unitPricePerKg}/kg
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Bags Returned
            </label>
            <input
              type="number"
              value={bagsReturned}
              onChange={(e) => setBagsReturned(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Net Weight Returned (KG) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={weightReturnedKg}
              onChange={(e) => setWeightReturnedKg(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Return Rate (PKR / KG) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={returnRatePerKg}
              onChange={(e) => setReturnRatePerKg(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Debit Note Amount
            </label>
            <div className="px-3 py-2 text-sm border border-emerald-200 bg-emerald-50 text-[#087A55] font-mono font-bold rounded-xl">
              PKR {calculatedRefund.toLocaleString()}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1">
            Reason for Quality Return / Claim
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
          />
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <span>
            Confirming this debit note will immediately deduct <strong>{weightReturnedKg || 0} kg</strong> from godown stock and debit <strong>PKR {calculatedRefund.toLocaleString()}</strong> to the supplier's Khatabook ledger.
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#E4EAE5]">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Posting Debit Note...' : 'Confirm Debit Note & Deduct Stock'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
