import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../common/Button';
import { MetricCard } from '../common/MetricCard';
import type { CatalogProductWithStock } from '../../types/dailySales';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  FileText,
  Landmark,
  MessageCircle,
  PackageCheck,
  Plus,
  Scale,
  Trash2,
  Truck,
  Wallet,
  X,
} from 'lucide-react';

export interface OwnerDispatchRecord {
  id: string;
  date: string;
  type: 'RICE_GOODS' | 'CASH_INVESTMENT';
  varietyName?: string;
  bagCount?: number;
  weightKg?: number;
  ratePerKg?: number;
  totalAmount: number;
  vehicleNumber?: string;
  biltyNumber?: string;
  driverName?: string;
  notes?: string;
  createdAt: string;
}

interface OwnerDispatchLedgerScreenProps {
  productsCatalog?: CatalogProductWithStock[];
  showToast: (msg: string) => void;
}

const STORAGE_KEY_DISPATCH = 'alarab_owner_dispatches';
const STORAGE_KEY_REMITTANCE = 'alarab_mansehra_remittances';

export const OwnerDispatchLedgerScreen: React.FC<OwnerDispatchLedgerScreenProps> = ({
  productsCatalog = [],
  showToast,
}) => {
  const [dispatches, setDispatches] = useState<OwnerDispatchRecord[]>([]);
  const [remittances, setRemittances] = useState<any[]>([]);

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dispatchType, setDispatchType] = useState<'RICE_GOODS' | 'CASH_INVESTMENT'>('RICE_GOODS');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [customVariety, setCustomVariety] = useState<string>('');
  const [bagCount, setBagCount] = useState<number | ''>(500);
  const [bagWeightKg, setBagWeightKg] = useState<number>(50);
  const [ratePerKg, setRatePerKg] = useState<number | ''>(260);
  const [manualTotalAmount, setManualTotalAmount] = useState<number | ''>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [biltyNumber, setBiltyNumber] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const rawDispatches = localStorage.getItem(STORAGE_KEY_DISPATCH);
      if (rawDispatches) {
        setDispatches(JSON.parse(rawDispatches));
      } else {
        setDispatches([]);
      }

      const rawRemit = localStorage.getItem(STORAGE_KEY_REMITTANCE);
      if (rawRemit) {
        setRemittances(JSON.parse(rawRemit));
      } else {
        setRemittances([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveDispatches = (updated: OwnerDispatchRecord[]) => {
    setDispatches(updated);
    try {
      localStorage.setItem(STORAGE_KEY_DISPATCH, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Auto calculate total for rice goods
  const calculatedWeightKg = useMemo(() => {
    const bags = Number(bagCount) || 0;
    return bags * (bagWeightKg || 50);
  }, [bagCount, bagWeightKg]);

  const calculatedGoodsTotal = useMemo(() => {
    if (dispatchType === 'CASH_INVESTMENT') {
      return Number(manualTotalAmount) || 0;
    }
    const rate = Number(ratePerKg) || 0;
    return calculatedWeightKg * rate;
  }, [dispatchType, manualTotalAmount, calculatedWeightKg, ratePerKg]);

  // Aggregate Totals
  const { totalSentAmount, totalRecoveredAmount, netBalanceDue } = useMemo(() => {
    const totalSent = dispatches.reduce((acc, d) => acc + Number(d.totalAmount || 0), 0);
    const totalRecovered = remittances.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const netDue = totalSent - totalRecovered;

    return {
      totalSentAmount: totalSent,
      totalRecoveredAmount: totalRecovered,
      netBalanceDue: netDue,
    };
  }, [dispatches, remittances]);

  // Handle Form Submit
  const handleSaveDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = calculatedGoodsTotal;
    if (!finalAmount || finalAmount <= 0) {
      showToast('براہ کرم مالیت یا رقم درست درج کریں۔');
      return;
    }

    let finalVariety = customVariety.trim();
    if (selectedProductId) {
      const p = productsCatalog.find((x) => x.id === selectedProductId);
      if (p) finalVariety = p.name;
    }
    if (dispatchType === 'RICE_GOODS' && !finalVariety) {
      finalVariety = 'کائنات باسمتی چاول';
    }

    if (editingId) {
      // Update existing
      const updated = dispatches.map((d) => {
        if (d.id === editingId) {
          return {
            ...d,
            date,
            type: dispatchType,
            varietyName: dispatchType === 'RICE_GOODS' ? finalVariety : undefined,
            bagCount: dispatchType === 'RICE_GOODS' ? Number(bagCount) : undefined,
            weightKg: dispatchType === 'RICE_GOODS' ? calculatedWeightKg : undefined,
            ratePerKg: dispatchType === 'RICE_GOODS' ? Number(ratePerKg) : undefined,
            totalAmount: finalAmount,
            vehicleNumber: vehicleNumber.trim() || undefined,
            biltyNumber: biltyNumber.trim() || undefined,
            driverName: driverName.trim() || undefined,
            notes: notes.trim() || undefined,
          };
        }
        return d;
      });

      saveDispatches(updated);
      setEditingId(null);
      showToast('مال روانگی اینٹری کامیابی سے اپ ڈیٹ ہو گئی۔');
    } else {
      // Create new
      const newRec: OwnerDispatchRecord = {
        id: 'DISP-' + Date.now(),
        date,
        type: dispatchType,
        varietyName: dispatchType === 'RICE_GOODS' ? finalVariety : undefined,
        bagCount: dispatchType === 'RICE_GOODS' ? Number(bagCount) : undefined,
        weightKg: dispatchType === 'RICE_GOODS' ? calculatedWeightKg : undefined,
        ratePerKg: dispatchType === 'RICE_GOODS' ? Number(ratePerKg) : undefined,
        totalAmount: finalAmount,
        vehicleNumber: vehicleNumber.trim() || undefined,
        biltyNumber: biltyNumber.trim() || undefined,
        driverName: driverName.trim() || undefined,
        notes: notes.trim() || undefined,
        createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };

      const updated = [newRec, ...dispatches];
      saveDispatches(updated);
      showToast(`اوکاڑہ سے PKR ${finalAmount.toLocaleString()} کی روانگی کامیابی سے درج ہو گئی۔`);
    }

    // Reset Form
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setVehicleNumber('');
    setBiltyNumber('');
    setDriverName('');
    setNotes('');
    setManualTotalAmount('');
  };

  const handleStartEdit = (rec: OwnerDispatchRecord) => {
    setEditingId(rec.id);
    setDate(rec.date);
    setDispatchType(rec.type);
    if (rec.type === 'RICE_GOODS') {
      setCustomVariety(rec.varietyName || '');
      setBagCount(rec.bagCount || 500);
      setRatePerKg(rec.ratePerKg || 260);
    } else {
      setManualTotalAmount(rec.totalAmount);
    }
    setVehicleNumber(rec.vehicleNumber || '');
    setBiltyNumber(rec.biltyNumber || '');
    setDriverName(rec.driverName || '');
    setNotes(rec.notes || '');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDispatch = (id: string) => {
    if (window.confirm('کیا آپ واقعی یہ مال روانگی ریکارڈ حذف کرنا چاہتے ہیں؟ سسٹم فوراً ٹوٹل ایڈجسٹ کر لے گا۔')) {
      const updated = dispatches.filter((d) => d.id !== id);
      saveDispatches(updated);
      showToast('مال روانگی ریکارڈ حذف کر دیا گیا۔');
    }
  };

  // Combined Passbook Ledger (Dispatches as DEBIT, Remittances as CREDIT)
  const unifiedLedger = useMemo(() => {
    const combined: Array<{
      id: string;
      date: string;
      title: string;
      category: 'DISPATCH' | 'REMITTANCE';
      subtitle: string;
      reference: string;
      debitAmount: number; // Owner Sent (Adds to balance)
      creditAmount: number; // Money Returned (Minuses from balance)
      originalItem: any;
    }> = [];

    for (const d of dispatches) {
      combined.push({
        id: d.id,
        date: d.date,
        title: d.type === 'RICE_GOODS' ? `🌾 ${d.varietyName || 'چاول مال روانگی'}` : '💵 نقد سرمایہ / کیش بھیجا',
        category: 'DISPATCH',
        subtitle: d.type === 'RICE_GOODS'
          ? `${d.bagCount} بوریاں (${d.weightKg?.toLocaleString()} kg) @ PKR ${d.ratePerKg}/kg`
          : 'اوکاڑہ سے کیش سرمایہ کاری',
        reference: d.vehicleNumber ? `ٹرک: ${d.vehicleNumber} (بلٹی: ${d.biltyNumber || 'N/A'})` : (d.biltyNumber || 'اوکاڑہ'),
        debitAmount: d.totalAmount,
        creditAmount: 0,
        originalItem: d,
      });
    }

    for (const r of remittances) {
      combined.push({
        id: r.id,
        date: r.date,
        title: r.mode === 'BANK' ? `🏦 بینک ٹرانسفر (${r.bankName || 'بینک'})` : '💵 نقد کیش وصولی',
        category: 'REMITTANCE',
        subtitle: `بھیجنے والا: ${r.driverOrSender} ${r.notes ? `(${r.notes})` : ''}`,
        reference: r.referenceNumber || 'وصولی سلپ',
        debitAmount: 0,
        creditAmount: r.amount,
        originalItem: r,
      });
    }

    // Sort by date descending
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return combined;
  }, [dispatches, remittances]);

  // Share Statement on WhatsApp
  const handleShareWhatsApp = () => {
    const text = `*العرب رائس ٹریڈرز (اوکاڑہ ⟷ مانسہرہ اونر کھاتہ)*%0A` +
      `*اونر اجمل فیضان سرمایہ و مال کھاتہ*%0A` +
      `━━━━━━━━━━━━━━━━━━%0A` +
      `📦 *کل مال و سرمایہ بھیجا:* PKR ${totalSentAmount.toLocaleString()}%0A` +
      `💰 *کل پیسہ واپس وصول شدہ:* PKR ${totalRecoveredAmount.toLocaleString()}%0A` +
      `━━━━━━━━━━━━━━━━━━%0A` +
      `⚖️ *باقی بقایا رقم (Net Due from Branch):* PKR ${netBalanceDue.toLocaleString()}%0A` +
      `━━━━━━━━━━━━━━━━━━%0A` +
      `نوٹ: یہ کھاتہ اوکاڑہ اور مانسہرہ کے درمیان لائیو ایڈجسٹ ہوتا ہے۔`;

    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-900/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-emerald-300 uppercase">
              اوکاڑہ ہیڈ آفس ⟷ مانسہرہ شاپ کیپیٹل کھاتہ
            </span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-emerald-400" />
            <span>اوکاڑہ سے مال روانگی و سرمایہ کھاتہ</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            اونر (حاجی محمد عرب) جتنا چاول مال یا کیش مانسہرہ بھیجتا ہے وہ جمع ہوتا ہے، اور وہاں سے جیسے جیسے کیش واپس آتا ہے وہ خود بخود مائنس ہو کر خالص بقایا دکھاتا ہے۔
          </p>
        </div>

        <button
          onClick={handleShareWhatsApp}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all shrink-0 self-start sm:self-auto"
        >
          <MessageCircle className="w-4 h-4 text-emerald-200" />
          <span>کھاتہ واٹس ایپ کریں</span>
        </button>
      </div>

      {/* 2. Top 3 High-Impact KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Sent */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-xs font-bold text-slate-700">کل مال و سرمایہ بھیجا</span>
              <span className="text-[10px] text-slate-400 uppercase">· Total Sent</span>
            </div>
            <div className="text-2xl font-extrabold text-blue-900 font-mono-num">
              PKR {totalSentAmount.toLocaleString()}
            </div>
            <span className="text-[11px] text-blue-700 font-medium">اوکاڑہ سے چاول اور کیش</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Recovered via Remittances */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="text-xs font-bold text-slate-700">کل پیسہ واپس آیا (موصولہ)</span>
              <span className="text-[10px] text-emerald-600 uppercase font-bold">· Minus Auto</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-800 font-mono-num">
              PKR {totalRecoveredAmount.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">مانسہرہ سیلز سے وصول شدہ کیش</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Net Balance Due from Mansehra */}
        <div className="bg-emerald-900 text-white p-5 rounded-2xl border border-emerald-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-200">باقی بقایا رقم (Net Due)</span>
            </div>
            <div className="text-2xl font-black text-white font-mono-num">
              PKR {netBalanceDue.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-300 font-medium">
              {netBalanceDue >= 0 ? 'مانسہرہ دکان پر اونر کا بقایا سرمایہ' : 'مانسہرہ نے زیادہ منافع کیش بھیج دیا ہے'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-300 flex items-center justify-center border border-white/20">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Action Grid: Input Form (Left 5 cols) & Unified Ledger Passbook (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>{editingId ? 'مال روانگی ریکارڈ ترمیم کریں' : 'اوکاڑہ سے نیا مال یا کیش بھیجیں'}</span>
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-bold"
              >
                <X className="w-3.5 h-3.5" /> کینسل کریں
              </button>
            )}
          </div>

          <form onSubmit={handleSaveDispatch} className="space-y-4">
            {/* Dispatch Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 text-right">
                روانگی کی نوعیت منتخب کریں (Type)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDispatchType('RICE_GOODS')}
                  className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    dispatchType === 'RICE_GOODS'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Boxes className="w-4 h-4" />
                  <span>🌾 چاول مال بھیجا (Goods)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDispatchType('CASH_INVESTMENT')}
                  className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    dispatchType === 'CASH_INVESTMENT'
                      ? 'bg-blue-700 text-white border-blue-800 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>💵 نقد کیش سرمایہ (Cash)</span>
                </button>
              </div>
            </div>

            {/* Date Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 text-right">
                روانگی کی تاریخ (Dispatch Date)
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold outline-none"
              />
            </div>

            {/* If RICE_GOODS */}
            {dispatchType === 'RICE_GOODS' && (
              <div className="space-y-3 p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 text-right">
                    چاول کی ورائٹی (Rice Variety) *
                  </label>
                  {productsCatalog.length > 0 ? (
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value);
                        const p = productsCatalog.find((x) => x.id === e.target.value);
                        if (p) setRatePerKg(p.salePricePerKg || 260);
                      }}
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                    >
                      <option value="">ورائٹی منتخب کریں...</option>
                      {productsCatalog.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="مثلاً 1121 کائنات سٹیم چاول"
                      value={customVariety}
                      onChange={(e) => setCustomVariety(e.target.value)}
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 text-right">
                      بوریاں (Bags Count) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      placeholder="500"
                      value={bagCount}
                      onChange={(e) => setBagCount(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 text-right">
                      فی بوری وزن (Kg)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={bagWeightKg}
                      onChange={(e) => setBagWeightKg(parseInt(e.target.value || '50', 10))}
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 text-right">
                      کل وزن (Calculated KG)
                    </label>
                    <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 text-right">
                      {calculatedWeightKg.toLocaleString()} Kg
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 text-right">
                      فی کلو مالیت / ریٹ (PKR) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      step="any"
                      required
                      placeholder="260"
                      value={ratePerKg}
                      onChange={(e) => setRatePerKg(e.target.value ? parseFloat(e.target.value) : '')}
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-800 outline-none text-right"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs font-bold text-emerald-950">
                  <span>کل مالیت (Goods Valuation):</span>
                  <span className="font-mono text-sm text-emerald-800 font-black">
                    PKR {calculatedGoodsTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* If CASH_INVESTMENT */}
            {dispatchType === 'CASH_INVESTMENT' && (
              <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-2.5">
                <label className="block text-xs font-bold text-blue-950 text-right">
                  نقد رقم / سرمایہ کاری (Amount PKR) *
                </label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  placeholder="0.00"
                  value={manualTotalAmount}
                  onChange={(e) => setManualTotalAmount(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 text-base font-mono font-bold text-slate-900 outline-none text-right"
                />
              </div>
            )}

            {/* Transport Logistics */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 text-right">
                  ٹرک / گاڑی نمبر
                </label>
                <input
                  type="text"
                  placeholder="مثلاً LES-8920"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 text-right">
                  بلٹی نمبر (Bilty #)
                </label>
                <input
                  type="text"
                  placeholder="مثلاً BL-4902"
                  value={biltyNumber}
                  onChange={(e) => setBiltyNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 text-right">
                ڈرائیور کا نام / رابطہ
              </label>
              <input
                type="text"
                placeholder="مثلاً ڈرائیور ریاض (0300-1234567)"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 text-right">
                اضافی تفصیل / نوٹس
              </label>
              <input
                type="text"
                placeholder="مثلاً 50 کلو والی نئی باردانہ بوریوں میں مال بھیجا گیا۔"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 outline-none"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3.5 text-sm font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl shadow-xs"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {editingId ? 'تبدیلیاں محفوظ کریں (Update Record)' : 'روانگی محفوظ کریں (Save Dispatch)'}
            </Button>
          </form>
        </div>

        {/* Ledger Passbook Table (Right 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>اوکاڑہ ⟷ مانسہرہ لائیو کھاتہ پاس بک (Ledger)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                مال و کیش روانگی (Debit) بمقابلہ موصول شدہ واپسی (Credit)
              </p>
            </div>

            <span className="text-xs font-black font-mono px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-full">
              بقایا بیلنس: PKR {netBalanceDue.toLocaleString()}
            </span>
          </div>

          {/* Table List */}
          {unifiedLedger.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">ابھی تک کوئی مال یا کیش روانگی درج نہیں</h4>
              <p className="text-xs text-slate-400 mt-1">بائیں طرف فارم سے اوکاڑہ سے بھیجا گیا مال درج کریں۔</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unifiedLedger.map((item) => {
                const isDispatch = item.category === 'DISPATCH';
                return (
                  <div
                    key={item.id}
                    className={`bg-white p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                      isDispatch ? 'border-blue-100 hover:border-blue-200' : 'border-emerald-100 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isDispatch ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isDispatch ? <Truck className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isDispatch ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {isDispatch ? '📦 مال / کیش بھیجا (+)' : '💰 پیسہ واپس آیا (-)'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {item.date}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 mt-1">{item.title}</h4>
                        <p className="text-xs text-slate-600 mt-0.5">{item.subtitle}</p>
                        {item.reference && (
                          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                            حوالہ: {item.reference}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 gap-2">
                      <span
                        className={`font-mono font-black text-base ${
                          isDispatch ? 'text-blue-900' : 'text-emerald-700'
                        }`}
                      >
                        {isDispatch ? `+ PKR ${item.debitAmount.toLocaleString()}` : `- PKR ${item.creditAmount.toLocaleString()}`}
                      </span>

                      {/* Edit & Delete Action Buttons */}
                      {isDispatch && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item.originalItem)}
                            className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="ترمیم کریں (Edit)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteDispatch(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف کریں (Delete)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
