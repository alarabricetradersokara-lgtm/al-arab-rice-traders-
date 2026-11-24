import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { purchaseService } from '../../services/purchase.service';
import { Purchase, Supplier } from '../../types/purchase';
import { Warehouse, RiceProduct } from '../../types/inventory';
import {
  Search,
  Filter,
  Plus,
  FileText,
  RotateCcw,
  Truck,
  TrendingUp,
  BookOpen,
  Calendar,
  Building2,
  Scale,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface PurchaseListProps {
  warehouses: Warehouse[];
  suppliers: Supplier[];
  products: RiceProduct[];
  onNewPurchase: () => void;
  onViewInvoice: (purchase: Purchase) => void;
  onOpenReturn: (purchase: Purchase) => void;
  onViewLedger: (supplierId: string) => void;
  onViewRateHistory: () => void;
}

export const PurchaseList: React.FC<PurchaseListProps> = ({
  warehouses,
  suppliers,
  products,
  onNewPurchase,
  onViewInvoice,
  onOpenReturn,
  onViewLedger,
  onViewRateHistory,
}) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('');

  const fetchPurchases = async () => {
    try {
      setIsLoading(true);
      const res = await purchaseService.getPurchases({
        supplierId: selectedSupplierId || undefined,
        warehouseId: selectedWarehouseId || undefined,
        limit: 100,
      });
      setPurchases(Array.isArray(res) ? res : (res as any)?.purchases || []);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [selectedSupplierId, selectedWarehouseId]);

  const handleDeletePurchase = async (p: Purchase) => {
    if (window.confirm(`کیا آپ واقعی منڈی بل "${p.purchaseNumber}" (سپلائر: ${p.supplier?.name}) کو حذف کرنا چاہتے ہیں؟ اس سے متعلقہ اسٹاک کم ہو جائے گا اور کھاتہ بیلنس خود بخود ایڈجسٹ ہو جائے گا۔`)) {
      try {
        await purchaseService.deletePurchase(p.id);
        fetchPurchases();
      } catch (err: any) {
        alert(err.response?.data?.message || err.message || 'خریداری بل حذف کرنے میں غلطی ہوئی۔');
      }
    }
  };

  // Client-side search and filtering
  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.truckNumber && p.truckNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.biltyNumber && p.biltyNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPayment =
      selectedPaymentType === '' || p.paymentType === selectedPaymentType;

    return matchesSearch && matchesPayment;
  });

  // Calculate metrics
  const totalBilled = filteredPurchases.reduce((acc, p) => acc + Number(p.netAmount || 0), 0);
  const totalPaid = filteredPurchases.reduce((acc, p) => acc + Number(p.paidAmount || 0), 0);
  const totalOutstanding = filteredPurchases.reduce((acc, p) => acc + Number(p.balanceAmount || 0), 0);
  const totalBags = filteredPurchases.reduce(
    (acc, p) => acc + (p.items?.reduce((iAcc, it) => iAcc + (it.bagCount || 0), 0) || 0),
    0
  );
  const totalWeightKg = filteredPurchases.reduce(
    (acc, p) => acc + (p.items?.reduce((iAcc, it) => iAcc + Number(it.netWeightKg || 0), 0) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#172B25]">Procurement & Inward Grain Bills</h1>
            <span className="text-xs font-semibold bg-emerald-100 text-[#087A55] px-2.5 py-0.5 rounded-full">
              Mandi Operations
            </span>
          </div>
          <p className="text-xs text-[#718078] mt-1">
            Weighbridge kanda slips, Mandi Arthi bills, landed freight attribution, and payment settlements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={onViewRateHistory}>
            <TrendingUp className="w-4 h-4 mr-1.5 text-[#087A55]" /> Rate Intelligence
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (selectedSupplierId) onViewLedger(selectedSupplierId);
              else if (suppliers.length > 0) onViewLedger(suppliers[0].id);
            }}
          >
            <BookOpen className="w-4 h-4 mr-1.5 text-[#087A55]" /> Supplier Khatabook
          </Button>
          <Button variant="primary" size="sm" onClick={onNewPurchase}>
            <Plus className="w-4 h-4 mr-1" /> New Purchase Bill
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E4EAE5] shadow-2xs">
          <span className="text-[11px] font-bold text-[#718078] uppercase">Total Inward Bills</span>
          <p className="text-xl font-bold font-mono text-[#172B25] mt-1">{filteredPurchases.length}</p>
          <span className="text-[10px] text-[#718078]">{totalBags.toLocaleString()} Total Bags</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4EAE5] shadow-2xs">
          <span className="text-[11px] font-bold text-[#718078] uppercase">Total Inward Weight</span>
          <p className="text-xl font-bold font-mono text-[#087A55] mt-1">
            {(totalWeightKg / 1000).toFixed(2)} <span className="text-xs font-sans">MT</span>
          </p>
          <span className="text-[10px] text-[#718078]">~ {(totalWeightKg / 40).toFixed(0)} Maunds</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4EAE5] shadow-2xs">
          <span className="text-[11px] font-bold text-[#718078] uppercase">Total Billed (Cr)</span>
          <p className="text-xl font-bold font-mono text-[#087A55] mt-1">
            PKR {(totalBilled / 1000000).toFixed(2)}M
          </p>
          <span className="text-[10px] text-[#718078]">PKR {totalBilled.toLocaleString()}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4EAE5] shadow-2xs">
          <span className="text-[11px] font-bold text-[#718078] uppercase">Settled / Paid (Dr)</span>
          <p className="text-xl font-bold font-mono text-emerald-600 mt-1">
            PKR {(totalPaid / 1000000).toFixed(2)}M
          </p>
          <span className="text-[10px] text-emerald-700">PKR {totalPaid.toLocaleString()}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4EAE5] shadow-2xs">
          <span className="text-[11px] font-bold text-[#718078] uppercase">Payable Debt (Bal)</span>
          <p className="text-xl font-bold font-mono text-amber-600 mt-1">
            PKR {(totalOutstanding / 1000000).toFixed(2)}M
          </p>
          <span className="text-[10px] text-amber-700">PKR {totalOutstanding.toLocaleString()}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div className="relative">
            <Search className="w-4 h-4 text-[#718078] absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bill #, truck #, supplier..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
            />
          </div>

          <div>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
            >
              <option value="">All Suppliers / Arthis</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.businessName || s.city || 'Mandi'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
            >
              <option value="">All Warehouses / Godowns</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedPaymentType}
              onChange={(e) => setSelectedPaymentType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
            >
              <option value="">All Payment Types</option>
              <option value="CASH">Cash Purchase</option>
              <option value="CREDIT">Credit Purchase</option>
              <option value="PARTIAL">Partial Payment</option>
              <option value="BANK">Bank Transfer</option>
            </select>

            <button
              onClick={fetchPurchases}
              className="p-2 border border-[#E4EAE5] hover:bg-[#F5F7F5] rounded-xl text-[#718078] hover:text-[#087A55] transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="overflow-x-auto border-t border-[#E4EAE5]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold">
              <tr>
                <th className="py-3 px-3">Bill / Date</th>
                <th className="py-3 px-3">Supplier / Mandi Arthi</th>
                <th className="py-3 px-3">Godown & Vehicle</th>
                <th className="py-3 px-3 text-right">Bags Inward</th>
                <th className="py-3 px-3 text-right">Net Weight</th>
                <th className="py-3 px-3 text-right font-bold text-[#087A55]">Net Amount</th>
                <th className="py-3 px-3 text-right text-emerald-700">Paid</th>
                <th className="py-3 px-3 text-right text-amber-700 font-bold">Balance</th>
                <th className="py-3 px-3 text-center">Payment</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAE5]">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#718078]">
                    Loading purchase inward records...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#718078]">
                    No purchase bills match your criteria. Click "New Purchase Bill" to record grain inward.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  const bags = p.items?.reduce((acc, it) => acc + (it.bagCount || 0), 0) || 0;
                  const netKg = p.items?.reduce((acc, it) => acc + Number(it.netWeightKg || 0), 0) || 0;
                  const maunds = (netKg / 40).toFixed(1);

                  return (
                    <tr key={p.id} className="hover:bg-[#F5F7F5]/50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-[#087A55] block">
                          {p.purchaseNumber}
                        </span>
                        <span className="text-[10px] text-[#718078]">
                          {new Date(p.purchaseDate).toLocaleDateString('en-GB')}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#172B25] block">
                          {p.supplier?.name}
                        </span>
                        <span className="text-[10px] text-[#718078]">
                          {p.supplier?.businessName || p.supplier?.city}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-[#172B25] block">
                          {p.warehouse?.name}
                        </span>
                        <span className="text-[10px] text-[#718078] font-mono flex items-center gap-1">
                          <Truck className="w-3 h-3" /> {p.truckNumber || 'Direct Mandi'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-[#172B25]">
                        {bags} bags
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-[#087A55] block">
                          {netKg.toLocaleString()} kg
                        </span>
                        <span className="text-[10px] text-[#064E3B] font-mono block">
                          ~ {maunds} md
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-sm text-[#087A55]">
                        PKR {Number(p.netAmount).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-emerald-700">
                        PKR {Number(p.paidAmount).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-700">
                        {Number(p.balanceAmount) > 0 ? `PKR ${Number(p.balanceAmount).toLocaleString()}` : '-'}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            p.paymentType === 'CASH'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.paymentType === 'CREDIT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {p.paymentType}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewInvoice(p)}
                            className="p-1.5 text-[#087A55] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="View Kanda Slip / Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenReturn(p)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Debit Note / Quality Return"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePurchase(p)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="بل حذف کریں (Delete & Revert Stock)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
