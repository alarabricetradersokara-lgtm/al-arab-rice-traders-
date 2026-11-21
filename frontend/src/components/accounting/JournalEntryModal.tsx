import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

interface JVLine {
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  debit: number;
  credit: number;
  memo: string;
}

const COMMON_COA_OPTIONS = [
  { code: '1010', name: 'Cash in Hand (Counter / Drawer)', type: 'ASSET' },
  { code: '1020', name: 'Bank Accounts (Current / Savings)', type: 'ASSET' },
  { code: '1100', name: 'Accounts Receivable (Customers Khata)', type: 'ASSET' },
  { code: '1200', name: 'Rice Inventory (Milled / Packaged)', type: 'ASSET' },
  { code: '1500', name: 'Mill Machinery & Plant Equipment', type: 'ASSET' },
  { code: '1510', name: 'Weighbridge (Kanda) & Scale', type: 'ASSET' },
  { code: '2010', name: 'Accounts Payable (Suppliers & Arthis)', type: 'LIABILITY' },
  { code: '2100', name: 'Accrued Utility & Labor Expenses', type: 'LIABILITY' },
  { code: '3010', name: 'Owners Capital', type: 'EQUITY' },
  { code: '3020', name: 'Retained Earnings', type: 'EQUITY' },
  { code: '4010', name: 'Rice Sales Revenue', type: 'REVENUE' },
  { code: '4100', name: 'Rice Milling & Husking Service Charges', type: 'REVENUE' },
  { code: '4200', name: 'By-Products Sales (Husk / Bran / Tota)', type: 'REVENUE' },
  { code: '4900', name: 'Miscellaneous Income & Bardana Sales', type: 'REVENUE' },
  { code: '5010', name: 'Cost of Goods Sold - Rice', type: 'EXPENSE' },
  { code: '6010', name: 'Staff Salaries & Mill Wages', type: 'EXPENSE' },
  { code: '6020', name: 'Mill Electricity & Power Fuel', type: 'EXPENSE' },
  { code: '6030', name: 'Godown & Office Rent', type: 'EXPENSE' },
  { code: '6040', name: 'Loading & Unloading Palledari', type: 'EXPENSE' },
  { code: '6050', name: 'Transportation & Cartage (Bilty)', type: 'EXPENSE' },
  { code: '6060', name: 'Machinery Repair & Maintenance', type: 'EXPENSE' },
  { code: '6070', name: 'Office, Tea & Stationery Expenses', type: 'EXPENSE' },
  { code: '6900', name: 'General & Miscellaneous Expenses', type: 'EXPENSE' },
];

export const JournalEntryModal: React.FC<JournalEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNo, setReferenceNo] = useState('');
  const [narration, setNarration] = useState('');
  const [lines, setLines] = useState<JVLine[]>([
    {
      accountCode: '6060',
      accountName: 'Machinery Repair & Maintenance',
      accountType: 'EXPENSE',
      debit: 0,
      credit: 0,
      memo: '',
    },
    {
      accountCode: '1010',
      accountName: 'Cash in Hand (Counter / Drawer)',
      accountType: 'ASSET',
      debit: 0,
      credit: 0,
      memo: '',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalDebits = lines.reduce((acc, l) => acc + (Number(l.debit) || 0), 0);
  const totalCredits = lines.reduce((acc, l) => acc + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebits > 0 && Math.abs(totalDebits - totalCredits) < 0.01;

  const handleAccountSelect = (index: number, code: string) => {
    const selected = COMMON_COA_OPTIONS.find((c) => c.code === code);
    if (!selected) return;
    const updated = [...lines];
    updated[index].accountCode = selected.code;
    updated[index].accountName = selected.name;
    updated[index].accountType = selected.type as any;
    setLines(updated);
  };

  const handleLineChange = (index: number, field: keyof JVLine, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        accountCode: '1010',
        accountName: 'Cash in Hand (Counter / Drawer)',
        accountType: 'ASSET',
        debit: 0,
        credit: 0,
        memo: '',
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narration) {
      setError('Journal narration is required');
      return;
    }
    if (!isBalanced) {
      setError(`Voucher is not balanced! Debits: Rs ${totalDebits.toLocaleString()}, Credits: Rs ${totalCredits.toLocaleString()}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        entryDate: new Date(entryDate).toISOString(),
        voucherType: 'JOURNAL',
        referenceNo,
        narration,
        lines: lines.map((l) => ({
          accountCode: l.accountCode,
          accountName: l.accountName,
          accountType: l.accountType,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          memo: l.memo || narration,
        })),
      });
      setReferenceNo('');
      setNarration('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to post journal entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Double-Entry Journal Voucher (JV)"
      subtitle="Manual compound journal entry with real-time debit and credit reconciliation"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Voucher Date *</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Reference / Bill #</label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. JV-ADJ-2026/01"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Status</label>
            <div className="h-9 flex items-center px-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
              POSTED (IMMEDIATE)
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1">Journal Narration *</label>
          <input
            type="text"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="e.g. End of month depreciation / provision adjustment for godown fixtures"
            className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            required
          />
        </div>

        {/* Dynamic Journal Lines Table */}
        <div className="border border-[#E4EAE5] rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[#172B25] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Chart of Account</th>
                <th className="py-2.5 px-3 w-40">Particulars / Memo</th>
                <th className="py-2.5 px-3 w-28 text-right">Debit (Rs)</th>
                <th className="py-2.5 px-3 w-28 text-right">Credit (Rs)</th>
                <th className="py-2.5 px-3 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAE5]">
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 px-3">
                    <select
                      value={line.accountCode}
                      onChange={(e) => handleAccountSelect(idx, e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-[#E4EAE5] rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-600"
                    >
                      {COMMON_COA_OPTIONS.map((coa) => (
                        <option key={coa.code} value={coa.code}>
                          [{coa.code}] {coa.name} ({coa.type})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={line.memo}
                      onChange={(e) => handleLineChange(idx, 'memo', e.target.value)}
                      placeholder="Line memo..."
                      className="w-full px-2 py-1.5 bg-white border border-[#E4EAE5] rounded-lg text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={line.debit || ''}
                      onChange={(e) => handleLineChange(idx, 'debit', Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full px-2 py-1.5 bg-white border border-[#E4EAE5] rounded-lg text-xs text-right font-mono font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={line.credit || ''}
                      onChange={(e) => handleLineChange(idx, 'credit', Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full px-2 py-1.5 bg-white border border-[#E4EAE5] rounded-lg text-xs text-right font-mono font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      disabled={lines.length <= 2}
                      className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-20 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#F5F7F5] border-t border-[#E4EAE5] font-bold">
              <tr>
                <td colSpan={2} className="py-2 px-3 text-right">
                  Total Debits & Credits:
                </td>
                <td className="py-2 px-3 text-right font-mono text-emerald-800">
                  Rs {totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 text-right font-mono text-emerald-800">
                  Rs {totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Journal Line
          </button>

          {/* Balanced Status Banner */}
          <div className="flex items-center gap-2">
            {isBalanced ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Voucher Balanced: Debits = Credits
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Out of Balance: Difference Rs {Math.abs(totalDebits - totalCredits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4EAE5]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#E4EAE5] rounded-xl text-sm font-semibold text-[#718078] hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isBalanced}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Posting Voucher...' : 'Post Journal Voucher'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
