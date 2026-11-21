import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import type { DailySalesEntry } from '../../types/dailySales';
import { dailySalesService } from '../../services/dailySales.service';
import { FileText, RotateCcw } from 'lucide-react';

interface DailySalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string;
  onSelectEntryForReport: (entryId: string) => void;
  onEntryReversed: () => void;
}

export const DailySalesHistoryModal: React.FC<DailySalesHistoryModalProps> = ({
  isOpen,
  onClose,
  warehouseId,
  onSelectEntryForReport,
  onEntryReversed,
}) => {
  const [entries, setEntries] = useState<DailySalesEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reversalTarget, setReversalTarget] = useState<DailySalesEntry | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, warehouseId]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await dailySalesService.getDailySalesHistory({ warehouseId: warehouseId || undefined });
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load past closings history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalTarget || !reversalReason) return;

    try {
      setIsReversing(true);
      await dailySalesService.reverseDailySales(reversalTarget.id, reversalReason);
      setReversalTarget(null);
      setReversalReason('');
      onEntryReversed();
      loadHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Reversal failed');
    } finally {
      setIsReversing(false);
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="emerald" size="sm">CONFIRMED</Badge>;
      case 'DRAFT':
        return <Badge variant="warning" size="sm">DRAFT</Badge>;
      case 'REVERSED':
        return <Badge variant="danger" size="sm">REVERSED</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Sales Closing Register"
      subtitle="Audit history of past daily closures, shift totals, and authorization reversals"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Reversal Prompt Modal Overlay */}
        {reversalTarget && (
          <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-sm font-bold text-[#DC2626]">
              <RotateCcw className="w-4 h-4" />
              <span>Authorize Daily Sales Reversal for {reversalTarget.entryNumber}</span>
            </div>
            <p className="text-xs text-[#718078]">
              This action will restore all deducted grain inventory back to the warehouse godown, cancel the cash account postings, and reverse customer Khatabook balances.
            </p>
            <form onSubmit={handleConfirmReversal} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Enter mandatory operational reason (e.g. Audit correction, duplicate entry, supervisor adjustment)..."
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full bg-white border border-[#FECACA] rounded-lg px-3 py-2 text-xs text-[#172B25] focus:outline-hidden focus:ring-2 focus:ring-[#DC2626]/30"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" type="button" onClick={() => setReversalTarget(null)}>
                  Cancel
                </Button>
                <Button size="sm" variant="danger" type="submit" isLoading={isReversing}>
                  Confirm & Reverse Entry
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="border border-[#E4EAE5] rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[11px] font-bold text-[#718078] uppercase">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Voucher #</th>
                  <th className="py-3 px-3">Godown</th>
                  <th className="py-3 px-3 text-right">Bags</th>
                  <th className="py-3 px-3 text-right">Net Weight</th>
                  <th className="py-3 px-3 text-right">Net Sales (PKR)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EAE5]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#718078]">
                      Loading past closing entries...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#718078]">
                      No previous daily sales entries recorded yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F5F7F5]/70 transition-colors">
                      <td className="py-2.5 px-3 font-semibold">
                        {new Date(item.salesDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#172B25]">{item.entryNumber}</td>
                      <td className="py-2.5 px-3 text-[#718078]">{item.warehouse?.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-bold">{item.totalBagsSold}</td>
                      <td className="py-2.5 px-3 text-right font-mono-num">{Number(item.totalWeightSoldKg).toLocaleString()} Kg</td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-bold text-[#087A55]">
                        PKR {Number(item.netAmount).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">{formatStatus(item.status)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectEntryForReport(item.id)}
                            title="View / Print Closing Report"
                            className="p-1.5 rounded-lg text-[#718078] hover:text-[#087A55] hover:bg-[#E8F5E9] transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {item.status === 'CONFIRMED' && (
                            <button
                              onClick={() => setReversalTarget(item)}
                              title="Authorized Reversal"
                              className="p-1.5 rounded-lg text-[#718078] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};
