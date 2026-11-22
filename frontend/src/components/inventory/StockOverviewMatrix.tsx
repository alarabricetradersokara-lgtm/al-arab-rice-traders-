import React, { useState } from 'react';
import { StockRecord, StockOverviewSummary, Warehouse } from '../../types/inventory';
import { MetricCard } from '../common/MetricCard';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Boxes,
  Scale,
  DollarSign,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  PackageX,
  FileText,
  Warehouse as WarehouseIcon,
} from 'lucide-react';

interface StockOverviewMatrixProps {
  stocks: StockRecord[];
  summary: StockOverviewSummary;
  warehouses: Warehouse[];
  selectedWarehouseId: string;
  onSelectWarehouse: (id: string) => void;
  isLoading: boolean;
  onOpenOpeningStock: () => void;
  onOpenAdjustment: (stock: StockRecord) => void;
  onOpenWastage: (stock: StockRecord) => void;
  onViewLedger: (productId: string) => void;
}

export const StockOverviewMatrix: React.FC<StockOverviewMatrixProps> = ({
  stocks,
  summary,
  warehouses,
  selectedWarehouseId,
  onSelectWarehouse,
  isLoading,
  onOpenOpeningStock,
  onOpenAdjustment,
  onOpenWastage,
  onViewLedger,
}) => {
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const filteredStocks = stocks.filter((s) => {
    const matchesSearch =
      s.product.name.toLowerCase().includes(search.toLowerCase()) ||
      s.product.code.toLowerCase().includes(search.toLowerCase()) ||
      s.warehouse.name.toLowerCase().includes(search.toLowerCase());
    const matchesLowStock = lowStockFilter ? s.isLowStock : true;
    return matchesSearch && matchesLowStock;
  });

  return (
    <div className="space-y-6">
      {/* 1. Summary KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label="Total Godown Bags"
          value={summary.totalBags ? summary.totalBags.toLocaleString() : '0'}
          unit="Bags"
          icon={<Boxes className="w-5 h-5" />}
          variant="emerald"
        />
        <MetricCard
          label="Total Net Weight"
          value={summary.totalWeightKg ? parseFloat(summary.totalWeightKg).toLocaleString() : '0'}
          unit="Kg"
          icon={<Scale className="w-5 h-5" />}
          variant="default"
        />
        <MetricCard
          label="Maunds (40kg)"
          value={summary.totalMaunds ? parseFloat(summary.totalMaunds).toLocaleString() : '0'}
          unit="Mnds"
          icon={<Scale className="w-5 h-5" />}
          variant="blue"
        />
        <MetricCard
          label="Metric Tonnage"
          value={summary.totalMetricTons || '0.000'}
          unit="MT"
          icon={<WarehouseIcon className="w-5 h-5" />}
          variant="default"
        />
        <MetricCard
          label="Inventory Valuation"
          value={summary.totalValuation ? (parseFloat(summary.totalValuation) / 1000000).toFixed(2) : '0'}
          unit="M PKR"
          icon={<DollarSign className="w-5 h-5" />}
          variant="emerald"
        />
        <MetricCard
          label="Low Stock Alerts"
          value={summary.lowStockCount || 0}
          unit="Varieties"
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={summary.lowStockCount > 0 ? 'amber' : 'default'}
        />
      </div>

      {/* 2. Shop Location Header & Search */}
      <div className="bg-white p-3 rounded-xl border border-[#E4EAE5] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 shadow-2xs">
            <WarehouseIcon className="w-4 h-4 text-emerald-600" />
            <span>مرکزی دکان - مانسہرہ (Main Shop - Mansehra)</span>
            <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-full mr-1">
              {stocks.length} ورائٹیز
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenOpeningStock}
            leftIcon={<Boxes className="w-4 h-4 text-[#087A55]" />}
          >
            Opening Stock Entry
          </Button>
        </div>
      </div>

      {/* 3. Search and Low Stock Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#718078] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search variety, code or godown..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E4EAE5] rounded-lg pl-9 pr-4 py-2 text-xs text-[#172B25] focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30 focus:border-[#087A55]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <label className="flex items-center gap-2 text-xs font-semibold text-[#172B25] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="w-4 h-4 text-[#087A55] rounded-sm focus:ring-[#087A55]"
            />
            <span>Filter Critical / Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* 4. Dual-UOM Stock Matrix Table */}
      <div className="bg-white rounded-xl border border-[#E4EAE5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[11px] font-bold text-[#718078] uppercase tracking-wider">
                <th className="py-3.5 px-4">Rice Variety & Code</th>
                <th className="py-3.5 px-4">Godown Location</th>
                <th className="py-3.5 px-4 text-right">Physical Bags</th>
                <th className="py-3.5 px-4 text-right">Net Weight (Kg)</th>
                <th className="py-3.5 px-4 text-right">Maunds (40kg)</th>
                <th className="py-3.5 px-4 text-right">Unit Rate</th>
                <th className="py-3.5 px-4 text-right">Stock Valuation</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAE5] text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#718078]">
                    Loading stock records from database...
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#718078]">
                    No inventory records found for the selected godown and filters.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => (
                  <tr
                    key={stock.id}
                    className="hover:bg-[#F5F7F5]/80 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#172B25] group-hover:text-[#087A55] transition-colors">
                        {stock.product.name}
                      </div>
                      <div className="text-xs font-mono text-[#718078] flex items-center gap-2">
                        <span>{stock.product.code}</span>
                        <span>•</span>
                        <span>{stock.product.category}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-xs text-[#172B25]">
                      {stock.warehouse.name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#172B25]">
                      {stock.currentBags.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-medium text-[#172B25]">
                      {parseFloat(stock.currentWeightKg as string).toLocaleString()} Kg
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-[#087A55]">
                      {stock.maunds} Mnds
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num text-xs text-[#718078]">
                      PKR {parseFloat(stock.product.costPricePerKg as string).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#172B25]">
                      PKR {parseFloat(stock.valuationAmount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {stock.isOutOfStock ? (
                        <Badge variant="danger" size="sm">
                          Depleted
                        </Badge>
                      ) : stock.isLowStock ? (
                        <Badge variant="warning" size="sm">
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="emerald" size="sm">
                          Optimal
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenAdjustment(stock)}
                          title="Physical Cycle Count Audit"
                          className="p-1.5 rounded-lg text-[#718078] hover:text-[#087A55] hover:bg-[#E8F5E9] transition-colors cursor-pointer"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenWastage(stock)}
                          title="Record Wastage or Spillage"
                          className="p-1.5 rounded-lg text-[#718078] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                        >
                          <PackageX className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onViewLedger(stock.product.id)}
                          title="View Stock Ledger"
                          className="p-1.5 rounded-lg text-[#718078] hover:text-[#0284C7] hover:bg-[#E0F2FE] transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
