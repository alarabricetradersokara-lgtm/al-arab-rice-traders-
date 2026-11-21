import React, { useState } from 'react';
import { StockMovement, StockMovementType, Warehouse, RiceProduct } from '../../types/inventory';
import { Badge } from '../common/Badge';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';

interface StockMovementsLedgerProps {
  movements: StockMovement[];
  warehouses: Warehouse[];
  products: RiceProduct[];
  selectedProductId?: string;
  isLoading: boolean;
  onFilterChange: (filters: { warehouseId?: string; productId?: string; movementType?: string }) => void;
}

export const StockMovementsLedger: React.FC<StockMovementsLedgerProps> = ({
  movements,
  warehouses,
  products,
  selectedProductId,
  isLoading,
  onFilterChange,
}) => {
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState(selectedProductId || '');
  const [movementType, setMovementType] = useState('');
  const [search, setSearch] = useState('');

  const handleWarehouseChange = (val: string) => {
    setWarehouseId(val);
    onFilterChange({ warehouseId: val || undefined, productId: productId || undefined, movementType: movementType || undefined });
  };

  const handleProductChange = (val: string) => {
    setProductId(val);
    onFilterChange({ warehouseId: warehouseId || undefined, productId: val || undefined, movementType: movementType || undefined });
  };

  const handleTypeChange = (val: string) => {
    setMovementType(val);
    onFilterChange({ warehouseId: warehouseId || undefined, productId: productId || undefined, movementType: val || undefined });
  };

  const formatMovementType = (type: StockMovementType) => {
    switch (type) {
      case 'OPENING_STOCK':
        return <Badge variant="forest" size="sm">Opening Stock</Badge>;
      case 'PURCHASE':
        return <Badge variant="emerald" size="sm">Procurement In</Badge>;
      case 'PURCHASE_RETURN':
        return <Badge variant="danger" size="sm">Proc Return Out</Badge>;
      case 'SALE':
        return <Badge variant="warning" size="sm">Sales Dispatch Out</Badge>;
      case 'SALE_RETURN':
        return <Badge variant="info" size="sm">Sales Return In</Badge>;
      case 'PRODUCTION_INPUT':
        return <Badge variant="neutral" size="sm">Milling Raw Input</Badge>;
      case 'PRODUCTION_OUTPUT':
        return <Badge variant="emerald" size="sm">Milling Yield Output</Badge>;
      case 'ADJUSTMENT':
        return <Badge variant="info" size="sm">Audit Adjustment</Badge>;
      case 'WASTAGE':
        return <Badge variant="danger" size="sm">Wastage Written-Off</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{type}</Badge>;
    }
  };

  const filtered = movements.filter((m) => {
    const term = search.toLowerCase();
    return (
      m.movementNumber.toLowerCase().includes(term) ||
      m.product?.name.toLowerCase().includes(term) ||
      m.warehouse?.name.toLowerCase().includes(term) ||
      (m.referenceId && m.referenceId.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E4EAE5] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-[#718078] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search movement #, product, or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg pl-9 pr-3 py-2 text-xs text-[#172B25]"
            />
          </div>

          <select
            value={warehouseId}
            onChange={(e) => handleWarehouseChange(e.target.value)}
            className="bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-xs text-[#172B25] font-medium"
          >
            <option value="">All Godowns</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-xs text-[#172B25] font-medium"
          >
            <option value="">All Rice Varieties</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={movementType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg px-3 py-2 text-xs text-[#172B25] font-medium"
          >
            <option value="">All Movement Types</option>
            <option value="OPENING_STOCK">Opening Stock</option>
            <option value="PURCHASE">Procurement In</option>
            <option value="SALE">Sales Dispatch Out</option>
            <option value="PRODUCTION_INPUT">Milling Raw In</option>
            <option value="PRODUCTION_OUTPUT">Milling Yield Out</option>
            <option value="ADJUSTMENT">Audit Adjustment</option>
            <option value="WASTAGE">Wastage / Loss</option>
          </select>
        </div>

        <div className="text-xs text-[#718078] font-medium">
          Showing <span className="font-bold text-[#172B25]">{filtered.length}</span> audit records
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-[#E4EAE5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[11px] font-bold text-[#718078] uppercase tracking-wider">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Movement #</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Product Variety</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4 text-right">Bags Delta</th>
                <th className="py-3.5 px-4 text-right">Weight Delta (Kg)</th>
                <th className="py-3.5 px-4 text-right">Cost Value</th>
                <th className="py-3.5 px-4">Reference / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAE5] text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#718078]">
                    Loading stock ledger entries...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#718078]">
                    No stock movements found matching the active filters.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const isPositive = m.bagCountDelta > 0 || parseFloat(m.weightKgDelta) > 0;
                  return (
                    <tr key={m.id} className="hover:bg-[#F5F7F5]/70 transition-colors">
                      <td className="py-3.5 px-4 text-xs font-mono text-[#718078]">
                        {new Date(m.createdAt).toLocaleString('en-PK', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#172B25]">
                        {m.movementNumber}
                      </td>
                      <td className="py-3.5 px-4">{formatMovementType(m.movementType)}</td>
                      <td className="py-3.5 px-4 font-semibold text-[#172B25]">
                        {m.product?.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[#718078]">
                        {m.warehouse?.name}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num font-bold">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            isPositive ? 'text-[#16A36A]' : 'text-[#DC2626]'
                          }`}
                        >
                          {isPositive ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          {m.bagCountDelta > 0 ? `+${m.bagCountDelta}` : m.bagCountDelta}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num font-bold">
                        <span className={isPositive ? 'text-[#16A36A]' : 'text-[#DC2626]'}>
                          {parseFloat(m.weightKgDelta) > 0
                            ? `+${parseFloat(m.weightKgDelta).toLocaleString()}`
                            : parseFloat(m.weightKgDelta).toLocaleString()}{' '}
                          Kg
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num text-xs text-[#718078]">
                        PKR {parseFloat(m.totalCost).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#718078]">
                        <div className="font-semibold text-[#172B25]">{m.referenceId}</div>
                        {m.notes && <div className="text-[11px] text-[#718078] truncate max-w-xs">{m.notes}</div>}
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
  );
};
