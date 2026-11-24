import React, { useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { DailyClosingReportResponse } from '../../types/dailySales';
import { Printer, Scale, DollarSign, UserCheck, ShieldCheck } from 'lucide-react';

interface DailyClosingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: DailyClosingReportResponse | null;
}

export const DailyClosingReportModal: React.FC<DailyClosingReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!reportData) return null;

  const { entry, metrics, company } = reportData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Closing & Shift Settlement Report"
      subtitle={`Verified fiscal audit sheet for ${entry.entryNumber}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Printable Sheet */}
        <div
          ref={printRef}
          className="p-3 sm:p-6 bg-white border border-[#E4EAE5] rounded-xl shadow-xs space-y-6 text-[#172B25] print:p-0 print:border-none"
        >
          {/* Header */}
          <div className="text-center pb-4 border-b border-[#E4EAE5]">
            <h2 className="text-xl font-bold tracking-tight text-[#064E3B]">
              {company?.companyName || 'AL ARAB RICE TRADERS'}
            </h2>
            <p className="text-xs text-[#718078] font-medium mt-0.5">
              {company?.businessType || 'Rice Millers, Commission Agents & Exporters'}
            </p>
            <p className="text-xs text-[#718078]">{company?.address || 'مرکزی دکان، اناج مارکیٹ، مانسہرہ | ہیڈ آفس: اوکاڑہ'}</p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-[#E8F5E9] text-[#087A55] rounded-full text-xs font-bold border border-[#A7F3D0]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>OFFICIAL DAILY CLOSING REPORT · {entry.status}</span>
            </div>
          </div>

          {/* Meta Information Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#F5F7F5] rounded-lg text-xs border border-[#E4EAE5]">
            <div>
              <span className="text-[#718078] block">Date:</span>
              <span className="font-bold text-[#172B25]">{new Date(entry.salesDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <div>
              <span className="text-[#718078] block">Voucher No:</span>
              <span className="font-mono font-bold text-[#172B25]">{entry.entryNumber}</span>
            </div>
            <div>
              <span className="text-[#718078] block">Godown:</span>
              <span className="font-bold text-[#172B25]">{entry.warehouse?.name}</span>
            </div>
            <div>
              <span className="text-[#718078] block">Closure Status:</span>
              <span className={`font-bold ${entry.status === 'CONFIRMED' ? 'text-[#087A55]' : 'text-[#D97706]'}`}>
                {entry.status}
              </span>
            </div>
          </div>

          {/* Product Lines Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#718078] mb-2 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#087A55]" /> Quantity Sold & Price Breakdown
            </h4>
            <div className="border border-[#E4EAE5] rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[#718078] font-bold">
                    <th className="py-2 px-3">Rice Variety</th>
                    <th className="py-2 px-3 text-right">Bags</th>
                    <th className="py-2 px-3 text-right">Weight (Kg)</th>
                    <th className="py-2 px-3 text-right">Maunds</th>
                    <th className="py-2 px-3 text-right">Rate / Kg</th>
                    <th className="py-2 px-3 text-right">Total (PKR)</th>
                    <th className="py-2 px-3 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {entry.lines.map((line, idx) => {
                    const maunds = (Number(line.weightKg) / 40).toFixed(2);
                    return (
                      <tr key={idx} className="hover:bg-[#F5F7F5]/50">
                        <td className="py-2 px-3 font-semibold">{line.product?.name || 'Rice Variety'}</td>
                        <td className="py-2 px-3 text-right font-mono-num font-bold">{line.bagCount}</td>
                        <td className="py-2 px-3 text-right font-mono-num">{Number(line.weightKg).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono-num font-medium text-[#087A55]">{maunds}</td>
                        <td className="py-2 px-3 text-right font-mono-num">PKR {Number(line.ratePerKg).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono-num font-bold">PKR {Number(line.lineTotal).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono-num text-[#16A36A] font-semibold">PKR {Number(line.grossProfit).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F5F7F5] font-bold border-t border-[#E4EAE5]">
                    <td className="py-2.5 px-3 uppercase">Total Volume:</td>
                    <td className="py-2.5 px-3 text-right font-mono-num">{metrics.totalBags} Bags</td>
                    <td className="py-2.5 px-3 text-right font-mono-num">{Number(metrics.totalWeightKg).toLocaleString()} Kg</td>
                    <td className="py-2.5 px-3 text-right font-mono-num text-[#087A55]">{metrics.totalMaunds} Mnds</td>
                    <td className="py-2.5 px-3 text-right text-[#718078]">-</td>
                    <td className="py-2.5 px-3 text-right font-mono-num text-sm text-[#064E3B]">PKR {Number(metrics.grossRevenue).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono-num text-[#16A36A]">PKR {Number(metrics.grossProfit).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Financial Settlement & Margins Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue & Profit Statement */}
            <div className="p-4 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5] space-y-2 text-xs">
              <h4 className="font-bold text-[#172B25] uppercase tracking-wide flex items-center gap-1.5 pb-1 border-b border-[#E4EAE5]">
                <DollarSign className="w-3.5 h-3.5 text-[#087A55]" /> Revenue & Cost Accounting
              </h4>
              <div className="flex justify-between">
                <span className="text-[#718078]">Gross Sales Revenue:</span>
                <span className="font-bold font-mono-num">PKR {Number(metrics.grossRevenue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#DC2626]">
                <span>Customer Discounts:</span>
                <span className="font-mono-num">- PKR {Number(metrics.discount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#DC2626]">
                <span>Broker / Arthi Commission:</span>
                <span className="font-mono-num">- PKR {Number(metrics.commission).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-[#E4EAE5] text-[#064E3B] text-sm">
                <span>Net Sales Revenue:</span>
                <span className="font-mono-num">PKR {Number(metrics.netRevenue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#718078]">
                <span>Cost of Goods Sold (COGS):</span>
                <span className="font-mono-num">PKR {Number(metrics.cogs).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-[#16A36A] pt-1 border-t border-[#E4EAE5]">
                <span>Gross Profit Margin ({metrics.grossMarginPct}%):</span>
                <span className="font-mono-num">PKR {Number(metrics.grossProfit).toLocaleString()}</span>
              </div>
            </div>

            {/* Cash & Credit Breakdown */}
            <div className="p-4 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5] space-y-2 text-xs">
              <h4 className="font-bold text-[#172B25] uppercase tracking-wide flex items-center gap-1.5 pb-1 border-b border-[#E4EAE5]">
                <UserCheck className="w-3.5 h-3.5 text-[#087A55]" /> Settlement & Credit Allocation
              </h4>
              <div className="flex justify-between font-semibold text-[#087A55]">
                <span>Physical Cash Received ({entry.cashAccount?.name || 'Vault'}):</span>
                <span className="font-bold font-mono-num">PKR {Number(metrics.cashReceived).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-[#D97706]">
                <span>Total Credit Sales:</span>
                <span className="font-bold font-mono-num">PKR {Number(entry.creditAmount).toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-[#E4EAE5] space-y-1">
                <span className="font-bold text-[11px] text-[#718078] uppercase block">Customer Credit Details:</span>
                {entry.customerAllocations.map((alloc, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[180px]">{alloc.customer?.name || alloc.customerName}</span>
                    <span className="font-mono-num font-semibold">PKR {Number(alloc.amount).toLocaleString()}</span>
                  </div>
                ))}
                {Number(metrics.unallocatedCredit) > 0 && (
                  <div className="flex justify-between text-[11px] text-[#DC2626] font-semibold pt-1 border-t border-[#E4EAE5]">
                    <span>Unallocated Counter Credit:</span>
                    <span className="font-mono-num">PKR {Number(metrics.unallocatedCredit).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 sm:pt-10 flex flex-wrap gap-4 justify-between text-xs text-[#718078] border-t border-[#E4EAE5]">
            <div className="text-center">
              <div className="w-36 border-b border-[#718078] mb-1" />
              <span>Shift Supervisor</span>
            </div>
            <div className="text-center">
              <div className="w-36 border-b border-[#718078] mb-1" />
              <span>Head Accountant</span>
            </div>
            <div className="text-center">
              <div className="w-36 border-b border-[#718078] mb-1" />
              <span>Managing Director</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4EAE5]">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            Print Closing Voucher
          </Button>
        </div>
      </div>
    </Modal>
  );
};
