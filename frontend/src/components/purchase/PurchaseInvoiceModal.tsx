import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Purchase } from '../../types/purchase';
import { Printer, CheckCircle2, Truck, Calendar, Building2, MapPin, Scale } from 'lucide-react';

interface PurchaseInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase | null;
}

export const PurchaseInvoiceModal: React.FC<PurchaseInvoiceModalProps> = ({
  isOpen,
  onClose,
  purchase,
}) => {
  if (!purchase) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalBags = purchase.items?.reduce((acc, it) => acc + (it.bagCount || 0), 0) || 0;
  const totalNetKg = purchase.items?.reduce((acc, it) => acc + Number(it.netWeightKg || 0), 0) || 0;
  const totalMaunds = (totalNetKg / 40).toFixed(2);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Purchase Inward Bill & Kanda Weighbridge Slip" maxWidth="2xl">
      <div className="space-y-4">
        {/* Print Bar */}
        <div className="flex justify-between items-center bg-[#F5F7F5] p-3 rounded-xl border border-[#E4EAE5] print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#718078]">Bill Reference:</span>
            <span className="font-mono font-bold text-[#087A55] text-sm">{purchase.purchaseNumber}</span>
            <span className="text-xs bg-emerald-100 text-[#087A55] px-2 py-0.5 rounded-full font-bold ml-2">
              {purchase.status}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Bill Slip
          </Button>
        </div>

        {/* Printable Bill Area */}
        <div className="bg-white p-6 border border-[#E4EAE5] rounded-xl shadow-xs print:border-none print:shadow-none print:p-0 text-[#172B25] text-xs">
          {/* Header */}
          <div className="border-b-2 border-[#087A55] pb-4 mb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#087A55] flex items-center justify-center text-white font-bold text-lg">
                  🌾
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-[#087A55]">AL ARAB RICE TRADERS</h1>
                  <p className="text-[10px] text-[#718078] font-medium tracking-wide">
                    PREMIUM GRAIN PROCUREMENT, MILLING & MANDI TRADING
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-[#718078] mt-2">
                GT Road Rice Market, Kamoke / Gujranwala • Tel: +92 (55) 612-8899 • NTN: 8921473-1
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider bg-[#087A55] text-white px-2.5 py-1 rounded">
                GRAIN INWARD VOUCHER (KANDA)
              </span>
              <p className="text-sm font-mono font-bold text-[#087A55] mt-2">{purchase.purchaseNumber}</p>
              <p className="text-[11px] text-[#718078] flex items-center justify-end gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                {new Date(purchase.purchaseDate).toLocaleDateString('en-GB')} {new Date(purchase.purchaseDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Supplier & Logistics 2-Col Grid */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5] mb-4">
            <div>
              <span className="text-[10px] font-bold text-[#718078] uppercase block">SUPPLIER / MANDI ARTHI</span>
              <p className="text-sm font-bold text-[#172B25] mt-0.5">{purchase.supplier?.name}</p>
              <p className="text-xs text-[#718078]">{purchase.supplier?.businessName}</p>
              <p className="text-xs text-[#718078]">
                {purchase.supplier?.city} • Phone: {purchase.supplier?.phone}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-[#718078] uppercase block">LOGISTICS & DESTINATION</span>
              <p className="text-xs font-bold text-[#172B25] mt-0.5 flex items-center justify-end gap-1">
                <Truck className="w-3.5 h-3.5 text-[#087A55]" />
                Truck / Vehicle: <span className="font-mono">{purchase.truckNumber || 'N/A'}</span>
              </p>
              <p className="text-xs text-[#718078]">
                Bilty / Builty No: <span className="font-mono font-semibold">{purchase.biltyNumber || 'DIRECT MANDI'}</span>
              </p>
              <p className="text-xs text-[#718078]">
                Inward Godown: <span className="font-semibold text-[#087A55]">{purchase.warehouse?.name}</span>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse border border-[#E4EAE5] mb-4">
            <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold text-[11px]">
              <tr>
                <th className="py-2 px-2 border border-[#E4EAE5]">#</th>
                <th className="py-2 px-2 border border-[#E4EAE5]">Rice Variety / Item</th>
                <th className="py-2 px-2 border border-[#E4EAE5] text-right">Bags</th>
                <th className="py-2 px-2 border border-[#E4EAE5] text-right">Bag Wt</th>
                <th className="py-2 px-2 border border-[#E4EAE5] text-right">Gross Wt</th>
                <th className="py-2 px-2 border border-[#E4EAE5] text-right">Tare (Bardana)</th>
                <th className="py-2 px-2 border border-[#E4EAE5] text-right">Net Wt (Kg)</th>
                <th className="py-2 px-2 border border-[#E4EAE5] text-right">Maunds (40kg)</th>
                <th className="py-2 px-2 border border-[#E4EAE5] text-right">Rate / KG</th>
                <th className="py-2 px-2 border border-[#E4EAE5] text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAE5]">
              {purchase.items?.map((item, idx) => {
                const maunds = (Number(item.netWeightKg) / 40).toFixed(2);
                return (
                  <tr key={item.id || idx}>
                    <td className="py-2 px-2 border border-[#E4EAE5] font-mono text-[#718078]">{idx + 1}</td>
                    <td className="py-2 px-2 border border-[#E4EAE5]">
                      <span className="font-bold text-[#172B25]">{item.product?.name || 'Rice Product'}</span>
                      <span className="text-[10px] text-[#718078] block">{item.product?.variety} ({item.product?.grade})</span>
                    </td>
                    <td className="py-2 px-2 border border-[#E4EAE5] text-right font-mono font-semibold">{item.bagCount}</td>
                    <td className="py-2 px-2 border border-[#E4EAE5] text-right font-mono">{Number(item.bagWeightKg)} kg</td>
                    <td className="py-2 px-2 border border-[#E4EAE5] text-right font-mono text-[#718078]">{Number(item.grossWeightKg)} kg</td>
                    <td className="py-2 px-2 border border-[#E4EAE5] text-right font-mono text-red-600">-{Number(item.bardanaTareKg)} kg</td>
                    <td className="py-2 px-2 border border-[#E4EAE5] text-right font-mono font-bold text-[#087A55]">
                      {Number(item.netWeightKg).toLocaleString()} kg
                    </td>
                    <td className="py-2 px-2 border border-[#E4EAE5] text-right font-mono text-[#064E3B] bg-emerald-50/50">
                      {maunds} md
                    </td>
                    <td className="py-2 px-2 border border-[#E4EAE5] text-right font-mono font-bold">
                      PKR {Number(item.unitPricePerKg).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 border border-[#E4EAE5] text-right font-mono font-bold">
                      PKR {Number(item.lineTotal).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-[#F5F7F5] font-bold text-[#172B25]">
              <tr>
                <td colSpan={2} className="py-2 px-2 border border-[#E4EAE5] text-right">TOTALS:</td>
                <td className="py-2 px-2 border border-[#E4EAE5] text-right font-mono text-[#087A55]">{totalBags} Bags</td>
                <td colSpan={3} className="py-2 px-2 border border-[#E4EAE5]"></td>
                <td className="py-2 px-2 border border-[#E4EAE5] text-right font-mono text-[#087A55]">{totalNetKg.toLocaleString()} kg</td>
                <td className="py-2 px-2 border border-[#E4EAE5] text-right font-mono text-[#064E3B]">{totalMaunds} md</td>
                <td className="py-2 px-2 border border-[#E4EAE5]"></td>
                <td className="py-2 px-2 border border-[#E4EAE5] text-right font-mono">PKR {Number(purchase.subTotal).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          {/* Mandi Deductions & Landed Cost Breakdown */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5] space-y-2">
              <span className="text-[10px] font-bold text-[#718078] uppercase block">DEDUCTIONS & MANDI CUTS</span>
              <div className="flex justify-between text-xs">
                <span>Moisture Cut (Karda Weight):</span>
                <span className="font-mono text-red-600">-{Number(purchase.moistureDeductionWeightKg || 0)} kg</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Moisture Deduction Amount:</span>
                <span className="font-mono text-red-600">-PKR {Number(purchase.moistureDeductionAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Karda Quality Cut Amount:</span>
                <span className="font-mono text-red-600">-PKR {Number(purchase.kardaDeductionAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Mandi Commission:</span>
                <span className="font-mono text-[#087A55]">+PKR {Number(purchase.commissionAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Palledari (Handling / Labor):</span>
                <span className="font-mono text-[#087A55]">+PKR {Number(purchase.palledariAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Freight Cartage (Attributed Landed Cost):</span>
                <span className="font-mono text-[#087A55]">+PKR {Number(purchase.freightAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Final Financial Settlement */}
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#718078]">Gross Subtotal:</span>
                  <span className="font-mono font-semibold">PKR {Number(purchase.subTotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#718078]">Payment Terms:</span>
                  <span className="font-bold text-[#087A55]">{purchase.paymentType}</span>
                </div>
                <div className="border-t border-emerald-200 pt-1.5 flex justify-between text-sm font-bold text-[#087A55]">
                  <span>Net Inward Amount:</span>
                  <span className="font-mono text-base">PKR {Number(purchase.netAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-800">
                  <span>Amount Paid At Inward:</span>
                  <span className="font-mono font-semibold">PKR {Number(purchase.paidAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-amber-800 font-bold border-t border-emerald-200/50 pt-1">
                  <span>Outstanding Credit Balance:</span>
                  <span className="font-mono">PKR {Number(purchase.balanceAmount).toLocaleString()}</span>
                </div>
              </div>

              {purchase.notes && (
                <p className="text-[10px] text-[#718078] italic mt-2 border-t border-emerald-200 pt-1">
                  Notes: {purchase.notes}
                </p>
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-6 mt-6 border-t border-[#E4EAE5] text-center text-[10px] text-[#718078]">
            <div>
              <div className="border-b border-[#E4EAE5] pb-4 mb-1"></div>
              <span>Prepared By (Munshi)</span>
            </div>
            <div>
              <div className="border-b border-[#E4EAE5] pb-4 mb-1"></div>
              <span>Weighbridge Master (Kanda)</span>
            </div>
            <div>
              <div className="border-b border-[#E4EAE5] pb-4 mb-1"></div>
              <span>Driver / Supplier Confirmation</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
