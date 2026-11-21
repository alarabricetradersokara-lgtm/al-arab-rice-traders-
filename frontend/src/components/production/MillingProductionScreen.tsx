import React, { useState, useEffect } from 'react';
import { ProductionBatch, MillingAnalytics } from '../../types/advanced';
import { Warehouse, RiceProduct } from '../../types/inventory';
import { advancedService } from '../../services/advanced.service';
import { CreateMillingBatchModal } from './CreateMillingBatchModal';
import {
  Boxes,
  Plus,
  RefreshCw,
  TrendingUp,
  Scale,
  Factory,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MillingProductionScreenProps {
  warehouses: Warehouse[];
  products: RiceProduct[];
}

export const MillingProductionScreen: React.FC<MillingProductionScreenProps> = ({
  warehouses,
  products,
}) => {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [analytics, setAnalytics] = useState<MillingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [batchRes, analyticsRes] = await Promise.all([
        advancedService.getProductionBatches(),
        advancedService.getMillingAnalytics(),
      ]);
      setBatches(batchRes);
      setAnalytics(analyticsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (data: any) => {
    await advancedService.createProductionBatch(data);
    await loadData();
  };

  const toggleExpand = (id: string) => {
    setExpandedBatchId(expandedBatchId === id ? null : id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[#172B25] tracking-tight">
              Rice Milling & Processing Line
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Milling Engine
            </span>
          </div>
          <p className="text-xs text-[#718078] mt-1">
            Raw paddy crushing, finished head rice recovery, broken (tota), bran & husk allocation with batch costing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Milling Batch
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white border border-[#E4EAE5] text-[#718078] hover:text-[#172B25] rounded-xl text-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Milling Analytics KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Paddy Crushed</span>
            <p className="text-xl font-extrabold text-[#172B25] mt-2">
              {Number(analytics.totalCrushedKg).toLocaleString()} <span className="text-xs font-bold text-slate-500">KG</span>
            </p>
            <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
              {Number(analytics.totalCrushedMaunds).toLocaleString()} Maunds
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Overall Yield</span>
            <p className="text-xl font-extrabold text-emerald-800 mt-2">{analytics.avgOverallYieldPct}%</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Total products recovery</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Head Rice Recovery</span>
            <p className="text-xl font-extrabold text-amber-800 mt-2">{analytics.avgHeadRiceYieldPct}%</p>
            <p className="text-[10px] text-slate-400 mt-0.5">A-Grade Basmati recovery</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">By-Products Total</span>
            <p className="text-xl font-extrabold text-slate-800 mt-2">
              {(Number(analytics.totalBrokenKg) + Number(analytics.totalBranKg) + Number(analytics.totalHuskKg)).toLocaleString()} <span className="text-xs font-bold text-slate-500">KG</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Tota, Khul & Bhoosa</p>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Net Milling Profit</span>
            <p className="text-xl font-extrabold text-emerald-950 mt-2">
              Rs {Number(analytics.cumulativeNetMillingProfit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-emerald-700 mt-0.5">Processing value-add gain</p>
          </div>
        </div>
      )}

      {/* Production Batches Table */}
      <div className="bg-white rounded-2xl border border-[#E4EAE5] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E4EAE5] bg-[#F5F7F5] flex items-center justify-between">
          <span className="text-xs font-bold text-[#172B25] uppercase tracking-wider">
            Completed Milling Batches ({batches.length})
          </span>
          <span className="text-xs text-[#718078]">Click batch row to inspect byproducts & costing breakdown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-white border-b border-[#E4EAE5] text-[#172B25] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-28">Batch #</th>
                <th className="py-2.5 px-3 w-24">Date</th>
                <th className="py-2.5 px-3 w-36">Mill Godown</th>
                <th className="py-2.5 px-3 w-28 text-right">Paddy Input (Kg)</th>
                <th className="py-2.5 px-3 w-24 text-center">Head Rice %</th>
                <th className="py-2.5 px-3 w-24 text-center">Overall %</th>
                <th className="py-2.5 px-3 w-28 text-right">Processing Cost</th>
                <th className="py-2.5 px-3 w-28 text-right">Batch Profit (Rs)</th>
                <th className="py-2.5 px-3 w-24 text-center">Status</th>
                <th className="py-2.5 px-3 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAE5]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Loading milling batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No milling batches processed yet. Click "+ New Milling Batch" to crush paddy.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <React.Fragment key={b.id}>
                    <tr
                      onClick={() => toggleExpand(b.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{b.batchNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {new Date(b.startDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#172B25]">{b.warehouse?.name || 'Main Mill'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {Number(b.totalInputWeightKg).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {b.headRiceYieldPct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {b.yieldPercentage}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-600">
                        Rs {Number(b.totalProcessingCost).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        Rs {Number(b.netBatchProfit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedBatchId === b.id ? 'rotate-180' : ''}`} />
                      </td>
                    </tr>

                    {/* Expandable Breakdown Drawer */}
                    {expandedBatchId === b.id && (
                      <tr className="bg-slate-50/90 border-b border-[#E4EAE5]">
                        <td colSpan={10} className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            {/* Inputs Table */}
                            <div className="border border-amber-200 rounded-xl p-3 bg-white space-y-2">
                              <span className="text-xs font-bold text-amber-900 uppercase">Input Paddy Consumed</span>
                              <div className="divide-y divide-slate-100 text-[11px]">
                                {b.inputs.map((inp, i) => (
                                  <div key={i} className="flex justify-between py-1">
                                    <span>{inp.product?.name || 'Raw Paddy'} ({inp.bagCount} Bags)</span>
                                    <span className="font-mono font-semibold">
                                      {Number(inp.weightKg).toLocaleString()} KG @ Rs {inp.unitCostPerKg}/Kg = Rs {Number(inp.totalCost).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Outputs Table */}
                            <div className="border border-emerald-200 rounded-xl p-3 bg-white space-y-2">
                              <span className="text-xs font-bold text-emerald-900 uppercase">Recovered Finished Goods & Byproducts</span>
                              <div className="divide-y divide-slate-100 text-[11px]">
                                {b.outputs.map((outp, i) => (
                                  <div key={i} className="flex justify-between py-1">
                                    <span className="font-semibold text-slate-700">
                                      [{outp.outputType}] {outp.product?.name} ({outp.bagCount} Bags)
                                    </span>
                                    <span className="font-mono font-semibold text-emerald-800">
                                      {Number(outp.weightKg).toLocaleString()} KG = Rs {Number(outp.totalCost).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center bg-slate-100 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700">
                            <span>Labor: Rs {Number(b.processingLaborCost).toLocaleString()} | Power: Rs {Number(b.electricityPowerCost).toLocaleString()} | Other: Rs {Number(b.otherMillingCost).toLocaleString()}</span>
                            <span className="font-mono font-bold text-emerald-800">
                              Valuation: Rs {Number(b.totalOutputValuation).toLocaleString()} - Costs: Rs {(Number(b.totalInputCost) + Number(b.totalProcessingCost)).toLocaleString()} = Net Profit: Rs {Number(b.netBatchProfit).toLocaleString()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateMillingBatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        warehouses={warehouses}
        products={products}
      />
    </div>
  );
};
