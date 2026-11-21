import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { BalanceSheetReport } from '../../types/accounting';
import { accountingService } from '../../services/accounting.service';
import { Printer, Scale, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface BalanceSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BalanceSheetModal: React.FC<BalanceSheetModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<BalanceSheetReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await accountingService.getBalanceSheet({ asOfDate });
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
  }, [isOpen, asOfDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Balance Sheet (Statement of Financial Position)"
      subtitle="Financial health and net worth: Assets = Liabilities + Owners Equity"
      maxWidth="4xl"
    >
      <div className="p-6 space-y-5">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4EAE5]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#172B25]">As of Date:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#E4EAE5] rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
            />
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 rounded-lg border border-[#E4EAE5] text-[#718078] hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {data && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                  data.accountingEquationVerified
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {data.accountingEquationVerified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Equation Verified: Assets = Liab + Equity
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Accounting Equation Discrepancy
                  </>
                )}
              </div>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Balance Sheet
            </button>
          </div>
        </div>

        {/* 2-Column Balance Sheet (Assets Left, Liabilities & Equity Right) */}
        {data && (
          <div className="grid grid-cols-2 gap-5 text-xs">
            {/* ASSETS COLUMN */}
            <div className="space-y-4">
              <div className="border border-[#E4EAE5] rounded-xl overflow-hidden shadow-xs">
                <div className="bg-[#087A55] text-white font-bold px-4 py-2 uppercase tracking-wider flex justify-between">
                  <span>ASSETS</span>
                  <span>PKR</span>
                </div>

                <div className="p-3 bg-white space-y-3">
                  <div>
                    <span className="font-bold text-[#172B25] block pb-1 border-b border-slate-100 uppercase text-[10px] tracking-wider text-emerald-800">
                      A. Current Assets
                    </span>
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-slate-700">
                        <span>Cash in Hand (Counter / Cash Box)</span>
                        <span className="font-mono font-semibold">
                          Rs {Number(data.assets.currentAssets.cashInHand).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Bank Accounts Balance</span>
                        <span className="font-mono font-semibold">
                          Rs {Number(data.assets.currentAssets.bankBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Accounts Receivable (Customer Khata)</span>
                        <span className="font-mono font-semibold">
                          Rs {Number(data.assets.currentAssets.accountsReceivable).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <div>
                          <span>Rice Inventory Valuation</span>
                          <span className="block text-[10px] text-slate-500">
                            ({data.assets.currentAssets.totalBagsInStock.toLocaleString()} Bags /{' '}
                            {Number(data.assets.currentAssets.totalWeightInStockKg).toLocaleString()} KG)
                          </span>
                        </div>
                        <span className="font-mono font-semibold">
                          Rs {Number(data.assets.currentAssets.inventoryValuation).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-dashed border-slate-200">
                        <span>Total Current Assets:</span>
                        <span className="font-mono">
                          Rs {Number(data.assets.currentAssets.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-[#172B25] block pb-1 border-b border-slate-100 uppercase text-[10px] tracking-wider text-emerald-800">
                      B. Fixed / Capital Assets
                    </span>
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-slate-700">
                        <span>Mill Machinery & Plant Equipment</span>
                        <span className="font-mono font-semibold">
                          Rs {Number(data.assets.fixedAssets.plantMachinery).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Weighbridge (Kanda) & Scale</span>
                        <span className="font-mono font-semibold">
                          Rs {Number(data.assets.fixedAssets.weighbridgeKanda).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-dashed border-slate-200">
                        <span>Total Fixed Assets:</span>
                        <span className="font-mono">
                          Rs {Number(data.assets.fixedAssets.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border-t-2 border-emerald-600 px-4 py-2.5 font-extrabold text-sm flex justify-between text-emerald-950">
                  <span className="uppercase tracking-wider">TOTAL ASSETS:</span>
                  <span className="font-mono">
                    Rs {Number(data.assets.totalAssets).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* LIABILITIES & EQUITY COLUMN */}
            <div className="space-y-4">
              <div className="border border-[#E4EAE5] rounded-xl overflow-hidden shadow-xs">
                <div className="bg-[#064E3B] text-white font-bold px-4 py-2 uppercase tracking-wider flex justify-between">
                  <span>LIABILITIES & EQUITY</span>
                  <span>PKR</span>
                </div>

                <div className="p-3 bg-white space-y-3">
                  {/* Liabilities */}
                  <div>
                    <span className="font-bold text-[#172B25] block pb-1 border-b border-slate-100 uppercase text-[10px] tracking-wider text-emerald-800">
                      A. Current Liabilities
                    </span>
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-slate-700">
                        <span>Accounts Payable (Suppliers & Arthis)</span>
                        <span className="font-mono font-semibold">
                          Rs {Number(data.liabilities.currentLiabilities.accountsPayable).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Accrued Expenses (Power & Labor)</span>
                        <span className="font-mono font-semibold">
                          Rs {Number(data.liabilities.currentLiabilities.accruedExpenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-dashed border-slate-200">
                        <span>Total Liabilities:</span>
                        <span className="font-mono">
                          Rs {Number(data.liabilities.totalLiabilities).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Equity */}
                  <div>
                    <span className="font-bold text-[#172B25] block pb-1 border-b border-slate-100 uppercase text-[10px] tracking-wider text-emerald-800">
                      B. Owners Equity
                    </span>
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-slate-700">
                        <span>Owners Capital</span>
                        <span className="font-mono font-semibold">
                          Rs {Number(data.equity.ownerCapital).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Retained Earnings / Accumulated Profit</span>
                        <span className="font-mono font-semibold">
                          Rs {Number(data.equity.retainedEarnings).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-dashed border-slate-200">
                        <span>Total Owners Equity:</span>
                        <span className="font-mono">
                          Rs {Number(data.equity.totalEquity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border-t-2 border-emerald-600 px-4 py-2.5 font-extrabold text-sm flex justify-between text-emerald-950">
                  <span className="uppercase tracking-wider">TOTAL LIAB & EQUITY:</span>
                  <span className="font-mono">
                    Rs {(Number(data.liabilities.totalLiabilities) + Number(data.equity.totalEquity)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-[#718078] pt-2">
          <span>AL ARAB RICE TRADERS - Professional ERP Balance Sheet</span>
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
