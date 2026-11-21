import React from 'react';
import { StockAlert } from '../../types/inventory';
import { AlertTriangle, AlertCircle, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';

interface StockAlertsBannerProps {
  lowStock: StockAlert[];
  outOfStock: StockAlert[];
  isLoading: boolean;
  onOpenProcurementOrder: (productName: string) => void;
}

export const StockAlertsBanner: React.FC<StockAlertsBannerProps> = ({
  lowStock,
  outOfStock,
  isLoading,
  onOpenProcurementOrder,
}) => {
  const totalAlerts = lowStock.length + outOfStock.length;

  return (
    <div className="space-y-6">
      {/* Overview Status Banner */}
      <div
        className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          totalAlerts > 0
            ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
            : 'bg-[#F0FDF4] border-[#A7F3D0] text-[#064E3B]'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3 rounded-xl ${
              totalAlerts > 0 ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#DCFCE7] text-[#087A55]'
            }`}
          >
            {totalAlerts > 0 ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-base font-bold">
              {totalAlerts > 0
                ? `${totalAlerts} Rice Varieties Require Procurement Attention`
                : 'All Godown Varieties Maintain Healthy Safety Stocks'}
            </h2>
            <p className="text-xs opacity-85 mt-0.5">
              {totalAlerts > 0
                ? `${outOfStock.length} varieties depleted (zero stock) and ${lowStock.length} below minimum safety reorder thresholds.`
                : 'Current inventory buffers meet or exceed minimum operational thresholds across all storage godowns.'}
            </p>
          </div>
        </div>
      </div>

      {/* Out of Stock (Critical Zero Balance) */}
      {outOfStock.length > 0 && (
        <div className="bg-white rounded-xl border border-[#FECACA] shadow-xs overflow-hidden">
          <div className="bg-[#FEF2F2] px-5 py-3 border-b border-[#FECACA] flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[#DC2626]">
              <AlertCircle className="w-4 h-4" />
              <span>CRITICAL: Depleted / Out of Stock ({outOfStock.length})</span>
            </div>
            <span className="text-xs font-semibold text-[#DC2626]">Requires Immediate Mandi Order</span>
          </div>

          <div className="divide-y divide-[#E4EAE5]">
            {outOfStock.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-[#F5F7F5]/50 transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-[#172B25]">{item.productName}</h4>
                  <p className="text-xs text-[#718078] mt-0.5">
                    Storage: <span className="font-semibold text-[#172B25]">{item.warehouseName}</span> · Minimum Buffer:{' '}
                    <span className="font-bold font-mono-num">{parseFloat(item.reorderLevelKg as string).toLocaleString()} Kg</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#DC2626] bg-[#FEE2E2] px-2.5 py-1 rounded-full">
                      0 Bags (0 Kg)
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                    onClick={() => onOpenProcurementOrder(item.productName)}
                  >
                    Initiate Purchase
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock (Below Minimum Reorder Threshold) */}
      {lowStock.length > 0 && (
        <div className="bg-white rounded-xl border border-[#FDE68A] shadow-xs overflow-hidden">
          <div className="bg-[#FFFBEB] px-5 py-3 border-b border-[#FDE68A] flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[#D97706]">
              <AlertTriangle className="w-4 h-4" />
              <span>LOW STOCK: Below Safe Reorder Level ({lowStock.length})</span>
            </div>
            <span className="text-xs font-semibold text-[#D97706]">Buffer Exhaustion Imminent</span>
          </div>

          <div className="divide-y divide-[#E4EAE5]">
            {lowStock.map((item, idx) => {
              const currentWeight = parseFloat(item.currentWeightKg as string);
              const reorderLevel = parseFloat(item.reorderLevelKg as string);
              const pct = Math.min(100, Math.round((currentWeight / reorderLevel) * 100));

              return (
                <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F5F7F5]/50 transition-colors">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#172B25]">{item.productName}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] font-bold">
                        {pct}% of buffer
                      </span>
                    </div>
                    <p className="text-xs text-[#718078]">
                      Storage: <span className="font-semibold text-[#172B25]">{item.warehouseName}</span> · Current:{' '}
                      <span className="font-bold text-[#172B25] font-mono-num">{item.currentBags} Bags</span> (
                      {currentWeight.toLocaleString()} Kg) · Reorder Threshold:{' '}
                      <span className="font-bold font-mono-num">{reorderLevel.toLocaleString()} Kg</span>
                    </p>

                    {/* Buffer Progress Bar */}
                    <div className="w-full max-w-md h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D97706] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 justify-end">
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-[#718078] uppercase block">Procurement Deficit</span>
                      <span className="text-sm font-bold text-[#D97706] font-mono-num">
                        +{item.deficitKg ? parseFloat(item.deficitKg).toLocaleString() : 0} Kg Needed
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<ShoppingCart className="w-3.5 h-3.5 text-[#087A55]" />}
                      onClick={() => onOpenProcurementOrder(item.productName)}
                    >
                      Restock Lot
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
