import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { MetricCard } from '../common/MetricCard';
import { accountingService } from '../../services/accounting.service';
import type { BankAccount, CashAccount } from '../../types/accounting';
import {
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  FileText,
  Landmark,
  MessageCircle,
  Plus,
  Receipt,
  Trash2,
  Truck,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';

export interface RemittanceRecord {
  id: string;
  date: string;
  mode: 'CASH' | 'BANK';
  amount: number;
  bankAccountId?: string;
  bankName?: string;
  accountNumber?: string;
  cashAccountId?: string;
  cashAccountName?: string;
  referenceNumber: string;
  driverOrSender: string;
  notes?: string;
  createdAt: string;
}

interface BranchRemittanceSectionProps {
  selectedDate: string;
  onTotalCashRemittedChange?: (amount: number) => void;
  showToast: (msg: string) => void;
}

const STORAGE_KEY = 'alarab_mansehra_remittances';

export const BranchRemittanceSection: React.FC<BranchRemittanceSectionProps> = ({
  selectedDate,
  onTotalCashRemittedChange,
  showToast,
}) => {
  const [remittances, setRemittances] = useState<RemittanceRecord[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [editingRemittanceId, setEditingRemittanceId] = useState<string | null>(null);
  const [mode, setMode] = useState<'CASH' | 'BANK'>('CASH');
  const [amount, setAmount] = useState<number | ''>('');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [selectedCashId, setSelectedCashId] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [driverOrSender, setDriverOrSender] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // New Bank Modal / Inline Drawer
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newBranchTitle, setNewBranchTitle] = useState('');
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Load Accounts and Remittances
  useEffect(() => {
    loadAccounts();
    loadStoredRemittances();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const [banks, cash] = await Promise.all([
        accountingService.getBankAccounts(),
        accountingService.getCashAccounts(),
      ]);

      setBankAccounts(banks || []);
      setCashAccounts(cash || []);

      if (banks && banks.length > 0 && !selectedBankId) {
        setSelectedBankId(banks[0].id);
      }
      if (cash && cash.length > 0 && !selectedCashId) {
        setSelectedCashId(cash[0].id);
      }
    } catch (err) {
      console.warn('Failed to load accounts, using local fallbacks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoredRemittances = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: RemittanceRecord[] = JSON.parse(raw);
        setRemittances(parsed);
      }
    } catch (e) {
      console.error('Error loading remittances from storage', e);
    }
  };

  const saveRemittancesToStorage = (updated: RemittanceRecord[]) => {
    setRemittances(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving remittances', e);
    }
  };

  // Today's Remittances vs All
  const todayRemittances = useMemo(() => {
    return remittances.filter((r) => r.date === selectedDate);
  }, [remittances, selectedDate]);

  // Aggregate Calculations
  const { todayTotal, todayCashTotal, todayBankTotal } = useMemo(() => {
    let tot = 0;
    let cashTot = 0;
    let bankTot = 0;

    for (const r of todayRemittances) {
      tot += Number(r.amount);
      if (r.mode === 'CASH') cashTot += Number(r.amount);
      if (r.mode === 'BANK') bankTot += Number(r.amount);
    }
    return { todayTotal: tot, todayCashTotal: cashTot, todayBankTotal: bankTot };
  }, [todayRemittances]);

  // Notify parent of total cash remitted today for Galla deduction
  useEffect(() => {
    if (onTotalCashRemittedChange) {
      onTotalCashRemittedChange(todayCashTotal);
    }
  }, [todayCashTotal, onTotalCashRemittedChange]);

  // Submit Remittance Entry
  const handleSaveRemittance = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showToast('براہ کرم موصول شدہ رقم درج کریں۔');
      return;
    }

    if (mode === 'BANK' && !selectedBankId) {
      showToast('براہ کرم موصولی کے لیے بینک اکاؤنٹ منتخب کریں۔');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeBank = bankAccounts.find((b) => b.id === selectedBankId);
      const activeCash = cashAccounts.find((c) => c.id === selectedCashId);

      // Attempt to post to backend cash transfer endpoint
      try {
        await accountingService.createTransfer({
          transferDate: new Date(selectedDate).toISOString(),
          fromAccountType: 'CASH',
          fromCashAccountId: cashAccounts[1]?.id || cashAccounts[0]?.id, // Mansehra Counter Till
          toAccountType: mode === 'BANK' ? 'BANK' : 'CASH',
          toBankAccountId: mode === 'BANK' ? selectedBankId : undefined,
          toCashAccountId: mode === 'CASH' ? selectedCashId : undefined,
          amount: numAmount,
          referenceNumber: referenceNumber || (mode === 'CASH' ? 'CASH-REMIT' : 'ONLINE-DEP'),
          notes: `مانسہرہ برانچ سے وصولی - بھیجنے والا/ڈرائیور: ${driverOrSender || 'نقد/آن لائن'} ${notes ? `(${notes})` : ''}`,
        });
      } catch (apiErr) {
        console.warn('Backend transfer failed or offline, recording in client register:', apiErr);
      }

      if (editingRemittanceId) {
        const updated = remittances.map((r) => {
          if (r.id !== editingRemittanceId) return r;
          return {
            ...r,
            mode,
            amount: numAmount,
            bankAccountId: mode === 'BANK' ? selectedBankId : undefined,
            bankName: mode === 'BANK' ? activeBank?.bankName || r.bankName : undefined,
            accountNumber: mode === 'BANK' ? activeBank?.accountNumber || r.accountNumber : undefined,
            cashAccountId: mode === 'CASH' ? selectedCashId : undefined,
            cashAccountName: mode === 'CASH' ? activeCash?.name || r.cashAccountName : undefined,
            referenceNumber: referenceNumber.trim() || r.referenceNumber,
            driverOrSender: driverOrSender.trim() || r.driverOrSender,
            notes: notes.trim(),
          };
        });
        saveRemittancesToStorage(updated);
        handleCancelEdit();
        showToast(`وصولی اینٹری میں ترمیم کامیابی سے محفوظ ہو گئی۔`);
      } else {
        const newRecord: RemittanceRecord = {
          id: 'REM-' + Date.now(),
          date: selectedDate,
          mode,
          amount: numAmount,
          bankAccountId: mode === 'BANK' ? selectedBankId : undefined,
          bankName: mode === 'BANK' ? activeBank?.bankName || 'Meezan Bank' : undefined,
          accountNumber: mode === 'BANK' ? activeBank?.accountNumber || '' : undefined,
          cashAccountId: mode === 'CASH' ? selectedCashId : undefined,
          cashAccountName: mode === 'CASH' ? activeCash?.name || 'اوکاڑہ مین کیش' : undefined,
          referenceNumber: referenceNumber.trim() || (mode === 'CASH' ? 'نقد سلپ' : 'آن لائن ٹرانسفر'),
          driverOrSender: driverOrSender.trim() || 'مانسہرہ برانچ',
          notes: notes.trim(),
          createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };

        const updated = [newRecord, ...remittances];
        saveRemittancesToStorage(updated);

        // Reset form
        setAmount('');
        setReferenceNumber('');
        setDriverOrSender('');
        setNotes('');

        showToast(`مانسہرہ سے PKR ${numAmount.toLocaleString()} کی وصولی کامیابی سے محفوظ ہو گئی۔`);
      }
    } catch (err: any) {
      showToast('رقم محفوظ کرنے میں غلطی ہوئی۔ دوبارہ کوشش کریں۔');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (rem: RemittanceRecord) => {
    setEditingRemittanceId(rem.id);
    setMode(rem.mode);
    setAmount(rem.amount);
    if (rem.mode === 'BANK' && rem.bankAccountId) {
      setSelectedBankId(rem.bankAccountId);
    }
    if (rem.mode === 'CASH' && rem.cashAccountId) {
      setSelectedCashId(rem.cashAccountId);
    }
    setReferenceNumber(rem.referenceNumber);
    setDriverOrSender(rem.driverOrSender);
    setNotes(rem.notes || '');
  };

  const handleCancelEdit = () => {
    setEditingRemittanceId(null);
    setAmount('');
    setReferenceNumber('');
    setDriverOrSender('');
    setNotes('');
  };

  // Add New Bank Account
  const handleAddNewBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim() || !newAccountNumber.trim()) {
      showToast('براہ کرم بینک کا نام اور اکاؤنٹ نمبر درج کریں۔');
      return;
    }

    setIsSavingBank(true);
    try {
      const created = await accountingService.createBankAccount({
        bankName: newBankName.trim(),
        accountNumber: newAccountNumber.trim(),
        branchName: newBranchTitle.trim() || 'Main Branch',
        openingBalance: 0,
      });

      const updatedBanks = [...bankAccounts, created];
      setBankAccounts(updatedBanks);
      setSelectedBankId(created.id);
      setIsAddingBank(false);
      setNewBankName('');
      setNewAccountNumber('');
      setNewBranchTitle('');
      showToast(`نیا بینک (${created.bankName}) کامیابی سے شامل کر دیا گیا۔`);
    } catch (err: any) {
      // Fallback local bank creation
      const localBank: BankAccount = {
        id: 'BANK-LOCAL-' + Date.now(),
        code: 'BANK-' + Date.now().toString().slice(-4),
        bankName: newBankName.trim(),
        accountNumber: newAccountNumber.trim(),
        branchName: newBranchTitle.trim() || 'Main Branch',
        currentBalance: 0,
        isActive: true,
      };
      setBankAccounts((prev) => [...prev, localBank]);
      setSelectedBankId(localBank.id);
      setIsAddingBank(false);
      setNewBankName('');
      setNewAccountNumber('');
      setNewBranchTitle('');
      showToast(`نیا بینک (${localBank.bankName}) لسٹ میں شامل کر دیا گیا۔`);
    } finally {
      setIsSavingBank(false);
    }
  };

  // Delete / Reverse Remittance
  const handleDeleteRemittance = (id: string) => {
    if (window.confirm('کیا آپ واقعی یہ وصولی اینٹری حذف کرنا چاہتے ہیں؟')) {
      const updated = remittances.filter((r) => r.id !== id);
      saveRemittancesToStorage(updated);
      showToast('وصولی اینٹری حذف کر دی گئی۔');
    }
  };

  // WhatsApp Voucher Share
  const handleShareWhatsApp = (rem: RemittanceRecord) => {
    const isBank = rem.mode === 'BANK';
    const text = `*العرب رائس ٹریڈرز (اوکاڑہ ⟷ مانسہرہ)*%0A` +
      `*رسید وصولی رقم (Branch Remittance Voucher)*%0A` +
      `━━━━━━━━━━━━━━━━━━%0A` +
      `📅 *تاریخ:* ${rem.date} (${rem.createdAt})%0A` +
      `💰 *موصولہ رقم:* PKR ${rem.amount.toLocaleString()}%0A` +
      `💳 *وصولی کا ذریعہ:* ${isBank ? `بینک ٹرانسفر (${rem.bankName} - ${rem.accountNumber})` : 'نقد کیش (Cash in Hand)'}%0A` +
      `📝 *رسید / سلپ #:* ${rem.referenceNumber}%0A` +
      `🚚 *بھیجنے والا / ڈرائیور:* ${rem.driverOrSender}%0A` +
      (rem.notes ? `📌 *تفصیل:* ${rem.notes}%0A` : '') +
      `━━━━━━━━━━━━━━━━━━%0A` +
      `✅ *تصدیق:* مانسہرہ برانچ سے یہ رقم اوکاڑہ ہیڈ آفس میں وصول ہو چکی ہے۔%0A` +
      `شکریہ - اجمل فیضان (العرب رائس ٹریڈرز)`;

    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Context */}
      <div className="bg-linear-to-r from-emerald-900 via-slate-900 to-emerald-950 p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
              اوکاڑہ ⟷ مانسہرہ روپیہ وصولی رجسٹر
            </span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Landmark className="w-6 h-6 text-emerald-400" />
            <span>مانسہرہ برانچ سے کیش و بینک وصولی</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            مانسہرہ دکان سے روزانہ کی فروخت سے حاصل ہونے والی رقم (نقد کیش یا بینک کھاتے) یہاں درج کریں۔
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 shrink-0 text-right">
          <span className="block text-[10px] text-emerald-200 font-medium">منتخب تاریخ کا کھاتہ</span>
          <span className="font-mono font-bold text-sm text-white flex items-center gap-1.5 justify-end">
            <Calendar className="w-3.5 h-3.5 text-emerald-300" />
            {selectedDate}
          </span>
        </div>
      </div>

      {/* 2. Quick KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="آج کل موصول رقم"
          value={`PKR ${todayTotal.toLocaleString()}`}
          unit="ٹوٹل"
          icon={<DollarSign className="w-5 h-5" />}
          variant="emerald"
        />
        <MetricCard
          label="نقد کیش وصولی"
          value={`PKR ${todayCashTotal.toLocaleString()}`}
          unit="کیش بذریعہ ڈرائیور"
          icon={<Wallet className="w-5 h-5 text-emerald-700" />}
          variant="default"
        />
        <MetricCard
          label="بینک میں وصولی"
          value={`PKR ${todayBankTotal.toLocaleString()}`}
          unit="آن لائن ٹرانسفرز"
          icon={<Building2 className="w-5 h-5 text-blue-700" />}
          variant="blue"
        />
        <MetricCard
          label="کل وصولیاں (تعداد)"
          value={todayRemittances.length.toString()}
          unit="اینٹریز"
          icon={<Receipt className="w-5 h-5 text-slate-600" />}
          variant="default"
        />
      </div>

      {/* 3. Main Action Grid: Input Form (Left) & Remittance Register (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Card (5 cols on desktop) */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              {editingRemittanceId ? (
                <>
                  <Edit2 className="w-4 h-4 text-blue-700" />
                  <span>وصولی اینٹری میں ترمیم کریں</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>نئی رقم وصولی درج کریں</span>
                </>
              )}
            </h3>
            {editingRemittanceId ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 cursor-pointer"
              >
                منسوخ کریں ✕
              </button>
            ) : (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                سادہ انٹری
              </span>
            )}
          </div>

          <form onSubmit={handleSaveRemittance} className="space-y-4">
            {/* Mode Selector (Cash vs Bank) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 text-right">
                رقم کس صورت میں موصول ہوئی؟ (Payment Mode)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('CASH')}
                  className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    mode === 'CASH'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>💵 نقد کیش (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('BANK')}
                  className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    mode === 'BANK'
                      ? 'bg-blue-700 text-white border-blue-800 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>🏦 بینک ٹرانسفر (Bank)</span>
                </button>
              </div>
            </div>

            {/* If BANK is selected: Multiple Banks Dropdown & Quick Add New Bank Button */}
            {mode === 'BANK' && (
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-blue-950">
                    بینک کھاتہ منتخب کریں (Select Bank)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingBank(!isAddingBank)}
                    className="text-[11px] font-bold text-blue-800 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>نیا بینک شامل کریں</span>
                  </button>
                </div>

                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-600/20 outline-none"
                >
                  {bankAccounts.length === 0 ? (
                    <option value="">کوئی بینک کھاتہ نہیں ملا - نیا شامل کریں</option>
                  ) : (
                    bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} — A/C: {b.accountNumber} {b.branchName ? `(${b.branchName})` : ''}
                      </option>
                    ))
                  )}
                </select>

                {/* Inline Add Bank Form */}
                {isAddingBank && (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-blue-200 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="text-[11px] font-bold text-slate-800">نیا بینک کھاتہ شامل کریں</span>
                      <button
                        type="button"
                        onClick={() => setIsAddingBank(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <input
                          type="text"
                          placeholder="بینک کا نام (مثلاً Habib Bank, Meezan, BOP)"
                          value={newBankName}
                          onChange={(e) => setNewBankName(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="اکاؤنٹ نمبر (مثلاً 0293-10294819)"
                          value={newAccountNumber}
                          onChange={(e) => setNewAccountNumber(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="برانچ / ٹائٹل (اختیاری)"
                          value={newBranchTitle}
                          onChange={(e) => setNewBranchTitle(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={handleAddNewBank}
                        isLoading={isSavingBank}
                        className="w-full text-xs font-bold bg-blue-700 hover:bg-blue-600"
                      >
                        بینک محفوظ کریں (Save Bank)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If CASH is selected: Optional Cash vault destination */}
            {mode === 'CASH' && cashAccounts.length > 0 && (
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <label className="block text-[11px] font-bold text-emerald-950 mb-1 text-right">
                  اوکاڑہ کیش کھاتہ (Received In)
                </label>
                <select
                  value={selectedCashId}
                  onChange={(e) => setSelectedCashId(e.target.value)}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-700/20 outline-none"
                >
                  {cashAccounts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 text-right">
                موصول شدہ رقم (Amount in PKR) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-12 text-base font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  PKR
                </span>
              </div>
              {Number(amount) > 0 && (
                <p className="text-[11px] text-emerald-800 font-bold mt-1 text-right font-mono">
                  PKR {Number(amount).toLocaleString()} روپے
                </p>
              )}
            </div>

            {/* Reference Number / Slip No */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">
                رسید نمبر / ٹرانزیکشن سلپ # (Slip / Ref No)
              </label>
              <input
                type="text"
                placeholder={mode === 'BANK' ? 'مثلاً TRX-98214 یا آن لائن حوالہ' : 'مثلاً ڈرائیور پرچی نمبر / رسید #'}
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
              />
            </div>

            {/* Driver / Sender Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">
                بھیجنے والا / ڈرائیور کا نام (Sent By / Driver)
              </label>
              <input
                type="text"
                placeholder="مثلاً ڈرائیور اکرم، مینیجر مانسہرہ، وغیرہ"
                value={driverOrSender}
                onChange={(e) => setDriverOrSender(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
              />
            </div>

            {/* Extra Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">
                اضافی تفصیل / نوٹس (Optional Notes)
              </label>
              <input
                type="text"
                placeholder="مثلاً شام کی کائنات چاول فروخت کا کیش"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
              />
            </div>

            {/* Submit Button */}
            {editingRemittanceId ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  className="py-3 text-sm font-bold bg-blue-700 hover:bg-blue-600 text-white rounded-xl shadow-xs"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  تبدیلی محفوظ کریں
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelEdit}
                  className="py-3 text-sm font-bold rounded-xl"
                >
                  منسوخ کریں
                </Button>
              </div>
            ) : (
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="w-full py-3.5 text-sm font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl shadow-xs"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                وصولی محفوظ کریں (Save Remittance)
              </Button>
            )}
          </form>
        </div>

        {/* Remittance Log Register (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <span>مانسہرہ وصولی رجسٹر (تاریخ: {selectedDate})</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                آج مانسہرہ شاپ سے موصول ہونے والی رقوم کی مکمل فہرست
              </p>
            </div>

            <span className="text-xs font-bold font-mono px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-full">
              کل وصولی: PKR {todayTotal.toLocaleString()}
            </span>
          </div>

          {/* List or Table */}
          {todayRemittances.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <Landmark className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">آج کی کوئی وصولی درج نہیں</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                بائیں جانب فارم کے ذریعے مانسہرہ برانچ سے آنے والا کیش یا بینک ٹرانسفر درج کریں۔
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayRemittances.map((rem) => {
                const isBank = rem.mode === 'BANK';
                return (
                  <div
                    key={rem.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isBank
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isBank ? <Building2 className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isBank
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {isBank ? '🏦 بینک ٹرانسفر' : '💵 نقد کیش'}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {rem.createdAt}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 mt-1">
                          {isBank ? rem.bankName || 'بینک اکاؤنٹ' : 'نقد کیش ان ہینڈ'}
                        </h4>

                        <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>
                            <strong>بھیجنے والا/ڈرائیور:</strong> {rem.driverOrSender}
                          </span>
                          {rem.referenceNumber && (
                            <span className="text-slate-500 font-mono">
                              (سلپ: {rem.referenceNumber})
                            </span>
                          )}
                          {rem.notes && (
                            <span className="text-slate-500 italic">
                              "{rem.notes}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 gap-2">
                      <span className="font-mono font-black text-base text-emerald-800">
                        PKR {rem.amount.toLocaleString()}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(rem)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="واٹس ایپ رسید شیئر کریں"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                          <span>واٹس ایپ رسید</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(rem)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="اینٹری میں ترمیم کریں"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRemittance(rem.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="اینٹری حذف کریں"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
