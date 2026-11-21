import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { purchaseService } from '../../services/purchase.service';
import { RiceProduct } from '../../types/inventory';
import { PurchaseRateHistoryItem } from '../../types/purchase';
import { TrendingUp, Filter, Calendar, Building, Scale, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface PurchaseRateHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: RiceProduct[];
  defaultProductId?: string;
}

export const PurchaseRateHistoryModal: React.FC<PurchaseRateHistoryModalProps> = ({
  isOpen,
  onClose,
  products,
  defaultProductId,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(defaultProductId || '');
  const [rateHistory, setRateHistory] = useState<PurchaseRateHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRateHistory(selectedProductId || undefined);
    }
  }, [isOpen, selectedProductId]);

  const fetchRateHistory = async (productId?: string) => {
    try {
      setIsLoading(true);
      const data = await purchaseService.getPurchaseRateHistory({
        productId: productId || undefined,
        limit: 50,
      });
      setRateHistory(data);
    } catch (err) {
      console.error('Failed to load purchase rate history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const avgRate =
    rateHistory.length > 0
      ? rateHistory.reduce((acc, curr) => acc + curr.ratePerKg, 0) / rateHistory.length
      : 0;

  const minRate =
    rateHistory.length > 0 ? Math.min(...rateHistory.map((r) => r.ratePerKg)) : 0;
  const maxRate =
    rateHistory.length > 0 ? Math.max(...rateHistory.map((r) => r.ratePerKg)) : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rice Procurement Rate History & Mandi Price Intelligence" maxWidth="2xl">
      <div className="space-y-4">
        {/* Filter & Metric Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5]">
          <div className="w-full md:w-72">
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Filter by Rice Variety / Product
            </label>
            <div className="relative">
              <Filter className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#E4EAE5] bg-white rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
              >
                <option value="">All Rice Varieties</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.variety})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="bg-white px-3 py-2 rounded-xl border border-[#E4EAE5] text-center">
              <span className="text-[10px] text-[#718078] uppercase font-bold block">Avg Procurement</span>
              <span className="text-sm font-bold text-[#087A55]">PKR {avgRate.toFixed(2)}/kg</span>
              <span className="text-[10px] text-[#718078] block">~ PKR {(avgRate * 40).toFixed(0)}/md</span>
            </div>
            <div className="bg-white px-3 py-2 rounded-xl border border-[#E4EAE5] text-center">
              <span className="text-[10px] text-[#718078] uppercase font-bold block flex items-center justify-center gap-1">
                <ArrowDownRight className="w-3 h-3 text-emerald-600" /> Lowest Rate
              </span>
              <span className="text-sm font-bold text-emerald-600">PKR {minRate.toFixed(2)}/kg</span>
              <span className="text-[10px] text-[#718078] block">~ PKR {(minRate * 40).toFixed(0)}/md</span>
            </div>
            <div className="bg-white px-3 py-2 rounded-xl border border-[#E4EAE5] text-center">
              <span className="text-[10px] text-[#718078] uppercase font-bold block flex items-center justify-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-red-500" /> Peak Rate
              </span>
              <span className="text-sm font-bold text-red-500">PKR {maxRate.toFixed(2)}/kg</span>
              <span className="text-[10px] text-[#718078] block">~ PKR {(maxRate * 40).toFixed(0)}/md</span>
            </div>
          </div>
        </div>

        {/* Rates Table */}
        <div className="border border-[#E4EAE5] rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto max-h-[380px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[#172B25] font-semibold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Bill #</th>
                  <th className="py-2.5 px-3">Supplier / Mandi Arthi</th>
                  <th className="py-2.5 px-3">Rice Variety</th>
                  <th className="py-2.5 px-3 text-right">Bags Inward</th>
                  <th className="py-2.5 px-3 text-right">Net Weight</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#087A55]">Rate / KG</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#064E3B]">Rate / Maund (40kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EAE5]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#718078]">
                      Loading historical procurement rates...
                    </td>
                  </tr>
                ) : rateHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#718078]">
                      No historical purchase records found for this selection.
                    </td>
                  </tr>
                ) : (
                  rateHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F5F7F5]/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#718078]">
                        {new Date(item.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-[#087A55]">
                        {item.purchaseNumber}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#172B25]">
                        {item.supplierName}
                      </td>
                      <td className="py-2.5 px-3 text-[#172B25]">
                        <span className="font-semibold">{item.productName}</span>
                        <span className="text-[10px] text-[#718078] block">{item.variety}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {item.bagCount} bags
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#718078]">
                        {Number(item.netWeightKg).toLocaleString()} kg
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#087A55]">
                        PKR {Number(item.ratePerKg).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#064E3B] bg-emerald-50/50">
                        PKR {Number(item.ratePerMaund).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#F5F7F5] hover:bg-[#E4EAE5] text-[#172B25] text-xs font-semibold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
