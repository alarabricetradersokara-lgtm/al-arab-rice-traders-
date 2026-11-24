import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { purchaseService } from '../../services/purchase.service';
import {
  Purchase,
  Supplier,
  CashAccount,
  BankAccount,
  CreatePurchaseItemInput,
  PaymentType,
} from '../../types/purchase';
import { Warehouse, RiceProduct } from '../../types/inventory';
import {
  Truck,
  Scale,
  Plus,
  Trash2,
  DollarSign,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  UserCheck,
  TrendingUp,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PurchaseEntryScreenProps {
  warehouses: Warehouse[];
  activeWarehouseId: string;
  onSuccess: (purchase: Purchase) => void;
  onCancel: () => void;
  onOpenCreateSupplier: () => void;
  onOpenLedger: (supplierId: string) => void;
  onOpenRateHistory: () => void;
  showToast: (msg: string) => void;
}

interface FormItemRow {
  productId: string;
  bagCount: number;
  looseKg: number;
  bagWeightKg: number;
  grossWeightKg: number;
  bardanaTareKg: number;
  netWeightKg: number;
  rateUnit: 'KG' | 'MAUND';
  rateInput: number;
  unitPricePerKg: number;
  lineTotal: number;
}

export const PurchaseEntryScreen: React.FC<PurchaseEntryScreenProps> = ({
  warehouses,
  activeWarehouseId,
  onSuccess,
  onCancel,
  onOpenCreateSupplier,
  onOpenLedger,
  onOpenRateHistory,
  showToast,
}) => {
  // Master Registries
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<RiceProduct[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(false);

  // Bill Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(activeWarehouseId || '');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [truckNumber, setTruckNumber] = useState('');
  const [biltyNumber, setBiltyNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Items Rows
  const [items, setItems] = useState<FormItemRow[]>([]);

  // Deductions & Landed Cost (Collapsible / Optional)
  const [showDeductions, setShowDeductions] = useState<boolean>(false);
  const [moistureDeductionWeightKg, setMoistureDeductionWeightKg] = useState<number>(0);
  const [moistureDeductionAmount, setMoistureDeductionAmount] = useState<number>(0);
  const [kardaDeductionAmount, setKardaDeductionAmount] = useState<number>(0);
  const [commissionRatePercent, setCommissionRatePercent] = useState<number>(0);
  const [palledariAmount, setPalledariAmount] = useState<number>(0);
  const [freightAmount, setFreightAmount] = useState<number>(0);

  // Financial Terms
  const [paymentType, setPaymentType] = useState<PaymentType>('CREDIT');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [selectedCashAccountId, setSelectedCashAccountId] = useState('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load master data
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setIsLoadingMaster(true);
        const [sups, prods, cash, banks] = await Promise.all([
          purchaseService.getSuppliers(),
          // Product list from inventory endpoint
          fetch('/api/inventory/products', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('al_arab_erp_token')}`,
            },
          })
            .then((res) => res.json())
            .then((json) => json.data || []),
          purchaseService.getCashAccounts(),
          purchaseService.getBankAccounts(),
        ]);

        setSuppliers(sups);
        setProducts(prods);
        setCashAccounts(cash);
        setBankAccounts(banks);

        if (sups.length > 0 && !selectedSupplierId) {
          setSelectedSupplierId(sups[0].id);
        }
        if (warehouses.length > 0 && !selectedWarehouseId) {
          setSelectedWarehouseId(warehouses[0].id);
        }
        if (cash.length > 0) setSelectedCashAccountId(cash[0].id);
        if (banks.length > 0) setSelectedBankAccountId(banks[0].id);

        // Prepopulate with 1 empty item row
        if (prods.length > 0 && items.length === 0) {
          const defaultProd = prods[0];
          const defaultBagWt = Number(defaultProd.defaultBagWeightKg || 50);
          setItems([
            {
              productId: defaultProd.id,
              bagCount: 100,
              looseKg: 0,
              bagWeightKg: defaultBagWt,
              grossWeightKg: 100 * defaultBagWt,
              bardanaTareKg: 100 * 1, // 1 kg jute tare
              netWeightKg: 100 * defaultBagWt - 100,
              rateUnit: 'KG',
              rateInput: Number(defaultProd.costPricePerKg || 120),
              unitPricePerKg: Number(defaultProd.costPricePerKg || 120),
              lineTotal: (100 * defaultBagWt - 100) * Number(defaultProd.costPricePerKg || 120),
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load purchase master registries:', err);
      } finally {
        setIsLoadingMaster(false);
      }
    };
    loadMasterData();
  }, [warehouses]);

  // Active supplier object
  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  // Row update helpers: bi-directional calculation between bags/looseKg and netWeightKg
  const updateRow = (index: number, updates: Partial<FormItemRow>) => {
    setItems((prev) => {
      const next = [...prev];
      const current = { ...next[index], ...updates };

      // Recalculate weights based on product
      if ('productId' in updates) {
        const prod = products.find((p) => p.id === updates.productId);
        if (prod) {
          current.bagWeightKg = Number(prod.defaultBagWeightKg || 50);
          current.rateInput = Number(prod.costPricePerKg || 100);
        }
      }

      // If user directly typed Net Weight (KG)
      if ('netWeightKg' in updates) {
        const net = Math.max(0, Number(updates.netWeightKg) || 0);
        const bagWt = current.bagWeightKg > 0 ? current.bagWeightKg : 50;
        current.bagCount = Math.floor(net / bagWt);
        current.looseKg = Math.round((net % bagWt) * 100) / 100;
        current.grossWeightKg = net;
        current.bardanaTareKg = 0;
        current.netWeightKg = net;
      } else if ('bagCount' in updates || 'looseKg' in updates || 'bagWeightKg' in updates) {
        // User typed bags and/or loose kg
        const bags = current.bagCount || 0;
        const bagWt = current.bagWeightKg > 0 ? current.bagWeightKg : 50;
        const loose = current.looseKg || 0;
        const gross = (bags * bagWt) + loose;
        current.grossWeightKg = gross;
        if (current.bagCount === 0 && !('bardanaTareKg' in updates)) {
          current.bardanaTareKg = 0;
        } else if ('bagCount' in updates && !('bardanaTareKg' in updates)) {
          current.bardanaTareKg = current.bagCount * 1;
        }
        current.netWeightKg = Math.max(0, gross - (current.bardanaTareKg || 0));
      } else if ('grossWeightKg' in updates || 'bardanaTareKg' in updates) {
        current.netWeightKg = Math.max(0, (current.grossWeightKg || 0) - (current.bardanaTareKg || 0));
        const bagWt = current.bagWeightKg > 0 ? current.bagWeightKg : 50;
        current.bagCount = Math.floor(current.netWeightKg / bagWt);
        current.looseKg = Math.round((current.netWeightKg % bagWt) * 100) / 100;
      }

      // Recalculate price and total
      if ('rateInput' in updates || 'rateUnit' in updates || 'productId' in updates || 'netWeightKg' in updates || 'bagCount' in updates || 'looseKg' in updates || 'grossWeightKg' in updates) {
        if (current.rateUnit === 'MAUND') {
          current.unitPricePerKg = current.rateInput / 40;
        } else {
          current.unitPricePerKg = current.rateInput;
        }
        current.lineTotal = current.netWeightKg * current.unitPricePerKg;
      }

      next[index] = current;
      return next;
    });
  };

  const addRow = () => {
    if (products.length === 0) return;
    const defaultProd = products[0];
    const defaultBagWt = Number(defaultProd.defaultBagWeightKg || 50);
    setItems((prev) => [
      ...prev,
      {
        productId: defaultProd.id,
        bagCount: 50,
        looseKg: 0,
        bagWeightKg: defaultBagWt,
        grossWeightKg: 50 * defaultBagWt,
        bardanaTareKg: 50 * 1,
        netWeightKg: 50 * defaultBagWt - 50,
        rateUnit: 'KG',
        rateInput: Number(defaultProd.costPricePerKg || 100),
        unitPricePerKg: Number(defaultProd.costPricePerKg || 100),
        lineTotal: (50 * defaultBagWt - 50) * Number(defaultProd.costPricePerKg || 100),
      },
    ]);
  };

  const removeRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Totals calculations
  const grossSubTotal = items.reduce((acc, it) => acc + (it.lineTotal || 0), 0);
  const totalBags = items.reduce((acc, it) => acc + (it.bagCount || 0), 0);
  const totalLooseKg = items.reduce((acc, it) => acc + (it.looseKg || 0), 0);
  const totalGrossKg = items.reduce((acc, it) => acc + (it.grossWeightKg || 0), 0);
  const totalTareKg = items.reduce((acc, it) => acc + (it.bardanaTareKg || 0), 0);
  const totalNetKg = items.reduce((acc, it) => acc + (it.netWeightKg || 0), 0);
  const totalMaunds = (totalNetKg / 40).toFixed(2);

  // Mandi commission calculation
  const calculatedCommission = (grossSubTotal * (commissionRatePercent || 0)) / 100;

  // Final Net Amount Payable:
  // SubTotal - MoistureCut - KardaCut + Commission + Palledari + Freight
  const netAmountPayable =
    grossSubTotal -
    (moistureDeductionAmount || 0) -
    (kardaDeductionAmount || 0) +
    calculatedCommission +
    (palledariAmount || 0) +
    (freightAmount || 0);

  // Auto-set paid amount when payment type changes
  useEffect(() => {
    if (paymentType === 'CASH' || paymentType === 'BANK') {
      setPaidAmount(netAmountPayable);
    } else if (paymentType === 'CREDIT') {
      setPaidAmount(0);
    }
  }, [paymentType, netAmountPayable]);

  const balanceAmount = Math.max(0, netAmountPayable - (paidAmount || 0));

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || !selectedWarehouseId) {
      setErrorMessage('Please select a supplier and target warehouse.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Please add at least one rice variety item row.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = {
        supplierId: selectedSupplierId,
        warehouseId: selectedWarehouseId,
        purchaseDate: new Date(purchaseDate).toISOString(),
        paymentType,
        truckNumber: truckNumber.trim() || undefined,
        biltyNumber: biltyNumber.trim() || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          bagCount: it.bagCount,
          bagWeightKg: it.bagWeightKg,
          grossWeightKg: it.grossWeightKg,
          bardanaTareKg: it.bardanaTareKg,
          netWeightKg: it.netWeightKg,
          unitPricePerKg: it.unitPricePerKg,
          lineTotal: it.lineTotal,
          rateUnit: it.rateUnit,
        })),
        moistureDeductionWeightKg,
        moistureDeductionAmount,
        kardaDeductionAmount,
        commissionRatePercent,
        palledariAmount,
        freightAmount,
        paidAmount: Number(paidAmount) || 0,
        cashAccountId: paymentType === 'CASH' || paymentType === 'PARTIAL' ? selectedCashAccountId : undefined,
        bankAccountId: paymentType === 'BANK' ? selectedBankAccountId : undefined,
        notes: notes.trim() || undefined,
      };

      const result = await purchaseService.createPurchase(payload);
      showToast(`Purchase bill ${result.purchaseNumber} posted successfully! Stock & ledger updated.`);
      onSuccess(result);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to post purchase bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 border border-[#E4EAE5] rounded-xl hover:bg-[#F5F7F5] text-[#718078] hover:text-[#172B25] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#172B25]">Grain Procurement & Inward Bill</h1>
              <span className="text-xs font-semibold bg-emerald-100 text-[#087A55] px-2.5 py-0.5 rounded-full">
                Mandi Kanda Slip
              </span>
            </div>
            <p className="text-xs text-[#718078] mt-0.5">
              Dual-UOM (Bags, Maunds, KG), landed freight attribution, moisture cuts, and Khatabook postings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={onOpenRateHistory}>
            <TrendingUp className="w-4 h-4 mr-1 text-[#087A55]" /> Rate History
          </Button>
          {selectedSupplier && (
            <Button variant="outline" size="sm" onClick={() => onOpenLedger(selectedSupplier.id)}>
              <BookOpen className="w-4 h-4 mr-1 text-[#087A55]" /> Supplier Khatabook
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onOpenCreateSupplier}>
            <UserCheck className="w-4 h-4 mr-1 text-[#087A55]" /> + Register Supplier
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Logistics & Supplier Info */}
        <Card>
          <div className="p-4 border-b border-[#E4EAE5] bg-[#F5F7F5] flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#172B25] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#087A55]" /> 1. Supplier & Mandi Logistics
            </span>
            {selectedSupplier && (
              <span className="text-xs font-mono font-semibold text-[#087A55] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Current Khatabook Balance: PKR {Number(selectedSupplier.currentBalance).toLocaleString()} (Cr)
              </span>
            )}
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#172B25] mb-1">
                Supplier / Mandi Arthi <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isArthi ? '(Mandi Arthi)' : ''} — {s.businessName || s.city || 'Grain Market'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B25] mb-1">
                منزل / گودام (Shop Location) <span className="text-red-500">*</span>
              </label>
              <div className="w-full px-3 py-2 text-xs border border-emerald-300 bg-emerald-50 rounded-xl font-bold text-[#087A55] flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-4 h-4 text-[#087A55] shrink-0" />
                  <span className="truncate">مرکزی دکان - مانسہرہ (Main Shop - Mansehra)</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md shrink-0 font-medium">واحد مقام</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B25] mb-1">
                Purchase / Arrival Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B25] mb-1">
                Truck / Vehicle No & Bilty No
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="e.g. LES-8492"
                  value={truckNumber}
                  onChange={(e) => setTruckNumber(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none"
                />
                <input
                  type="text"
                  placeholder="Bilty # 4910"
                  value={biltyNumber}
                  onChange={(e) => setBiltyNumber(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Step 2: Multi-Product Rice Weighbridge Table */}
        <Card>
          <div className="p-4 border-b border-[#E4EAE5] bg-[#F5F7F5] flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#172B25] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#087A55]" /> 2. Rice Varieties, Dual-UOM Catch-Weight & Rates
            </span>
            <Button variant="outline" size="sm" type="button" onClick={addRow}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Rice Line
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[#172B25] font-semibold">
                <tr>
                  <th className="py-2.5 px-3 min-w-[200px]">چاول کی ورائٹی (Item)</th>
                  <th className="py-2.5 px-2 w-20 text-right">بوریاں (Bags)</th>
                  <th className="py-2.5 px-2 w-24 text-right text-emerald-800 bg-emerald-50/60 font-bold">کھلے کلو (Loose KG)</th>
                  <th className="py-2.5 px-2 w-20 text-right">وزن/بوری (kg)</th>
                  <th className="py-2.5 px-2 w-24 text-right">کل وزن (Gross)</th>
                  <th className="py-2.5 px-2 w-20 text-right">باردانہ (Tare)</th>
                  <th className="py-2.5 px-2 w-24 text-right font-bold text-[#087A55]">خالص وزن (Net)</th>
                  <th className="py-2.5 px-2 w-20 text-right text-[#064E3B]">من (Maunds)</th>
                  <th className="py-2.5 px-2 w-28 text-right">ریٹ (Rate & Unit)</th>
                  <th className="py-2.5 px-3 w-28 text-right font-bold text-[#172B25]">کل رقم (Line Total)</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EAE5]">
                {items.map((row, index) => {
                  const maunds = (row.netWeightKg / 40).toFixed(2);
                  return (
                    <tr key={index} className="hover:bg-[#F5F7F5]/50">
                      {/* Product Selector */}
                      <td className="py-2 px-3">
                        <select
                          value={row.productId}
                          onChange={(e) => updateRow(index, { productId: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-[#E4EAE5] bg-white rounded-lg focus:border-[#087A55] outline-none font-medium"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.code})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Bags */}
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          value={row.bagCount}
                          onChange={(e) =>
                            updateRow(index, { bagCount: parseInt(e.target.value, 10) || 0 })
                          }
                          className="w-full text-right px-2 py-1.5 text-xs border border-[#E4EAE5] rounded-lg font-mono outline-none"
                        />
                      </td>

                      {/* Loose KG Input */}
                      <td className="py-2 px-2 text-right bg-emerald-50/30">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={row.looseKg === 0 ? '' : row.looseKg}
                          placeholder="0"
                          onChange={(e) =>
                            updateRow(index, { looseKg: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full text-right px-2 py-1.5 text-xs border border-emerald-300 bg-white rounded-lg font-mono font-bold text-emerald-800 outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </td>

                      {/* Bag Weight */}
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          step="0.5"
                          value={row.bagWeightKg}
                          onChange={(e) =>
                            updateRow(index, { bagWeightKg: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full text-right px-2 py-1.5 text-xs border border-[#E4EAE5] rounded-lg font-mono outline-none"
                        />
                      </td>

                      {/* Gross Weight */}
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          step="0.1"
                          value={row.grossWeightKg}
                          onChange={(e) =>
                            updateRow(index, { grossWeightKg: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full text-right px-2 py-1.5 text-xs border border-[#E4EAE5] rounded-lg font-mono outline-none"
                        />
                      </td>

                      {/* Bardana Tare */}
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          step="0.1"
                          value={row.bardanaTareKg}
                          onChange={(e) =>
                            updateRow(index, { bardanaTareKg: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full text-right px-2 py-1.5 text-xs border border-[#E4EAE5] rounded-lg font-mono text-red-600 outline-none"
                        />
                      </td>

                      {/* Net Weight (Direct Entry or Auto-Calculated) */}
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={row.netWeightKg === 0 ? '' : row.netWeightKg}
                          placeholder="0"
                          title="خالص وزن براہ راست درج کریں (یا بوریاں اور کھلا چاول لکھیں)"
                          onChange={(e) =>
                            updateRow(index, { netWeightKg: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full text-right px-2 py-1.5 text-xs border border-emerald-400 bg-emerald-50/30 rounded-lg font-mono font-bold text-[#087A55] outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </td>

                      {/* Maunds */}
                      <td className="py-2 px-2 text-right font-mono text-[#064E3B] bg-emerald-50/50">
                        {maunds} md
                      </td>

                      {/* Rate & Unit */}
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            value={row.rateInput}
                            onChange={(e) =>
                              updateRow(index, { rateInput: parseFloat(e.target.value) || 0 })
                            }
                            className="w-20 text-right px-2 py-1.5 text-xs border border-[#E4EAE5] rounded-lg font-mono outline-none"
                          />
                          <select
                            value={row.rateUnit}
                            onChange={(e) =>
                              updateRow(index, { rateUnit: e.target.value as 'KG' | 'MAUND' })
                            }
                            className="px-1 py-1.5 text-[10px] border border-[#E4EAE5] bg-white rounded-lg outline-none font-bold"
                          >
                            <option value="KG">/ KG</option>
                            <option value="MAUND">/ MD (40kg)</option>
                          </select>
                        </div>
                      </td>

                      {/* Line Total */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-sm text-[#172B25]">
                        PKR {Math.round(row.lineTotal).toLocaleString()}
                      </td>

                      {/* Remove Row */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          disabled={items.length <= 1}
                          className="text-[#718078] hover:text-red-600 disabled:opacity-30 cursor-pointer p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-[#F5F7F5] font-bold text-[#172B25] border-t-2 border-[#E4EAE5]">
                <tr>
                  <td className="py-2.5 px-3">مجموعی کاندہ وزن (Total):</td>
                  <td className="py-2.5 px-2 text-right font-mono text-[#087A55]">{totalBags} بوریاں</td>
                  <td className="py-2.5 px-2 text-right font-mono text-emerald-800 bg-emerald-50/60 font-bold">{totalLooseKg} kg کھلے</td>
                  <td></td>
                  <td className="py-2.5 px-2 text-right font-mono text-[#718078]">{totalGrossKg.toLocaleString()} kg</td>
                  <td className="py-2.5 px-2 text-right font-mono text-red-600">-{totalTareKg.toLocaleString()} kg</td>
                  <td className="py-2.5 px-2 text-right font-mono text-[#087A55]">{totalNetKg.toLocaleString()} kg</td>
                  <td className="py-2.5 px-2 text-right font-mono text-[#064E3B]">{totalMaunds} md</td>
                  <td></td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm text-[#087A55]">
                    PKR {Math.round(grossSubTotal).toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Step 3: Mandi Deductions & Landed Cost Breakdown (Collapsible & Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div
              onClick={() => setShowDeductions(!showDeductions)}
              className="p-4 border-b border-[#E4EAE5] bg-[#F5F7F5] flex justify-between items-center cursor-pointer hover:bg-[#EEF2EF] transition-colors select-none"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[#172B25] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#087A55]" /> 3. منڈی کٹوتی اور کرایہ (Mandi Deductions - اختیاری)
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#087A55] font-semibold">
                <span>{showDeductions ? 'چھپائیں' : 'کھولیں'}</span>
                {showDeductions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {!showDeductions ? (
              <div className="p-4 text-xs text-[#718078] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#172B25]">کوئی کٹوتی لاگو نہیں (ڈیفالٹ: صاف وزن)</p>
                  <p className="text-[11px] text-[#718078] mt-0.5">
                    اگر نمی کاٹ، کردھا، آڑھت کمیشن یا کرایہ شامل کرنا ہو تو یہاں کلک کریں۔
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeductions(true)}
                >
                  کٹوتی کھولیں
                </Button>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#172B25] mb-1">
                      Moisture Cut (Weight in KG)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={moistureDeductionWeightKg}
                      onChange={(e) => setMoistureDeductionWeightKg(parseFloat(e.target.value) || 0)}
                      placeholder="0 kg"
                      className="w-full px-3 py-2 text-xs border border-[#E4EAE5] rounded-xl outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#172B25] mb-1">
                      Moisture Cut Amount (PKR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={moistureDeductionAmount}
                      onChange={(e) => setMoistureDeductionAmount(parseFloat(e.target.value) || 0)}
                      placeholder="PKR 0.00"
                      className="w-full px-3 py-2 text-xs border border-[#E4EAE5] rounded-xl outline-none font-mono text-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#172B25] mb-1">
                      Karda / Broken Grain Deduction (PKR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={kardaDeductionAmount}
                      onChange={(e) => setKardaDeductionAmount(parseFloat(e.target.value) || 0)}
                      placeholder="PKR 0.00"
                      className="w-full px-3 py-2 text-xs border border-[#E4EAE5] rounded-xl outline-none font-mono text-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#172B25] mb-1">
                      Arthi Commission % (e.g. 1.0%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={commissionRatePercent}
                        onChange={(e) => setCommissionRatePercent(parseFloat(e.target.value) || 0)}
                        placeholder="0.0%"
                        className="w-full px-3 py-2 text-xs border border-[#E4EAE5] rounded-xl outline-none font-mono"
                      />
                      <span className="absolute right-3 top-2 text-xs text-[#718078] font-bold">
                        = PKR {Math.round(calculatedCommission).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E4EAE5]">
                  <div>
                    <label className="block text-xs font-semibold text-[#172B25] mb-1">
                      Palledari / Labor Handling (PKR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={palledariAmount}
                      onChange={(e) => setPalledariAmount(parseFloat(e.target.value) || 0)}
                      placeholder="PKR 0.00"
                      className="w-full px-3 py-2 text-xs border border-[#E4EAE5] rounded-xl outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#172B25] mb-1">
                      Freight / Bilty Cartage (PKR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={freightAmount}
                      onChange={(e) => setFreightAmount(parseFloat(e.target.value) || 0)}
                      placeholder="PKR 0.00"
                      className="w-full px-3 py-2 text-xs border border-[#E4EAE5] rounded-xl outline-none font-mono text-[#087A55]"
                    />
                    <span className="text-[10px] text-[#718078] block mt-0.5">
                      *Attributed to landed stock valuation
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Step 4: Settlement Terms & Final Posting */}
          <Card>
            <div className="p-4 border-b border-[#E4EAE5] bg-[#F5F7F5] flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#172B25] flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#087A55]" /> 4. Financial Terms & Payment Settlement
              </span>
              <span className="text-xs font-mono font-bold text-[#087A55]">
                Net Payable: PKR {Math.round(netAmountPayable).toLocaleString()}
              </span>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#172B25] mb-1">
                    Payment Mode Terms
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                    className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl focus:border-[#087A55] outline-none font-semibold"
                  >
                    <option value="CREDIT">Full Credit (Post to Khatabook)</option>
                    <option value="CASH">Full Cash Settlement</option>
                    <option value="PARTIAL">Partial Cash / Partial Credit</option>
                    <option value="BANK">Bank Online Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B25] mb-1">
                    Paid Amount Now (PKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={paymentType === 'CREDIT'}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-[#E4EAE5] rounded-xl font-mono text-emerald-700 outline-none font-bold disabled:bg-gray-100"
                  />
                </div>
              </div>

              {(paymentType === 'CASH' || paymentType === 'PARTIAL') && (
                <div>
                  <label className="block text-xs font-semibold text-[#172B25] mb-1">
                    Select Cash Account / Cash Drawer
                  </label>
                  <select
                    value={selectedCashAccountId}
                    onChange={(e) => setSelectedCashAccountId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl outline-none"
                  >
                    {cashAccounts.map((ca) => (
                      <option key={ca.id} value={ca.id}>
                        {ca.name} ({ca.code}) — Balance: PKR {Number(ca.balance).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {paymentType === 'BANK' && (
                <div>
                  <label className="block text-xs font-semibold text-[#172B25] mb-1">
                    Select Bank Account
                  </label>
                  <select
                    value={selectedBankAccountId}
                    onChange={(e) => setSelectedBankAccountId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl outline-none"
                  >
                    {bankAccounts.map((ba) => (
                      <option key={ba.id} value={ba.id}>
                        {ba.bankName} - {ba.accountTitle} ({ba.accountNumber}) — Bal: PKR {Number(ba.balance).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Settlement Summary Pill */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-[#718078]">
                  <span>Gross Grain Subtotal:</span>
                  <span>PKR {Math.round(grossSubTotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Mandi Deductions (Moisture + Karda):</span>
                  <span>-PKR {Math.round((moistureDeductionAmount || 0) + (kardaDeductionAmount || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#087A55]">
                  <span>Additions (Commission + Palledari + Freight):</span>
                  <span>+PKR {Math.round(calculatedCommission + (palledariAmount || 0) + (freightAmount || 0)).toLocaleString()}</span>
                </div>
                <div className="border-t border-emerald-200 pt-1 flex justify-between font-bold text-sm text-[#087A55]">
                  <span>Net Payable Bill:</span>
                  <span>PKR {Math.round(netAmountPayable).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Balance Added to Supplier Debt:</span>
                  <span>PKR {Math.round(balanceAmount).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B25] mb-1">
                  Internal Inward Notes / Inspection Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Moisture 12.5%, chalky grains 3%, passed weighbridge QC"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E4EAE5] rounded-xl outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4EAE5]">
                <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Posting Inward Bill...' : 'Post & Record Inward Bill (Kanda)'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
};
