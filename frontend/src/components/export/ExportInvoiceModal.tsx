import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ExportCustomer, Incoterm } from '../../types/advanced';
import { RiceProduct, Warehouse } from '../../types/inventory';
import { AlertCircle, Ship, DollarSign } from 'lucide-react';

interface ExportInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  customers: ExportCustomer[];
  products: RiceProduct[];
  warehouses: Warehouse[];
}

export const ExportInvoiceModal: React.FC<ExportInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customers,
  products,
  warehouses,
}) => {
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState(customers[0]?.preferredCurrency || 'USD');
  const [exchangeRate, setExchangeRate] = useState<number | ''>(280);
  const [contractNo, setContractNo] = useState('');
  const [incoterm, setIncoterm] = useState<Incoterm>('FOB');
  const [portOfLoading, setPortOfLoading] = useState('Karachi Port, Pakistan');
  const [portOfDischarge, setPortOfDischarge] = useState(customers[0]?.destinationPort || 'Jebel Ali Port, Dubai');
  const [containerNumber, setContainerNumber] = useState('');
  const [blNumber, setBlNumber] = useState('');
  const [shippingLine, setShippingLine] = useState('MSC Mediterranean Shipping');

  // Product Line Item
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [bagType, setBagType] = useState('PP Non-Woven 40KG Export Bag');
  const [bagWeightKg, setBagWeightKg] = useState<number | ''>(40);
  const [bagCount, setBagCount] = useState<number | ''>(625);
  const [ratePerMtFcy, setRatePerMtFcy] = useState<number | ''>(1150);
  const [grainLengthMm, setGrainLengthMm] = useState<number | ''>(8.35);
  const [moisturePct, setMoisturePct] = useState<number | ''>(12.0);
  const [brokenPct, setBrokenPct] = useState<number | ''>(1.0);

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numBags = Number(bagCount) || 0;
  const numBagWeight = Number(bagWeightKg) || 0;
  const totalWeightKg = numBags * numBagWeight;
  const totalWeightMt = totalWeightKg / 1000;

  const numRate = Number(ratePerMtFcy) || 0;
  const totalFcy = totalWeightMt * numRate;
  const numFx = Number(exchangeRate) || 0;
  const totalPkr = totalFcy * numFx;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select an export customer');
      return;
    }
    if (totalWeightMt <= 0) {
      setError('Export quantity must be greater than zero');
      return;
    }
    if (numRate <= 0) {
      setError('Export rate per MT must be greater than zero');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        exportCustomerId: customerId,
        warehouseId,
        invoiceDate: new Date(invoiceDate).toISOString(),
        currency,
        exchangeRate: numFx,
        contractNo,
        incoterm,
        portOfLoading,
        portOfDischarge,
        containerNumber,
        blNumber,
        shippingLine,
        notes,
        items: [
          {
            productId,
            bagType,
            bagWeightKg: numBagWeight,
            bagCount: numBags,
            totalWeightKg,
            totalWeightMt,
            ratePerMtFcy: numRate,
            grainLengthMm: Number(grainLengthMm) || null,
            moisturePct: Number(moisturePct) || null,
            brokenPct: Number(brokenPct) || null,
          },
        ],
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create export invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create International Export Invoice & Shipment"
      subtitle="Issue export invoice with shipping details, container specifications, and foreign currency accounting"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Export Buyer *</label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                const c = customers.find((x) => x.id === e.target.value);
                if (c) {
                  setCurrency(c.preferredCurrency);
                  if (c.destinationPort) setPortOfDischarge(c.destinationPort);
                }
              }}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.country})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Dispatch Warehouse</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Invoice Date *</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-xs focus:outline-none focus:border-emerald-600"
              required
            />
          </div>
        </div>

        {/* Currency & Exchange Rate */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-none"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="AED">AED (Dirham)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Exchange Rate (PKR / FCY)</label>
            <input
              type="number"
              step="any"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="280.00"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Incoterms</label>
            <select
              value={incoterm}
              onChange={(e) => setIncoterm(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-none"
            >
              <option value="FOB">FOB (Free On Board)</option>
              <option value="CIF">CIF (Cost, Insurance & Freight)</option>
              <option value="CFR">CFR (Cost and Freight)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Contract / L/C Ref</label>
            <input
              type="text"
              value={contractNo}
              onChange={(e) => setContractNo(e.target.value)}
              placeholder="LC-8921-DUBAI"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* Shipping & Container Details */}
        <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
          <span className="text-xs font-bold text-blue-900 uppercase flex items-center gap-1.5">
            <Ship className="w-4 h-4 text-blue-700" />
            Shipping & Vessel Specifications
          </span>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Container Number</label>
              <input
                type="text"
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
                placeholder="MSCU-892104-5"
                className="w-full px-2 py-1 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Bill of Lading (B/L) #</label>
              <input
                type="text"
                value={blNumber}
                onChange={(e) => setBlNumber(e.target.value)}
                placeholder="MEDU-DXB-9921"
                className="w-full px-2 py-1 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Shipping Line</label>
              <input
                type="text"
                value={shippingLine}
                onChange={(e) => setShippingLine(e.target.value)}
                placeholder="MSC / Maersk / Hapag"
                className="w-full px-2 py-1 bg-white border border-blue-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Port of Discharge</label>
              <input
                type="text"
                value={portOfDischarge}
                onChange={(e) => setPortOfDischarge(e.target.value)}
                placeholder="Jebel Ali Port, Dubai"
                className="w-full px-2 py-1 bg-white border border-blue-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Product Specification & Export Pricing */}
        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5">
          <span className="text-xs font-bold text-emerald-900 uppercase">Product & Export Metric Ton Quantity</span>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Rice Variety</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-medium focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Bag Weight (KG)</label>
              <input
                type="number"
                value={bagWeightKg}
                onChange={(e) => setBagWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="40"
                className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Total Bags</label>
              <input
                type="number"
                value={bagCount}
                onChange={(e) => setBagCount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="625"
                className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Rate / Metric Ton ({currency})</label>
              <input
                type="number"
                value={ratePerMtFcy}
                onChange={(e) => setRatePerMtFcy(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="1150"
                className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1 border-t border-emerald-200 text-xs">
            <div>
              <label className="block text-[10px] text-slate-500">Grain Length (mm)</label>
              <input
                type="number"
                step="any"
                value={grainLengthMm}
                onChange={(e) => setGrainLengthMm(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="8.35"
                className="w-full px-2 py-1 bg-white border rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500">Moisture %</label>
              <input
                type="number"
                step="any"
                value={moisturePct}
                onChange={(e) => setMoisturePct(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="12.0"
                className="w-full px-2 py-1 bg-white border rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500">Broken Grain %</label>
              <input
                type="number"
                step="any"
                value={brokenPct}
                onChange={(e) => setBrokenPct(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="1.0"
                className="w-full px-2 py-1 bg-white border rounded font-mono"
              />
            </div>
          </div>
        </div>

        {/* Live Export Valuation Strip */}
        <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Export Total ({currency})</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono">
              {currency} {totalFcy.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block">Quantity: {totalWeightMt.toFixed(2)} Metric Tons ({totalWeightKg.toLocaleString()} KG)</span>
          </div>

          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase">PKR Booking Value (@ Rs {numFx})</span>
            <span className="text-base font-extrabold text-amber-300 font-mono">
              Rs {totalPkr.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
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
            disabled={isSubmitting}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Issuing Invoice...' : 'Issue Export Invoice & Book Receivable'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
