import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { purchaseService } from '../../services/purchase.service';
import { Supplier, SupplierStatementResponse } from '../../types/purchase';
import { Printer, BookOpen, Building2, Phone, Calendar, ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react';

interface SupplierLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  defaultSupplierId?: string;
}

export const SupplierLedgerModal: React.FC<SupplierLedgerModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  defaultSupplierId,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(defaultSupplierId || '');
  const [statement, setStatement] = useState<SupplierStatementResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (defaultSupplierId) {
      setSelectedSupplierId(defaultSupplierId);
    } else if (suppliers.length > 0 && !selectedSupplierId) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [defaultSupplierId, suppliers]);

  useEffect(() => {
    if (isOpen && selectedSupplierId) {
      fetchStatement(selectedSupplierId);
    }
  }, [isOpen, selectedSupplierId, startDate, endDate]);

  const fetchStatement = async (supplierId: string) => {
    try {
      setIsLoading(true);
      const data = await purchaseService.getSupplierStatement(supplierId, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setStatement(data);
    } catch (err) {
      console.error('Failed to load supplier statement:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supplier Khatabook & Statement of Accounts" maxWidth="2xl">
      <div className="space-y-4">
        {/* Selection & Date Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5]">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Select Supplier / Mandi Arthi
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] bg-white rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.businessName || s.city || 'Mandi'}) — Balance: PKR {Number(s.currentBalance).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div>
              <label className="block text-xs font-semibold text-[#172B25] mb-1">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-[#E4EAE5] bg-white rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172B25] mb-1">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-[#E4EAE5] bg-white rounded-xl outline-none"
              />
            </div>
            <div className="pt-5">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print
              </Button>
            </div>
          </div>
        </div>

        {/* Statement Content */}
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[#718078]">
            Loading supplier ledger transactions...
          </div>
        ) : statement ? (
          <div className="space-y-4 print:p-0">
            {/* Header info */}
            <div className="p-4 bg-white border border-[#E4EAE5] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#172B25]">{statement.supplier.name}</h3>
                  {statement.supplier.isArthi && (
                    <span className="text-[10px] bg-emerald-100 text-[#087A55] px-2 py-0.5 rounded-full font-bold">
                      MANDI ARTHI
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#718078] mt-0.5">
                  {statement.supplier.businessName} • {statement.supplier.city} • Phone: {statement.supplier.phone}
                </p>
              </div>

              {/* Outstanding Badge */}
              <div className="bg-[#F5F7F5] px-4 py-2 rounded-xl border border-[#E4EAE5] text-right">
                <span className="text-[10px] font-bold text-[#718078] uppercase block">
                  Current Net Payable (Credit)
                </span>
                <span className="text-lg font-bold font-mono text-[#087A55]">
                  PKR {Number(statement.closingBalance || statement.summary?.currentBalance || statement.supplier.currentBalance).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Financial Summary 4-Col Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5]">
                <span className="text-[10px] text-[#718078] uppercase font-bold block">Opening Balance</span>
                <span className="text-sm font-bold font-mono text-[#172B25]">
                  PKR {Number(statement.openingBalance || statement.summary?.openingBalance || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5]">
                <span className="text-[10px] text-[#718078] uppercase font-bold block">Total Inward Bills (Cr)</span>
                <span className="text-sm font-bold font-mono text-[#087A55]">
                  + PKR {Number(statement.totalCredit || statement.summary?.totalBilled || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5]">
                <span className="text-[10px] text-[#718078] uppercase font-bold block">Payments Paid (Dr)</span>
                <span className="text-sm font-bold font-mono text-emerald-600">
                  - PKR {Number(statement.totalDebit || statement.summary?.totalPayments || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5]">
                <span className="text-[10px] text-[#718078] uppercase font-bold block">Net Closing Balance (Cr)</span>
                <span className="text-sm font-bold font-mono text-[#064E3B]">
                  PKR {Number(statement.closingBalance || statement.summary?.currentBalance || statement.supplier.currentBalance).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Ledger Transactions Table */}
            <div className="border border-[#E4EAE5] rounded-xl overflow-hidden bg-white">
              <div className="overflow-x-auto max-h-[350px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[#172B25] font-semibold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Reference / Bill #</th>
                      <th className="py-2 px-3">Transaction Type</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right text-emerald-700">Debit (Paid)</th>
                      <th className="py-2 px-3 text-right text-[#087A55]">Credit (Billed)</th>
                      <th className="py-2 px-3 text-right font-bold text-[#172B25]">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4EAE5]">
                    {((statement.transactions || statement.entries || [])).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#718078]">
                          No ledger postings found for this period.
                        </td>
                      </tr>
                    ) : (
                      (statement.transactions || statement.entries || []).map((entry) => (
                        <tr key={entry.id} className="hover:bg-[#F5F7F5]/50">
                          <td className="py-2 px-3 font-mono text-[#718078]">
                            {new Date(entry.date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="py-2 px-3 font-mono font-medium text-[#087A55]">
                            {entry.referenceNo}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                              {entry.transactionType}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[#172B25]">
                            {entry.description}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-700">
                            {Number(entry.debit) > 0 ? `PKR ${Number(entry.debit).toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[#087A55]">
                            {Number(entry.credit) > 0 ? `PKR ${Number(entry.credit).toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#172B25]">
                            PKR {Number(entry.runningBalance).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
