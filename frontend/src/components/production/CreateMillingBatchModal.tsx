import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Warehouse, RiceProduct } from '../../types/inventory';
import { Plus, Trash2, AlertCircle, Calculator } from 'lucide-react';

interface CreateMillingBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  warehouses: Warehouse[];
  products: RiceProduct[];
}

export const CreateMillingBatchModal: React.FC<CreateMillingBatchModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  warehouses,
  products,
}) => {
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Processing Costs
  const [laborCost, setLaborCost] = useState<number | ''>(15000);
  const [powerCost, setPowerCost] = useState<number | ''>(20000);
  const [otherCost, setOtherCost] = useState<number | ''>(5000);

  // Inputs (Raw Paddy)
  const [inputProductId, setInputProductId] = useState(products[0]?.id || '');
  const [inputBags, setInputBags] = useState<number | ''>(60);
  const [inputWeightKg, setInputWeightKg] = useState<number | ''>(3000);
  const [inputCostPerKg, setInputCostPerKg] = useState<number | ''>(120);

  // Outputs (Head Rice, Broken, Bran, Husk, Wastage)
  const [headRiceProductId, setHeadRiceProductId] = useState(products[1]?.id || products[0]?.id || '');
  const [headRiceWeight, setHeadRiceWeight] = useState<number | ''>(1800);
  const [headRiceCost, setHeadRiceCost] = useState<number | ''>(240);

  const [brokenRiceWeight, setBrokenRiceWeight] = useState<number | ''>(450);
  const [brokenRiceCost, setBrokenRiceCost] = useState<number | ''>(130);

  const [branWeight, setBranWeight] = useState<number | ''>(300);
  const [branCost, setBranCost] = useState<number | ''>(65);

  const [huskWeight, setHuskWeight] = useState<number | ''>(300);
  const [huskCost, setHuskCost] = useState<number | ''>(20);

  const [wastageWeight, setWastageWeight] = useState<number | ''>(150);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic calculations
  const numInputWeight = Number(inputWeightKg) || 0;
  const numInputCost = numInputWeight * (Number(inputCostPerKg) || 0);

  const numHead = Number(headRiceWeight) || 0;
  const numBroken = Number(brokenRiceWeight) || 0;
  const numBran = Number(branWeight) || 0;
  const numHusk = Number(huskWeight) || 0;
  const numWastage = Number(wastageWeight) || 0;

  const totalOutputWeight = numHead + numBroken + numBran + numHusk + numWastage;
  const overallYieldPct = numInputWeight > 0 ? ((totalOutputWeight / numInputWeight) * 100).toFixed(1) : '0.0';
  const headRiceYieldPct = numInputWeight > 0 ? ((numHead / numInputWeight) * 100).toFixed(1) : '0.0';

  const totalProcessing = (Number(laborCost) || 0) + (Number(powerCost) || 0) + (Number(otherCost) || 0);

  const outputValuation =
    numHead * (Number(headRiceCost) || 0) +
    numBroken * (Number(brokenRiceCost) || 0) +
    numBran * (Number(branCost) || 0) +
    numHusk * (Number(huskCost) || 0);

  const netBatchProfit = outputValuation - (numInputCost + totalProcessing);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) {
      setError('Please select a warehouse');
      return;
    }
    if (numInputWeight <= 0) {
      setError('Input paddy weight must be greater than zero');
      return;
    }
    if (numHead <= 0) {
      setError('Head rice output weight must be greater than zero');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        warehouseId,
        startDate: new Date(startDate).toISOString(),
        notes,
        processingLaborCost: Number(laborCost) || 0,
        electricityPowerCost: Number(powerCost) || 0,
        otherMillingCost: Number(otherCost) || 0,
        inputs: [
          {
            productId: inputProductId,
            bagCount: Number(inputBags) || 0,
            weightKg: numInputWeight,
            unitCostPerKg: Number(inputCostPerKg) || 0,
          },
        ],
        outputs: [
          {
            productId: headRiceProductId,
            outputType: 'HEAD_RICE',
            bagCount: Math.round(numHead / 50),
            weightKg: numHead,
            unitCostPerKg: Number(headRiceCost) || 0,
          },
          {
            productId: headRiceProductId,
            outputType: 'BROKEN_RICE',
            bagCount: Math.round(numBroken / 50),
            weightKg: numBroken,
            unitCostPerKg: Number(brokenRiceCost) || 0,
          },
          {
            productId: headRiceProductId,
            outputType: 'BRAN',
            bagCount: Math.round(numBran / 50),
            weightKg: numBran,
            unitCostPerKg: Number(branCost) || 0,
          },
          {
            productId: headRiceProductId,
            outputType: 'HUSK',
            bagCount: Math.round(numHusk / 50),
            weightKg: numHusk,
            unitCostPerKg: Number(huskCost) || 0,
          },
          {
            productId: headRiceProductId,
            outputType: 'WASTAGE',
            bagCount: 0,
            weightKg: numWastage,
            unitCostPerKg: 0,
          },
        ],
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create milling batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Rice Milling & Production Batch"
      subtitle="Crush raw paddy, allocate finished rice varieties and byproducts, compute yields and batch profitability"
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
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Milling Warehouse *</label>
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
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Batch Run Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-xs focus:outline-none focus:border-emerald-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Batch Narration / Ref</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Kainat 1121 Paddy Run #04"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-xs focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* 1. INPUT RAW GRAIN / PADDY */}
        <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2.5">
          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
            📥 Input Raw Material (Paddy / Dhan)
          </span>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Paddy Variety</label>
              <select
                value={inputProductId}
                onChange={(e) => setInputProductId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Bags Crushed</label>
              <input
                type="number"
                value={inputBags}
                onChange={(e) => setInputBags(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="60"
                className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Weight (KG)</label>
              <input
                type="number"
                value={inputWeightKg}
                onChange={(e) => setInputWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="3000"
                className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Cost / KG (Rs)</label>
              <input
                type="number"
                value={inputCostPerKg}
                onChange={(e) => setInputCostPerKg(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="120"
                className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold"
                required
              />
            </div>
          </div>
          <div className="text-right text-xs font-bold text-amber-900">
            Total Input Grain Cost: Rs {numInputCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* 2. PROCESSING & CONVERSION COSTS */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            ⚙️ Milling Processing & Utility Costs (PKR)
          </span>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Milling Labor (Palledari)</label>
              <input
                type="number"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="15000"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Electricity & Fuel Power</label>
              <input
                type="number"
                value={powerCost}
                onChange={(e) => setPowerCost(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="20000"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Rollers / Maintenance</label>
              <input
                type="number"
                value={otherCost}
                onChange={(e) => setOtherCost(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="5000"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* 3. OUTPUT FINISHED RICE & BYPRODUCTS BREAKDOWN */}
        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5">
          <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
            📤 Output Finished Rice & By-Products Recovery
          </span>

          <div className="space-y-2 text-xs">
            {/* Head Rice */}
            <div className="grid grid-cols-4 gap-2 items-center">
              <span className="font-bold text-emerald-950">1. Head Rice (A-Grade)</span>
              <input
                type="number"
                value={headRiceWeight}
                onChange={(e) => setHeadRiceWeight(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Weight Kg"
                className="px-2 py-1 bg-white border border-emerald-300 rounded-lg font-mono font-bold"
              />
              <input
                type="number"
                value={headRiceCost}
                onChange={(e) => setHeadRiceCost(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Valuation/Kg"
                className="px-2 py-1 bg-white border border-emerald-300 rounded-lg font-mono font-bold"
              />
              <span className="text-right font-mono font-bold text-emerald-800">
                Rs {(numHead * (Number(headRiceCost) || 0)).toLocaleString()}
              </span>
            </div>

            {/* Broken Rice */}
            <div className="grid grid-cols-4 gap-2 items-center">
              <span className="font-semibold text-slate-700">2. Broken Rice (Tota / Kani)</span>
              <input
                type="number"
                value={brokenRiceWeight}
                onChange={(e) => setBrokenRiceWeight(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Weight Kg"
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono"
              />
              <input
                type="number"
                value={brokenRiceCost}
                onChange={(e) => setBrokenRiceCost(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Valuation/Kg"
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono"
              />
              <span className="text-right font-mono font-bold text-slate-800">
                Rs {(numBroken * (Number(brokenRiceCost) || 0)).toLocaleString()}
              </span>
            </div>

            {/* Rice Bran */}
            <div className="grid grid-cols-4 gap-2 items-center">
              <span className="font-semibold text-slate-700">3. Rice Bran (Khul / Phak)</span>
              <input
                type="number"
                value={branWeight}
                onChange={(e) => setBranWeight(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Weight Kg"
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono"
              />
              <input
                type="number"
                value={branCost}
                onChange={(e) => setBranCost(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Valuation/Kg"
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono"
              />
              <span className="text-right font-mono font-bold text-slate-800">
                Rs {(numBran * (Number(branCost) || 0)).toLocaleString()}
              </span>
            </div>

            {/* Rice Husk */}
            <div className="grid grid-cols-4 gap-2 items-center">
              <span className="font-semibold text-slate-700">4. Rice Husk (Bhoosa / Phuk)</span>
              <input
                type="number"
                value={huskWeight}
                onChange={(e) => setHuskWeight(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Weight Kg"
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono"
              />
              <input
                type="number"
                value={huskCost}
                onChange={(e) => setHuskCost(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Valuation/Kg"
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono"
              />
              <span className="text-right font-mono font-bold text-slate-800">
                Rs {(numHusk * (Number(huskCost) || 0)).toLocaleString()}
              </span>
            </div>

            {/* Wastage */}
            <div className="grid grid-cols-4 gap-2 items-center">
              <span className="font-semibold text-slate-500">5. Moisture / Dust Wastage</span>
              <input
                type="number"
                value={wastageWeight}
                onChange={(e) => setWastageWeight(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Weight Kg"
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono text-slate-500"
              />
              <span className="text-slate-400 italic text-[11px]">- Zero Value -</span>
              <span className="text-right font-mono text-slate-400">Rs 0.00</span>
            </div>
          </div>
        </div>

        {/* 4. REAL-TIME YIELD & PROFITABILITY SUMMARY BANNER */}
        <div className="p-3.5 bg-slate-900 text-white rounded-xl text-xs space-y-2">
          <div className="flex justify-between items-center font-bold pb-1 border-b border-slate-700">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Calculator className="w-4 h-4" />
              Batch Yield & Profitability Metrics:
            </span>
            <span>Input: {numInputWeight.toLocaleString()} KG | Output: {totalOutputWeight.toLocaleString()} KG</span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Overall Yield</span>
              <span className="text-sm font-extrabold text-emerald-400">{overallYieldPct}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Head Rice Recovery</span>
              <span className="text-sm font-extrabold text-amber-300">{headRiceYieldPct}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Total Valuation</span>
              <span className="text-sm font-extrabold text-white">Rs {outputValuation.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Net Batch Profit</span>
              <span className={`text-sm font-extrabold ${netBatchProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                Rs {netBatchProfit.toLocaleString()}
              </span>
            </div>
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
            {isSubmitting ? 'Processing Batch...' : 'Confirm Milling & Post Stock'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
