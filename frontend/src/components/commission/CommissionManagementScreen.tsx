import React, { useState, useEffect } from 'react';
import {
  CommissionAgent,
  CommissionTransaction,
  CommissionPayment,
} from '../../types/advanced';
import { CashAccount, BankAccount } from '../../types/accounting';
import { advancedService } from '../../services/advanced.service';
import { accountingService } from '../../services/accounting.service';
import { CommissionAgentModal } from './CommissionAgentModal';
import { CommissionAccrualModal } from './CommissionAccrualModal';
import { CommissionPaymentModal } from './CommissionPaymentModal';
import { AgentStatementModal } from './AgentStatementModal';
import {
  Users,
  Plus,
  RefreshCw,
  Search,
  DollarSign,
  FileText,
  CreditCard,
  Building,
  TrendingUp,
} from 'lucide-react';

export const CommissionManagementScreen: React.FC = () => {
  const [agents, setAgents] = useState<CommissionAgent[]>([]);
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]);
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [totalPayable, setTotalPayable] = useState('0.00');
  const [loading, setLoading] = useState(true);

  // Accounts for payments
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'AGENTS' | 'TRANSACTIONS' | 'PAYMENTS'>('AGENTS');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isAccrualModalOpen, setIsAccrualModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedAgentIdForStatement, setSelectedAgentIdForStatement] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [agentRes, txRes, payRes, cashRes, bankRes] = await Promise.all([
        advancedService.getCommissionAgents({ search: searchTerm }),
        advancedService.getCommissionTransactions(),
        advancedService.getCommissionPayments(),
        accountingService.getCashAccounts(),
        accountingService.getBankAccounts(),
      ]);
      setAgents(agentRes.agents);
      setTotalPayable(agentRes.totalPayable);
      setTransactions(txRes);
      setPayments(payRes);
      setCashAccounts(cashRes);
      setBankAccounts(bankRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm]);

  const handleCreateAgent = async (data: any) => {
    await advancedService.createCommissionAgent(data);
    await loadData();
  };

  const handleCreateAccrual = async (data: any) => {
    await advancedService.createCommissionTransaction(data);
    await loadData();
  };

  const handleCreatePayment = async (data: any) => {
    await advancedService.createCommissionPayment(data);
    await loadData();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[#172B25] tracking-tight">
              Commission & Brokerage Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Arthi & Broker Khata
            </span>
          </div>
          <p className="text-xs text-[#718078] mt-1">
            Broker profiles, percentage/bag commissions on trades, disbursements from cash/bank, and running statements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAccrualModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#087A55] hover:bg-[#064E3B] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Accrue Commission
          </button>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            Disburse Payment
          </button>
          <button
            onClick={() => setIsAgentModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Broker
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Brokers</span>
          <p className="text-xl font-extrabold text-[#172B25] mt-2">{agents.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Grain market & mandi brokers</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Commission Accrued</span>
          <p className="text-xl font-extrabold text-emerald-800 mt-2">
            Rs {transactions.reduce((acc, t) => acc + Number(t.commissionAmount), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Across {transactions.length} trade transactions</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Paid Out</span>
          <p className="text-xl font-extrabold text-blue-800 mt-2">
            Rs {payments.reduce((acc, p) => acc + Number(p.amount), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Across {payments.length} vouchers</p>
        </div>

        <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 shadow-xs">
          <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">Total Balance Payable</span>
          <p className="text-xl font-extrabold text-purple-950 mt-2">
            Rs {Number(totalPayable).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-purple-700 mt-0.5">Outstanding broker liabilities</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-[#E4EAE5] shadow-xs overflow-hidden">
        <div className="flex border-b border-[#E4EAE5] bg-[#F5F7F5] px-4 pt-2">
          <button
            onClick={() => setActiveTab('AGENTS')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'AGENTS'
                ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-[#718078] hover:text-[#172B25]'
            }`}
          >
            Broker Profiles & Khata ({agents.length})
          </button>
          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'TRANSACTIONS'
                ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-[#718078] hover:text-[#172B25]'
            }`}
          >
            Accrued Commissions ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'PAYMENTS'
                ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-[#718078] hover:text-[#172B25]'
            }`}
          >
            Payment Disbursements ({payments.length})
          </button>
        </div>

        {/* Tab 1: Broker Profiles */}
        {activeTab === 'AGENTS' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 max-w-sm">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search broker by name, city or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E4EAE5] rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[#172B25] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-24">Code</th>
                    <th className="py-2.5 px-3">Broker Name</th>
                    <th className="py-2.5 px-3 w-32">Phone</th>
                    <th className="py-2.5 px-3 w-36">Mandi / Market</th>
                    <th className="py-2.5 px-3 w-32">Commission Rate</th>
                    <th className="py-2.5 px-3 w-32 text-right">Balance Payable (Rs)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">Loading brokers...</td>
                    </tr>
                  ) : agents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No brokers registered yet.</td>
                    </tr>
                  ) : (
                    agents.map((ag) => (
                      <tr key={ag.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{ag.code}</td>
                        <td className="py-2.5 px-3 font-bold text-[#172B25]">{ag.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{ag.phone || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{ag.mandiCity || 'Local'}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                            {ag.defaultRate} ({ag.commissionType})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-900">
                          Rs {Number(ag.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setSelectedAgentIdForStatement(ag.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            View Khata
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Accrued Commissions */}
        {activeTab === 'TRANSACTIONS' && (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[#172B25] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-28">Ref #</th>
                    <th className="py-2.5 px-3 w-24">Date</th>
                    <th className="py-2.5 px-3">Broker</th>
                    <th className="py-2.5 px-3 w-28">Trade Ref</th>
                    <th className="py-2.5 px-3 w-28 text-right">Base Amount</th>
                    <th className="py-2.5 px-3 w-28">Rate Applied</th>
                    <th className="py-2.5 px-3 w-28 text-right">Commission (Rs)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{tx.transactionNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {new Date(tx.transactionDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#172B25]">{tx.agent?.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">[{tx.referenceType}] {tx.referenceNo}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        Rs {Number(tx.baseAmount).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {tx.rateValue} ({tx.rateType})
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                        Rs {Number(tx.commissionAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Payment Disbursements */}
        {activeTab === 'PAYMENTS' && (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[#172B25] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-28">Payment #</th>
                    <th className="py-2.5 px-3 w-24">Date</th>
                    <th className="py-2.5 px-3">Broker</th>
                    <th className="py-2.5 px-3 w-36">Payment Source</th>
                    <th className="py-2.5 px-3 w-28">Voucher Ref</th>
                    <th className="py-2.5 px-3 w-28 text-right">Amount (Rs)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{p.paymentNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {new Date(p.paymentDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#172B25]">{p.agent?.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {p.paymentMethod === 'CASH'
                          ? `💵 ${p.cashAccount?.name || 'Cash'}`
                          : `🏦 ${p.bankAccount?.bankName || 'Bank'}`}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{p.referenceNumber || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-800">
                        Rs {Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CommissionAgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        onSubmit={handleCreateAgent}
      />

      <CommissionAccrualModal
        isOpen={isAccrualModalOpen}
        onClose={() => setIsAccrualModalOpen(false)}
        onSubmit={handleCreateAccrual}
        agents={agents}
      />

      <CommissionPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handleCreatePayment}
        agents={agents}
        cashAccounts={cashAccounts}
        bankAccounts={bankAccounts}
      />

      {selectedAgentIdForStatement && (
        <AgentStatementModal
          isOpen={!!selectedAgentIdForStatement}
          onClose={() => setSelectedAgentIdForStatement(null)}
          agentId={selectedAgentIdForStatement}
        />
      )}
    </div>
  );
};
