import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CashAccount, CashBookReport } from '../../types/accounting';
import { accountingService } from '../../services/accounting.service';
import { Printer, RefreshCw, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';

interface CashBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashAccounts: CashAccount[];
}

export const CashBookModal: React.FC<CashBookModalProps> = ({ isOpen, onClose, cashAccounts }) => {
  const [selectedAccountId, setSelectedAccountId] = useState(cashAccounts[0]?.id || '');
  const [data, setData] = useState<CashBookReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    if (!selectedAccountId) return;
    try {
      setLoading(true);
      const res = await accountingService.getCashBook(selectedAccountId, {
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedAccountId) {
      loadData();
    }
  }, [isOpen, selectedAccountId]);

  useEffect(() => {
    if (!selectedAccountId && cashAccounts.length > 0) {
      setSelectedAccountId(cashAccounts[0].id);
    }
  }, [cashAccounts]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cash Book (Roznamcha Naqd)"
      subtitle="Complete chronological cash drawer ledger of receipts, expenses, and liquidity movements"
      maxWidth="4xl"
    >
      <div className="p-6 space-y-4">
        {/* Header Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4EAE5]">
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Cash Drawer</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E4EAE5] rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
              >
                {cashAccounts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Rs {Number(c.balance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#E4EAE5] rounded-xl text-xs focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#E4EAE5] rounded-xl text-xs focus:outline-none focus:border-emerald-600"
              />
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="mt-4 p-1.5 rounded-lg border border-[#E4EAE5] text-[#718078] hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Cash Book
          </button>
        </div>

        {/* Top Summaries */}
        {data && (
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Drawer Balance</span>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">
                Rs {Number(data.account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-800 uppercase">Total Cash Inflow</span>
              <p className="text-base font-extrabold text-emerald-800 mt-0.5">
                +Rs {Number(data.totalDeposits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl">
              <span className="text-[10px] font-bold text-red-800 uppercase">Total Cash Outflow</span>
              <p className="text-base font-extrabold text-red-600 mt-0.5">
                -Rs {Number(data.totalWithdrawals).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Net Flow</span>
              <p className="text-base font-extrabold text-slate-800 mt-0.5">
                Rs {Number(data.netFlow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        {/* Cash Book Transactions Table */}
        <div className="border border-[#E4EAE5] rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#087A55] text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-24">Date</th>
                <th className="py-2.5 px-3 w-28">Ref #</th>
                <th className="py-2.5 px-3">Particulars / Narration</th>
                <th className="py-2.5 px-3 w-28 text-right">Inflow (Rs)</th>
                <th className="py-2.5 px-3 w-28 text-right">Outflow (Rs)</th>
                <th className="py-2.5 px-3 w-28 text-right">Running (Rs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAE5]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading Cash Book ledger...
                  </td>
                </tr>
              ) : !data || data.transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No cash transactions recorded for this period.
                  </td>
                </tr>
              ) : (
                data.transactions.map((t, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2 px-3 text-slate-600">
                      {new Date(t.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-700">{t.ref}</td>
                    <td className="py-2 px-3 font-medium text-[#172B25]">{t.description}</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">
                      {Number(t.deposit) > 0 ? Number(t.deposit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-red-600">
                      {Number(t.withdrawal) > 0 ? Number(t.withdrawal).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      Rs {Number(t.runningBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
