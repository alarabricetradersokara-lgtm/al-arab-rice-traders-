import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { TrialBalanceReport } from '../../types/accounting';
import { accountingService } from '../../services/accounting.service';
import { Printer, Scale, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface TrialBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrialBalanceModal: React.FC<TrialBalanceModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<TrialBalanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await accountingService.getTrialBalance({ asOfDate });
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, asOfDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Trial Balance (General Ledger Reconciliation)"
      subtitle="Comprehensive proof of mathematical accuracy: Total Debits equal Total Credits"
      maxWidth="4xl"
    >
      <div className="p-6 space-y-4">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4EAE5]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#172B25]">As of Date:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#E4EAE5] rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
            />
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 rounded-lg border border-[#E4EAE5] text-[#718078] hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {data && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                  data.isBalanced
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {data.isBalanced ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Trial Balance Balanced
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Trial Balance Out of Balance
                  </>
                )}
              </div>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Report
            </button>
          </div>
        </div>

        {/* Trial Balance Table */}
        <div className="border border-[#E4EAE5] rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#087A55] text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-20">Code</th>
                <th className="py-2.5 px-3">Account Title</th>
                <th className="py-2.5 px-3 w-24">Type</th>
                <th className="py-2.5 px-3 w-32 text-right">Debit (PKR)</th>
                <th className="py-2.5 px-3 w-32 text-right">Credit (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAE5]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Calculating Trial Balance from ledger transactions...
                  </td>
                </tr>
              ) : !data || data.lines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No transactions recorded for the selected period.
                  </td>
                </tr>
              ) : (
                data.lines.map((l, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-700">{l.accountCode}</td>
                    <td className="py-2 px-3 font-medium text-[#172B25]">{l.accountName}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {l.accountType}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-800">
                      {Number(l.debit) > 0 ? Number(l.debit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-800">
                      {Number(l.credit) > 0 ? Number(l.credit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {data && (
              <tfoot className="bg-emerald-50 border-t-2 border-emerald-600 font-bold text-xs text-emerald-950">
                <tr>
                  <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider">
                    Grand Totals:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-900 font-extrabold text-sm">
                    Rs {Number(data.totalDebits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-900 font-extrabold text-sm">
                    Rs {Number(data.totalCredits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-[#718078] pt-2">
          <span>AL ARAB RICE TRADERS - Enterprise Accounting Engine</span>
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
