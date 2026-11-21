import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { WarehouseTransfer } from '../../types/advanced';
import { AlertCircle, CheckCircle2, Truck, AlertTriangle } from 'lucide-react';

interface ReceiveTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transferId: string, data: any) => Promise<void>;
  transfer: WarehouseTransfer | null;
}

interface ReceivedItemRow {
  itemId: string;
  productId: string;
  productName: string;
  sentBags: number;
  sentWeightKg: number;
  receivedBags: number | '';
  receivedWeightKg: number | '';
}

export const ReceiveTransferModal: React.FC<ReceiveTransferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  transfer,
}) => {
  const [items, setItems] = useState<ReceivedItemRow[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transfer && transfer.items) {
      setItems(
        transfer.items.map((i) => ({
          itemId: i.id || '',
          productId: i.productId,
          productName: i.product?.name || 'Rice Product',
          sentBags: i.sentBags,
          sentWeightKg: Number(i.sentWeightKg),
          receivedBags: i.sentBags,
          receivedWeightKg: Number(i.sentWeightKg),
        }))
      );
    }
  }, [transfer]);

  if (!transfer) return null;

  const handleRowChange = (index: number, field: 'receivedBags' | 'receivedWeightKg', val: number | '') => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    setItems(updated);
  };

  const totalSentWeight = items.reduce((s, i) => s + i.sentWeightKg, 0);
  const totalReceivedWeight = items.reduce((s, i) => s + (Number(i.receivedWeightKg) || 0), 0);
  const totalWeightShortage = Math.max(0, totalSentWeight - totalReceivedWeight);

  const totalSentBags = items.reduce((s, i) => s + i.sentBags, 0);
  const totalReceivedBags = items.reduce((s, i) => s + (Number(i.receivedBags) || 0), 0);
  const totalBagShortage = Math.max(0, totalSentBags - totalReceivedBags);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const item of items) {
      if ((Number(item.receivedWeightKg) || 0) < 0) {
        setError('Received weight cannot be negative');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(transfer.id, {
        receivedItems: items.map((i) => ({
          itemId: i.itemId,
          productId: i.productId,
          receivedBags: Number(i.receivedBags) || 0,
          receivedWeightKg: Number(i.receivedWeightKg) || 0,
        })),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to receive warehouse transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verify & Receive Warehouse Transfer" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center text-sm">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Transfer Header Card */}
        <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[#718078] block">Transfer Voucher:</span>
            <span className="font-bold text-sm text-[#172B25]">{transfer.transferNumber}</span>
          </div>
          <div>
            <span className="text-[#718078] block">Route:</span>
            <span className="font-semibold text-[#172B25]">
              {transfer.fromWarehouse?.name} &rarr; {transfer.toWarehouse?.name}
            </span>
          </div>
          <div>
            <span className="text-[#718078] block">Truck & Driver:</span>
            <span className="font-semibold text-[#172B25]">
              {transfer.vehicleNumber || 'N/A'} {transfer.driverName ? `(${transfer.driverName})` : ''}
            </span>
          </div>
          <div>
            <span className="text-[#718078] block">Gate Pass / Bilty:</span>
            <span className="font-mono text-[#087A55] font-semibold">{transfer.biltyNumber || 'N/A'}</span>
          </div>
        </div>

        {/* Inward Inspection Items Table */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-[#172B25] uppercase tracking-wider flex items-center">
              <Truck className="w-4 h-4 mr-1.5 text-[#087A55]" />
              Inward Weighbridge & Bag Count Verification
            </h4>
            <span className="text-[11px] text-[#718078]">
              Verify destination physical count against dispatched dispatch waybill
            </span>
          </div>

          <div className="border border-[#E4EAE5] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold uppercase tracking-wider border-b border-[#E4EAE5]">
                <tr>
                  <th className="py-2.5 px-3">Rice Variety</th>
                  <th className="py-2.5 px-3 text-right">Sent Bags</th>
                  <th className="py-2.5 px-3 text-right">Sent Wt (Kg)</th>
                  <th className="py-2.5 px-3 w-32">Received Bags</th>
                  <th className="py-2.5 px-3 w-36">Received Wt (Kg)</th>
                  <th className="py-2.5 px-3 text-right">Transit Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EAE5]">
                {items.map((item, idx) => {
                  const recBags = Number(item.receivedBags) || 0;
                  const recWt = Number(item.receivedWeightKg) || 0;
                  const bagDiff = item.sentBags - recBags;
                  const wtDiff = item.sentWeightKg - recWt;
                  const hasShortage = bagDiff > 0 || wtDiff > 0;

                  return (
                    <tr key={item.itemId || idx} className="hover:bg-gray-50/60">
                      <td className="py-2.5 px-3 font-semibold text-[#172B25]">{item.productName}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#718078]">{item.sentBags}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#718078]">
                        {item.sentWeightKg.toLocaleString()}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.receivedBags}
                          onChange={(e) =>
                            handleRowChange(
                              idx,
                              'receivedBags',
                              e.target.value === '' ? '' : parseInt(e.target.value)
                            )
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-[#E4EAE5] rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#087A55]"
                          required
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.receivedWeightKg}
                          onChange={(e) =>
                            handleRowChange(
                              idx,
                              'receivedWeightKg',
                              e.target.value === '' ? '' : parseFloat(e.target.value)
                            )
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-[#E4EAE5] rounded-lg font-semibold text-[#087A55] focus:outline-none focus:ring-2 focus:ring-[#087A55]"
                          required
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {hasShortage ? (
                          <span className="text-[#DC5050] font-bold">
                            -{wtDiff.toFixed(1)} Kg {bagDiff > 0 ? `(-${bagDiff} bags)` : ''}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold flex items-center justify-end">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Exact
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shortage & Transit Shrinkage Notification Card */}
        {totalWeightShortage > 0 && (
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start space-x-3 text-xs text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm">
                Transit Shortage Detected: {totalWeightShortage.toFixed(1)} Kg ({totalBagShortage} Bags)
              </span>
              <p className="mt-0.5 text-amber-700">
                The shortage will be recorded automatically as a verified <span className="font-semibold">WASTAGE / TRANSIT_LOSS</span> stock movement with full audit logs. Destination warehouse will be credited only for the exact verified received weight ({totalReceivedWeight.toLocaleString()} Kg).
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#172B25] uppercase tracking-wider mb-1.5">
            Destination Inspection & Unloading Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55]"
            placeholder="Condition of bags on arrival, driver remarks, weighbridge ticket #..."
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
            {isSubmitting ? 'Confirming Arrival...' : 'Confirm Receipt & Inward Stock'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
