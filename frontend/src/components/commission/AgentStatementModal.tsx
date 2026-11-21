import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { AgentStatement } from '../../types/advanced';
import { advancedService } from '../../services/advanced.service';
import { Printer, RefreshCw } from 'lucide-react';

interface AgentStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
}

export const AgentStatementModal: React.FC<AgentStatementModalProps> = ({
  isOpen,
  onClose,
  agentId,
}) => {
  const [data, setData] = useState<AgentStatement | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!agentId) return;
    try {
      setLoading(true);
      const res = await advancedService.getAgentStatement(agentId);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && agentId) {
      loadData();
    }
  }, [isOpen, agentId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Broker Commission Statement (Khata)"
      subtitle={data ? `${data.agent.name} (${data.agent.mandiCity || 'Local Market'})` : 'Broker Statement'}
      maxWidth="3xl"
    >
      <div className="p-6 space-y-4">
        {/* Actions */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4EAE5]">
          <div className="text-xs text-[#718078]">
            Rate: <span className="font-bold text-[#172B25]">{data?.agent.defaultRate} ({data?.agent.commissionType})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Khata
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 rounded-lg border border-[#E4EAE5] text-[#718078] hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary Badges */}
        {data && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-800 uppercase">Total Accrued (Earned)</span>
              <p className="text-base font-extrabold text-emerald-900 mt-0.5">
                Rs {Number(data.totalAccruedCommission).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
              <span className="text-[10px] font-bold text-blue-800 uppercase">Total Paid (Disbursed)</span>
              <p className="text-base font-extrabold text-blue-900 mt-0.5">
                Rs {Number(data.totalPaidCommission).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-slate-900 text-white rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Balance Payable</span>
              <p className="text-base font-extrabold text-amber-400 mt-0.5">
                Rs {Number(data.closingBalancePayable).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        {/* Statement Table */}
        <div className="border border-[#E4EAE5] rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#087A55] text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-24">Date</th>
                <th className="py-2.5 px-3 w-28">Voucher / Ref</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 w-28 text-right">Debit / Paid (Rs)</th>
                <th className="py-2.5 px-3 w-28 text-right">Credit / Accrued (Rs)</th>
                <th className="py-2.5 px-3 w-28 text-right">Balance (Rs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAE5]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading agent statement...
                  </td>
                </tr>
              ) : !data || data.statement.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No transactions recorded for this broker.
                  </td>
                </tr>
              ) : (
                data.statement.map((s, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2 px-3 text-slate-600">
                      {new Date(s.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{s.ref}</td>
                    <td className="py-2 px-3 font-medium text-[#172B25]">{s.description}</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-blue-700">
                      {Number(s.debit) > 0 ? Number(s.debit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-800">
                      {Number(s.credit) > 0 ? Number(s.credit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      Rs {Number(s.runningBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
