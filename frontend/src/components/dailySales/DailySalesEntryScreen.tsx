import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { MetricCard } from '../common/MetricCard';
import type {
  DailySalesSheetResponse,
  DailySalesEntryLine,
  DailySalesCustomerAllocation,
  DailySalesEntry,
  CatalogProductWithStock,
} from '../../types/dailySales';
import type { Warehouse } from '../../types/inventory';
import type { Supplier } from '../../types/party';
import { dailySalesService } from '../../services/dailySales.service';
import { purchaseService } from '../../services/purchase.service';
import { partyService } from '../../services/party.service';
import { BranchRemittanceSection } from './BranchRemittanceSection';
import {
  Calendar,
  Warehouse as WarehouseIcon,
  Save,
  Lock,
  Printer,
  History,
  AlertTriangle,
  Info,
  DollarSign,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Scale,
  Sparkles,
  Truck,
  ShoppingCart,
  Wallet,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Landmark,
} from 'lucide-react';

interface DailySalesEntryScreenProps {
  warehouses: Warehouse[];
  activeWarehouseId: string;
  onOpenReport: (reportId: string) => void;
  onOpenHistory: () => void;
  showToast: (msg: string) => void;
}

interface QuickPurchaseItem {
  id?: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  bagCount: number;
  weightKg: number;
  ratePerKg: number;
  paymentType: 'CASH' | 'CREDIT';
  totalAmount: number;
}

