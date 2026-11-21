import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ProfitLossReport } from '../../types/accounting';
import { accountingService } from '../../services/accounting.service';
import { Printer, TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';

interface ProfitLossModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfitLossModal: React.FC<ProfitLossModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<ProfitLossReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await accountingService.getProfitLoss({
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handlePrint = () => {
    window.print();
  };

  const isNetProfitPositive = data && Number(data.netProfit) >= 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Profit & Loss Statement (Income Statement)"
      subtitle="Period financial performance derived strictly from posted sales, inventory COGS, and operating expenses"
      maxWidth="4xl"
    >
      <div className="p-6 space-y-5">
        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4EAE5]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#172B25]">Period:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="From"
              className="px-2.5 py-1 bg-white border border-[#E4EAE5] rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
            />
            <span className="text-xs text-[#718078]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="To"
              className="px-2.5 py-1 bg-white border border-[#E4EAE5] rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
            />
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              Apply Filter
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print P&L
          </button>
        </div>

        {/* Top KPI Cards */}
        {data && (
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">
                Rs {Number(data.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Profit</span>
              <div className="flex items-baseline justify-between mt-0.5">
                <p className="text-base font-extrabold text-emerald-800">
                  Rs {Number(data.grossProfit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-xs font-bold text-emerald-600">{data.grossMarginPct}%</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Expenses</span>
              <p className="text-base font-extrabold text-red-600 mt-0.5">
                Rs {Number(data.totalExpenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className={`p-3 rounded-xl border ${isNetProfitPositive ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isNetProfitPositive ? 'text-emerald-800' : 'text-red-800'}`}>
                Net Profit
              </span>
              <div className="flex items-baseline justify-between mt-0.5">
                <p className={`text-base font-extrabold ${isNetProfitPositive ? 'text-emerald-900' : 'text-red-900'}`}>
                  Rs {Number(data.netProfit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className={`text-xs font-bold ${isNetProfitPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                  {data.netMarginPct}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Income Statement Breakdown */}
        {data && (
          <div className="border border-[#E4EAE5] rounded-xl overflow-hidden text-xs">
            {/* 1. Operating Revenue */}
            <div className="bg-[#087A55] text-white font-bold px-4 py-2 uppercase tracking-wider">
              1. Operating Sales Revenue
            </div>
            <div className="p-3 divide-y divide-[#E4EAE5] bg-white">
              <div className="flex justify-between py-1.5 font-medium">
                <span>Rice Sales Revenue (Invoices & Daily Sales)</span>
                <span className="font-mono font-bold text-slate-900">
                  Rs {Number(data.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1.5 font-medium text-slate-600">
                <span>Less: Cost of Goods Sold (Landed Cost of Rice)</span>
                <span className="font-mono font-bold text-red-600">
                  (Rs {Number(data.costOfGoodsSold).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                </span>
              </div>
              <div className="flex justify-between py-2 font-bold bg-emerald-50/50 px-2 rounded-lg text-emerald-900">
                <span>GROSS PROFIT (Margin: {data.grossMarginPct}%)</span>
                <span className="font-mono text-sm">
                  Rs {Number(data.grossProfit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* 2. Operating Expenses Breakdown */}
            <div className="bg-slate-700 text-white font-bold px-4 py-2 uppercase tracking-wider">
              2. Operating Expenses
            </div>
            <div className="p-3 divide-y divide-[#E4EAE5] bg-white">
              {data.expenseBreakdown.map((exp, idx) => (
                <div key={idx} className="flex justify-between py-1 text-slate-700 font-medium">
                  <span>{exp.category}</span>
                  <span className="font-mono">
                    Rs {Number(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-bold bg-red-50/50 px-2 rounded-lg text-red-900">
                <span>TOTAL OPERATING EXPENSES</span>
                <span className="font-mono text-sm">
                  (Rs {Number(data.totalExpenses).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                </span>
              </div>
            </div>

            {/* 3. Other Incomes Breakdown */}
            <div className="bg-emerald-800 text-white font-bold px-4 py-2 uppercase tracking-wider">
              3. Other Business Income
            </div>
            <div className="p-3 divide-y divide-[#E4EAE5] bg-white">
              {data.incomeBreakdown.length === 0 ? (
                <div className="py-1 text-slate-400 italic">No other business income recorded.</div>
              ) : (
                data.incomeBreakdown.map((inc, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-slate-700 font-medium">
                    <span>{inc.category}</span>
                    <span className="font-mono text-emerald-700">
                      Rs {Number(inc.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              )}
              <div className="flex justify-between py-2 font-bold bg-emerald-50/50 px-2 rounded-lg text-emerald-900">
                <span>TOTAL OTHER INCOME</span>
                <span className="font-mono text-sm">
                  +Rs {Number(data.totalOtherIncome).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Grand Total: Net Profit */}
            <div
              className={`px-4 py-3 font-extrabold text-sm flex justify-between items-center ${
                isNetProfitPositive ? 'bg-emerald-800 text-white' : 'bg-red-800 text-white'
              }`}
            >
              <span className="uppercase tracking-wider">NET PROFIT / (LOSS) FOR THE PERIOD</span>
              <span className="font-mono text-base">
                Rs {Number(data.netProfit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
