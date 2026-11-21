import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { GeneralLedgerLine } from '../../types/accounting';
import { accountingService } from '../../services/accounting.service';
import { Printer, RefreshCw, BookOpen } from 'lucide-react';

interface GeneralLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeneralLedgerModal: React.FC<GeneralLedgerModalProps> = ({ isOpen, onClose }) => {
  const [lines, setLines] = useState<GeneralLedgerLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountCode, setAccountCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await accountingService.getGeneralLedger({
        accountCode: accountCode || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      setLines(res);
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
  }, [isOpen]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="General Ledger (Khatavani)"
      subtitle="Complete chronological transaction postings across the full Chart of Accounts"
      maxWidth="4xl"
    >
      <div className="p-6 space-y-4">
        {/* Header Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4EAE5]">
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Filter by Code</label>
              <input
                type="text"
                placeholder="e.g. 1010, 6010..."
                value={accountCode}
                onChange={(e) => setAccountCode(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#E4EAE5] rounded-xl text-xs focus:outline-none focus:border-emerald-600 font-mono"
              />
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
              className="mt-4 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              Filter
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Ledger
          </button>
        </div>

        {/* General Ledger Table */}
        <div className="border border-[#E4EAE5] rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#087A55] text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-20">Date</th>
                <th className="py-2.5 px-3 w-24">Voucher #</th>
                <th className="py-2.5 px-3 w-24">Type</th>
                <th className="py-2.5 px-3">Account Title</th>
                <th className="py-2.5 px-3">Narration / Memo</th>
                <th className="py-2.5 px-3 w-24 text-right">Debit (Rs)</th>
                <th className="py-2.5 px-3 w-24 text-right">Credit (Rs)</th>
                <th className="py-2.5 px-3 w-24 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAE5]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading General Ledger records...
                  </td>
                </tr>
              ) : lines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No ledger postings found for the selected filter.
                  </td>
                </tr>
              ) : (
                lines.map((l, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2 px-3 text-slate-600">
                      {new Date(l.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{l.voucherNo}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {l.voucherType}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-[#172B25]">
                      <span className="font-mono text-emerald-800 font-bold mr-1">[{l.accountCode}]</span>
                      {l.accountName}
                    </td>
                    <td className="py-2 px-3 text-slate-600 truncate max-w-xs">{l.narration}</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">
                      {Number(l.debit) > 0 ? Number(l.debit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-red-600">
                      {Number(l.credit) > 0 ? Number(l.credit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {Number(l.runningBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