export const DailySalesEntryScreen: React.FC<DailySalesEntryScreenProps> = ({
  warehouses,
  activeWarehouseId,
  onOpenReport,
  onOpenHistory,
  showToast,
}) => {
  // Always lock to the single main shop
  const defaultWhId = activeWarehouseId || warehouses[0]?.id || '';
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(defaultWhId);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Active Tab for Night Entry: Sales vs Purchases vs Remittance vs Galla
  const [activeTab, setActiveTab] = useState<'SALES' | 'PURCHASES' | 'REMITTANCE' | 'GALLA'>('SALES');

  const [sheetData, setSheetData] = useState<DailySalesSheetResponse | null>(null);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [todayPurchases, setTodayPurchases] = useState<QuickPurchaseItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');

  // Form State for Daily Sales (Mal Bika)
  const [linesMap, setLinesMap] = useState<Record<string, { bagCount: number; looseKg: number; weightKg: number; ratePerKg: number; targetTotal?: number }>>({});
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [commissionAmount, setCommissionAmount] = useState<number>(0);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [cashAccountId, setCashAccountId] = useState<string>('');
  const [customerAllocations, setCustomerAllocations] = useState<DailySalesCustomerAllocation[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [remittedCashTotal, setRemittedCashTotal] = useState<number>(0);

  // Quick Parchi Express Entry State (وزن اور کل رقم موڈ)
  const [parchiProductId, setParchiProductId] = useState<string>('');
  const [parchiWeightKg, setParchiWeightKg] = useState<number | ''>('');
  const [parchiTotalPkr, setParchiTotalPkr] = useState<number | ''>('');

  // Quick Purchase Input State (Mal Aya)
  const [purchaseSupplierId, setPurchaseSupplierId] = useState<string>('');
  const [purchaseProductId, setPurchaseProductId] = useState<string>('');
  const [purchaseBags, setPurchaseBags] = useState<number>(50);
  const [purchaseLooseKg, setPurchaseLooseKg] = useState<number>(0);
  const [purchaseWeightKg, setPurchaseWeightKg] = useState<number>(2500);
  const [purchaseRate, setPurchaseRate] = useState<number>(250);
  const [purchasePaymentType, setPurchasePaymentType] = useState<'CASH' | 'CREDIT'>('CREDIT');
  const [isAddingPurchase, setIsAddingPurchase] = useState<boolean>(false);

  // Loaded Entry (if exists)
  const currentEntry = sheetData?.existingEntry;
  const isConfirmed = currentEntry?.status === 'CONFIRMED';
  const isReversed = currentEntry?.status === 'REVERSED';

  // Load Sheet Data and Suppliers
  useEffect(() => {
    if (selectedWarehouseId && selectedDate) {
      loadSheet(selectedDate, selectedWarehouseId);
    }
    loadSuppliersAndPurchases();
  }, [selectedDate, selectedWarehouseId]);

  const loadSuppliersAndPurchases = async () => {
    try {
      const sups = await partyService.getSuppliers();
      setSuppliersList(sups);
      if (sups.length > 0 && !purchaseSupplierId) {
        setPurchaseSupplierId(sups[0].id);
      }

      // Load existing purchases recorded today
      const purData = await purchaseService.getPurchases({
        startDate: selectedDate,
        endDate: selectedDate,
      });

      const mapped: QuickPurchaseItem[] = [];
      for (const p of purData) {
        for (const it of p.items) {
          mapped.push({
            id: p.id,
            supplierId: p.supplierId,
            supplierName: p.supplier?.name || 'Mandi Arthi',
            productId: it.productId,
            productName: it.product?.name || 'Rice Product',
            bagCount: it.bagCount,
            weightKg: Number(it.netWeightKg),
            ratePerKg: Number(it.unitPricePerKg),
            paymentType: p.paymentType as any,
            totalAmount: Number(it.lineTotal),
          });
        }
      }
      setTodayPurchases(mapped);
    } catch (e) {
      console.warn('Failed to load suppliers/purchases:', e);
    }
  };

  const loadSheet = async (date: string, whId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dailySalesService.getDailySalesSheet(date, whId);
      setSheetData(data);

      if (data.productsCatalog.length > 0 && !purchaseProductId) {
        setPurchaseProductId(data.productsCatalog[0].id);
        setPurchaseRate(data.productsCatalog[0].costPricePerKg || 250);
      }

      // Populate form from existing entry or initialize blank
      if (data.existingEntry) {
        const ent = data.existingEntry;
        const newMap: Record<string, { bagCount: number; looseKg: number; weightKg: number; ratePerKg: number }> = {};
        for (const l of ent.lines) {
          const product = data.productsCatalog.find((p) => p.id === l.productId);
          const bagWt = Number(product?.defaultBagWeightKg || 50);
          const bags = l.bagCount || 0;
          const totalWt = Number(l.weightKg);
          const bagsWeight = bags * bagWt;
          const loose = Math.max(0, totalWt - bagsWeight);
          newMap[l.productId] = {
            bagCount: bags,
            looseKg: loose,
            weightKg: totalWt,
            ratePerKg: Number(l.ratePerKg),
          };
        }
        setLinesMap(newMap);
        setDiscountAmount(Number(ent.discountAmount));
        setCommissionAmount(Number(ent.commissionAmount));
        setCashAmount(Number(ent.cashAmount));
        setCreditAmount(Number(ent.creditAmount));
        setCashAccountId(ent.cashAccountId || (data.cashAccounts[0]?.id ?? ''));
        setCustomerAllocations(
          ent.customerAllocations.map((a) => ({
            customerId: a.customerId,
            customerName: a.customerName,
            amount: Number(a.amount),
            notes: a.notes,
          }))
        );
        setNotes(ent.notes || '');
      } else {
        const newMap: Record<string, { bagCount: number; looseKg: number; weightKg: number; ratePerKg: number }> = {};
        for (const p of data.productsCatalog) {
          newMap[p.id] = {
            bagCount: 0,
            looseKg: 0,
            weightKg: 0,
            ratePerKg: p.salePricePerKg || 0,
          };
        }
        setLinesMap(newMap);
        setDiscountAmount(0);
        setCommissionAmount(0);
        setCashAmount(0);
        setCreditAmount(0);
        setCashAccountId(data.cashAccounts[0]?.id ?? '');
        setCustomerAllocations([]);
        setNotes('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load daily sales sheet');
    } finally {
      setIsLoading(false);
    }
  };

  // Line Change Handlers for Sales - Smart Bi-directional Auto Calculation
  const handleWeightChange = (productId: string, weight: number, defaultBagWeight: number = 50) => {
    if (isConfirmed) return;
    const safeWeight = Math.max(0, weight);
    const bagWt = defaultBagWeight > 0 ? defaultBagWeight : 50;
    // Auto deduct bags and loose kg from total weight
    const autoBags = Math.floor(safeWeight / bagWt);
    const autoLoose = Math.round((safeWeight % bagWt) * 10) / 10;

    setLinesMap((prev) => {
      const cur = prev[productId] || { bagCount: 0, looseKg: 0, weightKg: 0, ratePerKg: 0 };
      // If line total was already entered and weight > 0, auto-recalculate rate per kg
      let newRate = cur.ratePerKg;
      if (cur.targetTotal && cur.targetTotal > 0 && safeWeight > 0) {
        newRate = Math.round((cur.targetTotal / safeWeight) * 100) / 100;
      }
      return {
        ...prev,
        [productId]: {
          ...cur,
          bagCount: autoBags,
          looseKg: autoLoose,
          weightKg: safeWeight,
          ratePerKg: newRate,
        },
      };
    });
  };

  const handleLineTotalChange = (productId: string, lineTotal: number) => {
    if (isConfirmed) return;
    const safeTotal = Math.max(0, lineTotal);
    setLinesMap((prev) => {
      const cur = prev[productId] || { bagCount: 0, looseKg: 0, weightKg: 0, ratePerKg: 0 };
      let newRate = cur.ratePerKg;
      if (cur.weightKg > 0 && safeTotal > 0) {
        // Auto compute rate per kg = total PKR / total weight KG
        newRate = Math.round((safeTotal / cur.weightKg) * 100) / 100;
      }
      return {
        ...prev,
        [productId]: {
          ...cur,
          ratePerKg: newRate,
          targetTotal: safeTotal,
        },
      };
    });
  };

  const handleBagCountChange = (productId: string, bags: number, defaultBagWeight: number = 50) => {
    if (isConfirmed) return;
    const safeBags = Math.max(0, bags);
    const bagWt = defaultBagWeight > 0 ? defaultBagWeight : 50;

    setLinesMap((prev) => {
      const cur = prev[productId] || { bagCount: 0, looseKg: 0, weightKg: 0, ratePerKg: 0 };
      const newWeight = (safeBags * bagWt) + (cur.looseKg || 0);
      let newRate = cur.ratePerKg;
      if (cur.targetTotal && cur.targetTotal > 0 && newWeight > 0) {
        newRate = Math.round((cur.targetTotal / newWeight) * 100) / 100;
      }
      return {
        ...prev,
        [productId]: {
          ...cur,
          bagCount: safeBags,
          weightKg: newWeight,
          ratePerKg: newRate,
        },
      };
    });
  };

  const handleLooseKgChange = (productId: string, loose: number, defaultBagWeight: number = 50) => {
    if (isConfirmed) return;
    const safeLoose = Math.max(0, loose);
    const bagWt = defaultBagWeight > 0 ? defaultBagWeight : 50;

    setLinesMap((prev) => {
      const cur = prev[productId] || { bagCount: 0, looseKg: 0, weightKg: 0, ratePerKg: 0 };
      const newWeight = ((cur.bagCount || 0) * bagWt) + safeLoose;
      let newRate = cur.ratePerKg;
      if (cur.targetTotal && cur.targetTotal > 0 && newWeight > 0) {
        newRate = Math.round((cur.targetTotal / newWeight) * 100) / 100;
      }
      return {
        ...prev,
        [productId]: {
          ...cur,
          looseKg: safeLoose,
          weightKg: newWeight,
          ratePerKg: newRate,
        },
      };
    });
  };

  const handleRateChange = (productId: string, rate: number) => {
    if (isConfirmed) return;
    const safeRate = Math.max(0, rate);
    setLinesMap((prev) => {
      const cur = prev[productId] || { bagCount: 0, looseKg: 0, weightKg: 0, ratePerKg: 0 };
      return {
        ...prev,
        [productId]: {
          ...cur,
          ratePerKg: safeRate,
          targetTotal: cur.weightKg * safeRate,
        },
      };
    });
  };

  // Express Parchi Entry Applier
  const handleApplyParchiEntry = () => {
    if (!parchiProductId || !parchiWeightKg || !parchiTotalPkr) return;
    const product = sheetData?.productsCatalog.find((p) => p.id === parchiProductId);
    const bagWt = product?.defaultBagWeightKg || 50;
    const weight = Number(parchiWeightKg);
    const totalPkr = Number(parchiTotalPkr);
    const autoBags = Math.floor(weight / bagWt);
    const autoLoose = Math.round((weight % bagWt) * 10) / 10;
    const autoRate = Math.round((totalPkr / weight) * 100) / 100;

    setLinesMap((prev) => ({
      ...prev,
      [parchiProductId]: {
        bagCount: autoBags,
        looseKg: autoLoose,
        weightKg: weight,
        ratePerKg: autoRate,
        targetTotal: totalPkr,
      },
    }));

    showToast(`پرچی لاگ: ${product?.name} کے لیے ${autoBags} بوریاں (${autoLoose} kg) @ PKR ${autoRate}/kg سیٹ ہو گئے۔`);
    setParchiProductId('');
    setParchiWeightKg('');
    setParchiTotalPkr('');
  };

  // Calculated Aggregate Totals for Sales
  const { totalBagsSold, totalWeightSoldKg, totalGrossSales, totalCogs, grossProfit, grossMarginPct, activeLines } = useMemo(() => {
    let bags = 0;
    let weight = 0;
    let gross = 0;
    let cogs = 0;
    const linesList: DailySalesEntryLine[] = [];

    if (sheetData) {
      for (const p of sheetData.productsCatalog) {
        const line = linesMap[p.id];
        if (line && (line.bagCount > 0 || line.weightKg > 0)) {
          const lineTotal = line.weightKg * line.ratePerKg;
          const lineCogs = line.weightKg * p.costPricePerKg;
          const profit = lineTotal - lineCogs;

          bags += line.bagCount;
          weight += line.weightKg;
          gross += lineTotal;
          cogs += lineCogs;

          linesList.push({
            productId: p.id,
            product: p as any,
            bagCount: line.bagCount,
            weightKg: line.weightKg,
            ratePerKg: line.ratePerKg,
            lineTotal,
            unitCostPerKg: p.costPricePerKg,
            cogsAmount: lineCogs,
            grossProfit: profit,
          });
        }
      }
    }

    const netRev = Math.max(0, gross - discountAmount - commissionAmount);
    const profit = netRev - cogs;
    const margin = netRev > 0 ? ((profit / netRev) * 100).toFixed(2) : '0.00';

    return {
      totalBagsSold: bags,
      totalWeightSoldKg: weight,
      totalGrossSales: gross,
      totalCogs: cogs,
      grossProfit: profit,
      grossMarginPct: margin,
      activeLines: linesList,
    };
  }, [sheetData, linesMap, discountAmount, commissionAmount]);

  const netSalesRevenue = Math.max(0, totalGrossSales - discountAmount - commissionAmount);

  // Customer Credit Allocations Calculation
  const totalAllocatedCredit = useMemo(() => {
    return customerAllocations.reduce((acc, a) => acc + (Number(a.amount) || 0), 0);
  }, [customerAllocations]);

  const unallocatedCredit = Math.max(0, creditAmount - totalAllocatedCredit);

  // Auto-sync cash when total changes
  const handleAutoFillCash = () => {
    if (isConfirmed) return;
    setCashAmount(netSalesRevenue);
    setCreditAmount(0);
  };

  // Add Customer Credit Row
  const handleAddCustomerAllocation = () => {
    if (isConfirmed) return;
    setCustomerAllocations((prev) => [
      ...prev,
      {
        customerId: sheetData?.customers[0]?.id || null,
        customerName: sheetData?.customers[0]?.name || 'Counter Customer',
        amount: unallocatedCredit > 0 ? unallocatedCredit : 0,
        notes: '',
      },
    ]);
  };

  const handleRemoveCustomerAllocation = (index: number) => {
    if (isConfirmed) return;
    setCustomerAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  // Pre-flight Stock Availability Check
  const hasInsufficientStock = useMemo(() => {
    if (!sheetData) return false;
    for (const p of sheetData.productsCatalog) {
      const line = linesMap[p.id];
      if (line && (line.weightKg > p.availableWeightKg || line.bagCount > p.availableBags)) {
        return true;
      }
    }
    return false;
  }, [sheetData, linesMap]);

  // Handle Quick Add Inward Purchase (Mal Aya)
  const handleAddQuickPurchase = async () => {
    if (!purchaseSupplierId || !purchaseProductId || (purchaseBags <= 0 && purchaseLooseKg <= 0) || purchaseWeightKg <= 0 || purchaseRate <= 0) {
      setError('براہ کرم سپلائر، چاول کی ورائٹی، بوریاں یا کھلے کلو، وزن اور ریٹ درست درج کریں۔');
      return;
    }

    try {
      setIsAddingPurchase(true);
      setError(null);

      const targetSupplier = suppliersList.find((s) => s.id === purchaseSupplierId);
      const targetProduct = sheetData?.productsCatalog.find((p) => p.id === purchaseProductId);

      const totalAmt = purchaseWeightKg * purchaseRate;

      // Create purchase in backend
      await purchaseService.createPurchase({
        supplierId: purchaseSupplierId,
        warehouseId: selectedWarehouseId,
        purchaseDate: selectedDate,
        paymentType: purchasePaymentType,
        items: [
          {
            productId: purchaseProductId,
            bagCount: purchaseBags,
            bagWeightKg: purchaseBags > 0 ? (purchaseWeightKg - purchaseLooseKg) / purchaseBags : 50,
            grossWeightKg: purchaseWeightKg,
            bardanaTareKg: purchaseBags > 0 ? purchaseBags * 1 : 0,
            netWeightKg: purchaseWeightKg,
            unitPricePerKg: purchaseRate,
            lineTotal: totalAmt,
          },
        ],
        paidAmount: purchasePaymentType === 'CASH' ? totalAmt : 0,
        notes: `رات کی انٹری (Night Entry): ${purchaseBags} بوریاں ${purchaseLooseKg > 0 ? `+ ${purchaseLooseKg} kg کھلے ` : ''}[${targetProduct?.name}]`,
      });

      showToast(`آج کا مال درج کر لیا گیا [${purchaseBags} بوریاں ${purchaseLooseKg > 0 ? `+ ${purchaseLooseKg} kg کھلے ` : ''}- ${targetProduct?.name}]`);

      // Add to local state & reload sheet to refresh stock availability
      setTodayPurchases((prev) => [
        {
          supplierId: purchaseSupplierId,
          supplierName: targetSupplier?.name || 'Mandi Arthi',
          productId: purchaseProductId,
          productName: targetProduct?.name || 'Rice Product',
          bagCount: purchaseBags,
          weightKg: purchaseWeightKg,
          ratePerKg: purchaseRate,
          paymentType: purchasePaymentType,
          totalAmount: totalAmt,
        },
        ...prev,
      ]);

      // Reset form
      setPurchaseBags(50);
      setPurchaseLooseKg(0);
      setPurchaseWeightKg(2500);

      // Reload sheet so new stock appears in sales tab
      loadSheet(selectedDate, selectedWarehouseId);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'خریداریاں محفوظ کرنے میں خرابی ہوئی');
    } finally {
      setIsAddingPurchase(false);
    }
  };

  // Calculate Totals for Today's Inward Purchases
  const todayPurchasesTotal = useMemo(() => {
    let bags = 0;
    let weight = 0;
    let amount = 0;
    let cashPaid = 0;
    for (const p of todayPurchases) {
      bags += p.bagCount;
      weight += p.weightKg;
      amount += p.totalAmount;
      if (p.paymentType === 'CASH') cashPaid += p.totalAmount;
    }
    return { bags, weight, amount, cashPaid };
  }, [todayPurchases]);

  // Save Draft (Sales)
  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const payload = {
        entryId: currentEntry?.id,
        salesDate: selectedDate,
        warehouseId: selectedWarehouseId,
        lines: activeLines,
        discountAmount,
        commissionAmount,
        cashAmount,
        creditAmount,
        unallocatedCredit,
        cashAccountId,
        customerAllocations,
        notes,
      };

      const saved = await dailySalesService.saveDailySalesDraft(payload);
      showToast(`روزانہ سیلز مسودہ محفوظ کر لیا گیا [${saved.entryNumber}]`);
      loadSheet(selectedDate, selectedWarehouseId);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'مسودہ محفوظ کرنے میں ناکامی');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Closing (Sales & Day freeze)
  const handleConfirmClosing = async () => {
    if (hasInsufficientStock) {
      setError('کلوزنگ ممکن نہیں: کسی ایک یا زائد مصنوعات کی مقدار دکان میں موجود سٹاک سے زیادہ ہے۔');
      return;
    }
    if (activeLines.length === 0) {
      setError('کلوزنگ کے لیے کم از کم ایک چاول کی فروخت درج ہونا لازمی ہے۔');
      return;
    }

    try {
      setIsConfirming(true);
      setError(null);

      if (!currentEntry?.id) {
        const payload = {
          salesDate: selectedDate,
          warehouseId: selectedWarehouseId,
          lines: activeLines,
          discountAmount,
          commissionAmount,
          cashAmount,
          creditAmount,
          unallocatedCredit,
          cashAccountId,
          customerAllocations,
          notes,
        };
        const draft = await dailySalesService.saveDailySalesDraft(payload);
        const confirmed = await dailySalesService.confirmDailySales(draft.id);
        showToast(`آج کا کھاتہ و سٹاک مکمل کلوز کر دیا گیا [${confirmed.entryNumber}]`);
        loadSheet(selectedDate, selectedWarehouseId);
      } else {
        const confirmed = await dailySalesService.confirmDailySales(currentEntry.id);
        showToast(`آج کا کھاتہ و سٹاک مکمل کلوز کر دیا گیا [${confirmed.entryNumber}]`);
        loadSheet(selectedDate, selectedWarehouseId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'کلوزنگ کی تصدیق ناکام ہو گئی');
    } finally {
      setIsConfirming(false);
    }
  };

  const filteredCatalog = (sheetData?.productsCatalog || []).filter((p) => {
    const term = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Control Bar with Single Shop Indicator */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>روزانہ خریدو فروخت کا اندراج</span>
              <span className="text-xs font-normal text-slate-500 hidden sm:inline">(Daily Register & Closing)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              آج کا مال آیا، مال بکا اور دن کے اختتام پر گلے کی کلوزنگ
            </p>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          {/* Business Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-semibold text-slate-600">تاریخ:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-700/20 cursor-pointer outline-none"
            />
          </div>

          {/* Single Shop Location Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 shadow-2xs">
            <WarehouseIcon className="w-4 h-4 text-emerald-600" />
            <span>مرکزی دکان - مانسہرہ (Main Shop - Mansehra)</span>
          </div>
        </div>

        {/* Voucher Status & Quick Actions */}
        <div className="flex items-center gap-2.5">
          {currentEntry && (
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <span>واؤچر: {currentEntry.entryNumber}</span>
              <Badge
                variant={isConfirmed ? 'emerald' : isReversed ? 'danger' : 'warning'}
                size="sm"
              >
                {isConfirmed ? 'کلوز شدہ' : 'مسودہ'}
              </Badge>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            leftIcon={<History className="w-4 h-4 text-slate-600" />}
            onClick={onOpenHistory}
          >
            پچھلی کلوزنگز
          </Button>

          {currentEntry && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Printer className="w-4 h-4 text-slate-600" />}
              onClick={() => onOpenReport(currentEntry.id)}
            >
              پرنٹ واؤچر
            </Button>
          )}
        </div>
      </div>

      {/* Error Callout */}
      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="cursor-pointer text-sm">✕</button>
        </div>
      )}

      {/* Modern Segmented Navigation Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 gap-1.5 sm:gap-2">
        <button
          onClick={() => setActiveTab('SALES')}
          className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'SALES'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/60 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <ShoppingCart className="w-4 h-4 shrink-0 text-emerald-700" />
          <span className="truncate">1. مال بکا (فروخت)</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] shrink-0 ${
              activeTab === 'SALES' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-200/70 text-slate-600'
            }`}
          >
            {activeLines.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PURCHASES')}
          className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'PURCHASES'
              ? 'bg-white text-blue-800 shadow-xs border border-slate-200/60 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Truck className="w-4 h-4 shrink-0 text-blue-700" />
          <span className="truncate">2. مال آیا (خریداری)</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] shrink-0 ${
              activeTab === 'PURCHASES' ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-slate-200/70 text-slate-600'
            }`}
          >
            {todayPurchases.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('REMITTANCE')}
          className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'REMITTANCE'
              ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/60 font-bold ring-2 ring-emerald-600/20'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Landmark className="w-4 h-4 shrink-0 text-emerald-700" />
          <span className="truncate">3. مانسہرہ وصولی (کیش/بینک)</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] shrink-0 font-bold ${
              activeTab === 'REMITTANCE' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            اوکاڑہ
          </span>
        </button>

        <button
          onClick={() => setActiveTab('GALLA')}
          className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'GALLA'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Wallet className="w-4 h-4 shrink-0 text-slate-700" />
          <span className="truncate">4. گلہ و کلوزنگ</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] shrink-0 font-mono ${
              activeTab === 'GALLA' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-200/80 text-slate-700'
            }`}
          >
            کلوزنگ
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TODAY'S SALES / MAL BIKA */}
      {/* ========================================================================= */}
      {activeTab === 'SALES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Products Quantity Sold Table (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Quick Parchi Express Entry Bar */}
            <div className="bg-linear-to-r from-emerald-50 via-teal-50/40 to-white p-4 rounded-2xl border border-emerald-200/90 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">
                      فوری پرچی سیلز انٹری (Quick Parchi: صرف وزن اور کل رقم لکھیں)
                    </h4>
                    <p className="text-[10px] text-emerald-700">
                      آپ صرف کل کلو اور کل رقم لکھیں، سسٹم بوریاں اور فی کلو ریٹ خود نکال لے گا۔
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto shadow-2xs">
                  ⚡ آٹو بوری و ریٹ ڈیٹیکشن
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                {/* Product Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    چاول ورائٹی منتخب کریں
                  </label>
                  <select
                    value={parchiProductId}
                    onChange={(e) => setParchiProductId(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                  >
                    <option value="">چاول منتخب کریں...</option>
                    {sheetData?.productsCatalog.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (سٹاک: {p.availableBags} بوری)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weight Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    کل وزن بیچا (Total KG) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="مثلاً 2500 کلو"
                    value={parchiWeightKg}
                    onChange={(e) => setParchiWeightKg(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                  />
                </div>

                {/* Total Sale PKR Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    کل فروخت رقم (Total PKR) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="مثلاً 650000 روپے"
                    value={parchiTotalPkr}
                    onChange={(e) => setParchiTotalPkr(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                  />
                </div>

                {/* Action Button */}
                <div className="flex flex-col justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleApplyParchiEntry}
                    disabled={!parchiProductId || !parchiWeightKg || !parchiTotalPkr}
                    className="w-full py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl shadow-xs"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    لسٹ میں سیٹ کریں (Apply)
                  </Button>
                </div>
              </div>

              {/* Live calculation preview indicator */}
              {Number(parchiWeightKg) > 0 && Number(parchiTotalPkr) > 0 && (
                <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2 text-emerald-950 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>
                      <strong>آٹو حساب:</strong>{' '}
                      {Math.floor(Number(parchiWeightKg) / 50)} بوریاں{' '}
                      {Number(parchiWeightKg) % 50 > 0 ? `اور ${Number(parchiWeightKg) % 50} کلو کھلا` : ''}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-emerald-800">
                    ریٹ فی کلو:{' '}
                    PKR {(Number(parchiTotalPkr) / Number(parchiWeightKg)).toFixed(2)} / KG
                  </div>
                </div>
              )}
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="چاول کی ورائٹی تلاش کریں..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
              <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                💡 وزن اور رقم لکھنے سے ریٹ اور بوری خود بن جائے گی
              </div>
            </div>

            {/* Products Matrix Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">چاول کی ورائٹی (Variety)</th>
                      <th className="py-3 px-3 text-right">دکان میں سٹاک</th>
                      <th className="py-3 px-3 text-right">بیچی گئی بوریاں</th>
                      <th className="py-3 px-3 text-right text-emerald-800 bg-emerald-50/60 font-bold">کھلے کلو (Loose KG)</th>
                      <th className="py-3 px-3 text-right bg-emerald-50/40 text-emerald-950 font-bold">کل وزن (Kg) *</th>
                      <th className="py-3 px-3 text-right">ریٹ (PKR/Kg)</th>
                      <th className="py-3 px-3 text-right bg-emerald-100/60 font-bold text-emerald-950">کل رقم (PKR Total) *</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[#718078]">
                          چاول کا کیٹلاگ لوڈ ہو رہا ہے...
                        </td>
                      </tr>
                    ) : filteredCatalog.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[#718078]">
                          کوئی چاول نہیں ملا۔
                        </td>
                      </tr>
                    ) : (
                      filteredCatalog.map((p) => {
                        const line = linesMap[p.id] || { bagCount: 0, looseKg: 0, weightKg: 0, ratePerKg: p.salePricePerKg || 0 };
                        const isExceeded = line.weightKg > p.availableWeightKg || line.bagCount > p.availableBags;
                        const lineTotal = line.weightKg * line.ratePerKg;

                        return (
                          <tr
                            key={p.id}
                            className={`transition-colors ${
                              isExceeded
                                ? 'bg-red-50/60'
                                : line.bagCount > 0 || line.looseKg > 0 || line.weightKg > 0
                                ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                                : 'hover:bg-[#F5F7F5]/50'
                            }`}
                          >
                            <td className="py-3 px-3">
                              <span className="font-bold text-[#172B25] block">{p.name}</span>
                              <span className="text-[10px] text-[#718078]">
                                {p.variety} • معیاری بوری: {p.defaultBagWeightKg} Kg
                              </span>
                              {line.weightKg > 0 && line.ratePerKg > 0 && (
                                <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
                                  ⚡ {line.bagCount} بوری {line.looseKg > 0 ? `+ ${line.looseKg} kg` : ''} @ PKR {line.ratePerKg}/kg
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right font-mono">
                              <span className="font-bold text-[#172B25] block">{p.availableBags} بوری</span>
                              <span className="text-[10px] text-[#718078]">{p.availableWeightKg.toLocaleString()} Kg</span>
                            </td>

                            {/* Bags Input */}
                            <td className="py-3 px-3 text-right">
                              <input
                                type="number"
                                min={0}
                                disabled={isConfirmed}
                                value={line.bagCount === 0 ? '' : line.bagCount}
                                placeholder="0"
                                onChange={(e) =>
                                  handleBagCountChange(p.id, parseInt(e.target.value || '0', 10), p.defaultBagWeightKg)
                                }
                                className="w-16 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl px-2 py-1.5 text-right font-bold text-xs focus:ring-2 focus:ring-[#087A55]/30 outline-none"
                              />
                            </td>

                            {/* Loose KG Input */}
                            <td className="py-3 px-3 text-right bg-emerald-50/20">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                disabled={isConfirmed}
                                value={line.looseKg === 0 ? '' : line.looseKg}
                                placeholder="0"
                                onChange={(e) =>
                                  handleLooseKgChange(p.id, parseFloat(e.target.value || '0'), p.defaultBagWeightKg)
                                }
                                className="w-20 bg-white border border-emerald-300 rounded-xl px-2 py-1.5 text-right font-bold text-xs focus:ring-2 focus:ring-[#087A55]/30 outline-none text-emerald-800"
                              />
                            </td>

                            {/* Weight Kg Input - Auto deduces Bags and Loose KG */}
                            <td className="py-3 px-3 text-right bg-emerald-50/30">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                disabled={isConfirmed}
                                value={line.weightKg === 0 ? '' : line.weightKg}
                                placeholder="0"
                                onChange={(e) => handleWeightChange(p.id, parseFloat(e.target.value || '0'), p.defaultBagWeightKg)}
                                className="w-24 bg-white border border-emerald-300 rounded-xl px-2 py-1.5 text-right font-bold font-mono text-xs text-emerald-950 focus:ring-2 focus:ring-[#087A55]/30 outline-none"
                              />
                            </td>

                            {/* Rate Input */}
                            <td className="py-3 px-3 text-right">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                disabled={isConfirmed}
                                value={line.ratePerKg === 0 ? '' : line.ratePerKg}
                                placeholder="0"
                                onChange={(e) => handleRateChange(p.id, parseFloat(e.target.value || '0'))}
                                className="w-20 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl px-2 py-1.5 text-right font-bold font-mono text-xs focus:ring-2 focus:ring-[#087A55]/30 outline-none text-[#087A55]"
                              />
                            </td>

                            {/* Line Total PKR - Editable to auto calculate rate */}
                            <td className="py-3 px-3 text-right bg-emerald-100/40">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                disabled={isConfirmed}
                                value={line.weightKg > 0 && line.ratePerKg > 0 ? Math.round(line.weightKg * line.ratePerKg) : (line.targetTotal || '')}
                                placeholder="0"
                                onChange={(e) => handleLineTotalChange(p.id, parseFloat(e.target.value || '0'))}
                                className="w-28 bg-white border border-emerald-400 rounded-xl px-2.5 py-1.5 text-right font-mono font-bold text-xs text-emerald-950 focus:ring-2 focus:ring-emerald-700/30 outline-none shadow-2xs"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT: Settlement & Customer Allocations (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E4EAE5] shadow-xs space-y-4">
              <h3 className="font-black text-sm text-[#172B25] flex items-center justify-between border-b border-[#E4EAE5] pb-2">
                <span>فروخت کی وصولی و ادھار (Sales Breakdown)</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-[#087A55] font-bold rounded-full">
                  آج کی سیلز
                </span>
              </h3>

              {/* Total Summary */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex justify-between text-xs text-[#064E3B]">
                  <span>کل بوریاں فروخت:</span>
                  <span className="font-bold">{totalBagsSold} بوریاں</span>
                </div>
                <div className="flex justify-between text-xs text-[#064E3B]">
                  <span>کل وزن فروخت:</span>
                  <span className="font-bold">{totalWeightSoldKg.toLocaleString()} Kg</span>
                </div>
                <div className="flex justify-between text-sm font-black text-[#087A55] pt-1 border-t border-emerald-200">
                  <span>کل فروخت رقم:</span>
                  <span>PKR {netSalesRevenue.toLocaleString()}</span>
                </div>
              </div>

              {/* Cash vs Credit Inputs */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                    <span>نقد وصولی (گلہ کیش):</span>
                    <button
                      type="button"
                      disabled={isConfirmed}
                      onClick={handleAutoFillCash}
                      className="text-[10px] text-emerald-700 hover:underline cursor-pointer font-bold"
                    >
                      سب نقد ہے (All Cash)
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    disabled={isConfirmed}
                    value={cashAmount === 0 ? '' : cashAmount}
                    placeholder="0"
                    onChange={(e) => setCashAmount(parseFloat(e.target.value || '0'))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    ادھار فروخت (گاہکوں کے کھاتے):
                  </label>
                  <input
                    type="number"
                    min={0}
                    disabled={isConfirmed}
                    value={creditAmount === 0 ? '' : creditAmount}
                    placeholder="0"
                    onChange={(e) => setCreditAmount(parseFloat(e.target.value || '0'))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-amber-700 outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Customer Allocation Box */}
                {creditAmount > 0 && (
                  <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-amber-800">
                      <span>ادھار گاہک کا انتخاب:</span>
                      <button
                        type="button"
                        onClick={handleAddCustomerAllocation}
                        className="text-[10px] px-2 py-0.5 bg-amber-600 text-white rounded font-bold cursor-pointer"
                      >
                        + گاہک شامل کریں
                      </button>
                    </div>

                    {customerAllocations.map((alloc, idx) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <select
                          value={alloc.customerId || ''}
                          onChange={(e) => {
                            const cid = e.target.value;
                            const cname = sheetData?.customers.find((c) => c.id === cid)?.name || '';
                            setCustomerAllocations((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, customerId: cid, customerName: cname } : item))
                            );
                          }}
                          className="flex-1 bg-white border border-[#E4EAE5] rounded-lg px-2 py-1 text-xs"
                        >
                          {sheetData?.customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={alloc.amount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value || '0');
                            setCustomerAllocations((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, amount: val } : item))
                            );
                          }}
                          className="w-24 bg-white border border-[#E4EAE5] rounded-lg px-2 py-1 text-xs font-bold text-right"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomerAllocation(idx)}
                          className="text-red-600 p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E4EAE5] space-y-2">
                {!isConfirmed && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      leftIcon={<Save className="w-4 h-4" />}
                      onClick={handleSaveDraft}
                      isLoading={isSaving}
                    >
                      مسودہ محفوظ کریں (Save Draft)
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      className="w-full py-3 text-sm font-bold"
                      leftIcon={<Lock className="w-4 h-4" />}
                      onClick={handleConfirmClosing}
                      isLoading={isConfirming}
                      disabled={hasInsufficientStock || activeLines.length === 0}
                    >
                      آج کا کھاتہ و سٹاک کلوز کریں (Confirm & Close)
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TODAY'S PURCHASES / MAL AYA */}
      {/* ========================================================================= */}
      {activeTab === 'PURCHASES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quick Purchase Entry Form (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E4EAE5] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4EAE5] pb-2">
                <h3 className="font-black text-sm text-[#172B25] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>آج کا مال درج کریں (Inward Stock Purchase)</span>
                </h3>
                <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded-full">
                  سٹاک میں اضافہ
                </span>
              </div>

              <div className="space-y-3">
                {/* Supplier Selection */}
                <div>
                  <label className="text-xs font-bold text-[#172B25] block mb-1">
                    سپلائر / آڑھتی (Supplier):
                  </label>
                  <select
                    value={purchaseSupplierId}
                    onChange={(e) => setPurchaseSupplierId(e.target.value)}
                    className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl px-3 py-2 text-xs font-bold text-[#172B25] outline-none"
                  >
                    {suppliersList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.isArthi ? ' (آڑھتی)' : ''} • {s.city || 'غلہ منڈی'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rice Product Selection */}
                <div>
                  <label className="text-xs font-bold text-[#172B25] block mb-1">
                    چاول کی ورائٹی (Rice Product):
                  </label>
                  <select
                    value={purchaseProductId}
                    onChange={(e) => {
                      const pid = e.target.value;
                      setPurchaseProductId(pid);
                      const prod = sheetData?.productsCatalog.find((p) => p.id === pid);
                      if (prod) {
                        setPurchaseRate(prod.costPricePerKg || 250);
                        setPurchaseWeightKg((purchaseBags * prod.defaultBagWeightKg) + (purchaseLooseKg || 0));
                      }
                    }}
                    className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl px-3 py-2 text-xs font-bold text-[#172B25] outline-none"
                  >
                    {sheetData?.productsCatalog.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.variety}) • {p.defaultBagWeightKg} Kg بوری
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bags, Loose Kg & Total Weight */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#172B25] block mb-1">بوریاں (Bags):</label>
                    <input
                      type="number"
                      min={0}
                      value={purchaseBags === 0 ? '' : purchaseBags}
                      placeholder="0"
                      onChange={(e) => {
                        const b = parseInt(e.target.value || '0', 10);
                        setPurchaseBags(b);
                        const prod = sheetData?.productsCatalog.find((p) => p.id === purchaseProductId);
                        const bw = prod ? prod.defaultBagWeightKg : 50;
                        setPurchaseWeightKg((b * bw) + (purchaseLooseKg || 0));
                      }}
                      className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl px-3 py-2 text-xs font-bold text-[#172B25]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-emerald-800 block mb-1">کھلے کلو (Loose KG):</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={purchaseLooseKg === 0 ? '' : purchaseLooseKg}
                      placeholder="0"
                      onChange={(e) => {
                        const l = parseFloat(e.target.value || '0');
                        setPurchaseLooseKg(l);
                        const prod = sheetData?.productsCatalog.find((p) => p.id === purchaseProductId);
                        const bw = prod ? prod.defaultBagWeightKg : 50;
                        setPurchaseWeightKg((purchaseBags * bw) + l);
                      }}
                      className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#172B25] block mb-1">کل وزن (Net Kg):</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={purchaseWeightKg}
                      onChange={(e) => setPurchaseWeightKg(parseFloat(e.target.value || '0'))}
                      className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl px-3 py-2 text-xs font-bold text-[#172B25]"
                    />
                  </div>
                </div>

                {/* Rate & Total */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#172B25] block mb-1">خرید ریٹ (Rate/Kg):</label>
                    <input
                      type="number"
                      min={1}
                      step="any"
                      value={purchaseRate}
                      onChange={(e) => setPurchaseRate(parseFloat(e.target.value || '0'))}
                      className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl px-3 py-2 text-xs font-bold text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#718078] block mb-1">کل مالیت (Total PKR):</label>
                    <div className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs font-black text-blue-900 font-mono">
                      PKR {(purchaseWeightKg * purchaseRate).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Payment Type */}
                <div>
                  <label className="text-xs font-bold text-[#172B25] block mb-1">ادائیگی کی قسم:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPurchasePaymentType('CREDIT')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        purchasePaymentType === 'CREDIT'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-gray-100 text-[#718078]'
                      }`}
                    >
                      ادھار کھاتہ (دینا ہے)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurchasePaymentType('CASH')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        purchasePaymentType === 'CASH'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-gray-100 text-[#718078]'
                      }`}
                    >
                      نقد ادا کیا (Cash)
                    </button>
                  </div>
                </div>

                {/* Add Purchase Button */}
                <Button
                  type="button"
                  variant="primary"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={handleAddQuickPurchase}
                  isLoading={isAddingPurchase}
                >
                  + آج کا مال شامل کریں (Save Purchase)
                </Button>
              </div>
            </div>
          </div>

          {/* Today's Purchases Table (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E4EAE5] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4EAE5] pb-2">
                <div>
                  <h3 className="font-black text-sm text-[#172B25]">
                    آج موصول شدہ مال کی تفصیل ({todayPurchases.length} لاٹس)
                  </h3>
                  <p className="text-[11px] text-[#718078]">یہ مال دکان کے سٹاک اور سپلائر کے کھاتے میں خود بخود جمع ہو گیا ہے</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-700 block">
                    کل رقم: PKR {todayPurchasesTotal.amount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#718078]">
                    {todayPurchasesTotal.bags} بوریاں ({todayPurchasesTotal.weight.toLocaleString()} Kg)
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold border-b border-[#E4EAE5]">
                    <tr>
                      <th className="py-2.5 px-3">سپلائر / آڑھتی</th>
                      <th className="py-2.5 px-3">چاول کی ورائٹی</th>
                      <th className="py-2.5 px-3 text-right">بوریاں</th>
                      <th className="py-2.5 px-3 text-right">وزن (Kg)</th>
                      <th className="py-2.5 px-3 text-right">ریٹ</th>
                      <th className="py-2.5 px-3 text-right font-bold text-blue-700">کل رقم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4EAE5]">
                    {todayPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#718078]">
                          آج ابھی تک کوئی مال درج نہیں ہوا۔ بائیں طرف سے نیا مال شامل کریں۔
                        </td>
                      </tr>
                    ) : (
                      todayPurchases.map((p, idx) => (
                        <tr key={idx} className="hover:bg-[#F5F7F5]/50">
                          <td className="py-2.5 px-3 font-bold text-[#172B25]">{p.supplierName}</td>
                          <td className="py-2.5 px-3 text-[#172B25]">{p.productName}</td>
                          <td className="py-2.5 px-3 text-right font-bold">{p.bagCount}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{p.weightKg.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{p.ratePerKg}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                            PKR {p.totalAmount.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BRANCH REMITTANCE (MANSEHRA CASH & BANK TO OKARA OWNER) */}
      {/* ========================================================================= */}
      {activeTab === 'REMITTANCE' && (
        <BranchRemittanceSection
          selectedDate={selectedDate}
          onTotalCashRemittedChange={setRemittedCashTotal}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GALLA RECONCILIATION & DAILY PROFIT */}
      {/* ========================================================================= */}
      {activeTab === 'GALLA' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Today's Trading Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-700" />
              <span>آج کی خریدو فروخت کا خلاصہ</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50 text-emerald-950">
                <span className="font-semibold">کل فروخت (Sales Revenue):</span>
                <span className="font-mono font-bold text-sm text-emerald-800">
                  PKR {netSalesRevenue.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-blue-50 text-blue-950">
                <span className="font-semibold">کل خریداریاں (Inward Purchases):</span>
                <span className="font-mono font-bold text-sm text-blue-800">
                  PKR {todayPurchasesTotal.amount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-amber-50 text-amber-950">
                <span className="font-semibold">خام منافع (Gross Margin):</span>
                <span className="font-mono font-bold text-sm text-amber-800">
                  PKR {grossProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Cash in Counter Galla */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-700" />
              <span>نقد گلے کا حساب (Cash In Hand)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span>فروخت سے نقد کیش:</span>
                <span className="font-mono font-bold text-emerald-700">PKR {cashAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-slate-700">
                <span>خریداریاں نقد ادا کیں:</span>
                <span className="font-mono font-bold text-rose-600">- PKR {todayPurchasesTotal.cashPaid.toLocaleString()}</span>
              </div>

              {remittedCashTotal > 0 && (
                <div className="flex justify-between items-center bg-emerald-50/80 p-2 rounded-xl text-emerald-950 border border-emerald-200">
                  <span className="font-semibold">مانسہرہ سے اوکاڑہ کیش بھیجا:</span>
                  <span className="font-mono font-bold text-emerald-800">- PKR {remittedCashTotal.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-emerald-800">
                <span>گلے میں خالص کیش باقی:</span>
                <span className="font-mono text-base font-black">
                  PKR {Math.max(0, cashAmount - todayPurchasesTotal.cashPaid - remittedCashTotal).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Final Confirm and Lock */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>شام کی حتمی کلوزنگ (Daily Closing)</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                کلوزنگ تصدیق پر دکان کا سٹاک خود بخود اپ ڈیٹ ہو جائے گا، کسٹمر اور سپلائر کھاتے پوسٹ ہوں گے اور دن کا کھاتہ لاک ہو جائے گا۔
              </p>
            </div>

            <div className="mt-5">
              <Button
                type="button"
                variant="primary"
                className="w-full py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                leftIcon={<Lock className="w-4 h-4" />}
                onClick={handleConfirmClosing}
                isLoading={isConfirming}
                disabled={isConfirmed || hasInsufficientStock || activeLines.length === 0}
              >
                {isConfirmed ? 'آج کا دن پہلے ہی کلوز ہے' : 'آج کا کھاتہ و سٹاک کلوز کریں (Confirm & Close)'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
