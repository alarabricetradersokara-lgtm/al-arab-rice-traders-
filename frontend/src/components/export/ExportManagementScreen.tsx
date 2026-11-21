import React, { useState, useEffect } from 'react';
import {
  Globe,
  Ship,
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  FileText,
  Building2,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Anchor,
  Layers,
} from 'lucide-react';
import { advancedService } from '../../services/advanced.service';
import { inventoryService } from '../../services/inventory.service';
import { accountingService } from '../../services/accounting.service';
import { ExportCustomer, ExportInvoice, ExportPayment } from '../../types/advanced';
import { RiceProduct, Warehouse } from '../../types/inventory';
import { BankAccount } from '../../types/accounting';
import { ExportCustomerModal } from './ExportCustomerModal';
import { ExportInvoiceModal } from './ExportInvoiceModal';
import { ExportPaymentModal } from './ExportPaymentModal';

export const ExportManagementScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'customers' | 'payments'>('invoices');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [customers, setCustomers] = useState<ExportCustomer[]>([]);
  const [totalReceivableFcy, setTotalReceivableFcy] = useState('0.00');
  const [totalReceivablePkr, setTotalReceivablePkr] = useState('0.00');
  const [invoices, setInvoices] = useState<ExportInvoice[]>([]);
  const [payments, setPayments] = useState<ExportPayment[]>([]);

  // Metadata for modals
  const [products, setProducts] = useState<RiceProduct[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [custRes, invList, payList, prodList, whList, bankList] = await Promise.all([
        advancedService.getExportCustomers(),
        advancedService.getExportInvoices(),
        advancedService.getExportPayments(),
        inventoryService.getProducts(),
        inventoryService.getWarehouses(),
        accountingService.getBankAccounts(),
      ]);

      setCustomers(custRes.customers || []);
      setTotalReceivableFcy(custRes.totalReceivableFcy || '0.00');
      setTotalReceivablePkr(custRes.totalReceivablePkr || '0.00');
      setInvoices(invList || []);
      setPayments(payList || []);
      setProducts(prodList || []);
      setWarehouses(whList || []);
      setBankAccounts(bankList || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load export data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCustomer = async (data: any) => {
    await advancedService.createExportCustomer(data);
    await loadData();
  };

  const handleCreateInvoice = async (data: any) => {
    await advancedService.createExportInvoice(data);
    await loadData();
  };

  const handleCreatePayment = async (data: any) => {
    await advancedService.createExportPayment(data);
    await loadData();
  };

  // Calculations for KPIs
  const totalInvoicedFcy = invoices.reduce((acc, inv) => acc + Number(inv.totalFcyAmount || 0), 0);
  const totalInvoicedPkr = invoices.reduce((acc, inv) => acc + Number(inv.totalPkrAmount || 0), 0);
  const activeShipments = invoices.filter((i) => i.status === 'SHIPPED' || i.status === 'CONFIRMED').length;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.exportCustomer?.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.contractNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.containerNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E4EAE5] shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-[#087A55]/10 text-[#087A55] rounded-xl">
              <Globe className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-[#172B25]">International Rice Export Management</h1>
              <p className="text-xs text-[#718078]">
                Export Contracts, Multi-Currency Invoicing, Shipping Logistics, Container Tracking & FX Settlement
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-[#087A55] bg-[#087A55]/10 hover:bg-[#087A55]/20 rounded-xl transition-all flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Buyer
          </button>
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#087A55] hover:bg-[#064E3B] rounded-xl shadow-xs transition-all flex items-center"
          >
            <Ship className="w-4 h-4 mr-1.5" />
            Create Export Invoice
          </button>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#172B25] hover:bg-black rounded-xl shadow-xs transition-all flex items-center"
          >
            <DollarSign className="w-4 h-4 mr-1.5" />
            Record Remittance
          </button>
          <button
            onClick={loadData}
            className="p-2 text-[#718078] hover:text-[#172B25] hover:bg-gray-100 rounded-xl transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center text-sm">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E4EAE5] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#718078] mb-1">
            <span>Global Buyers</span>
            <Building2 className="w-4 h-4 text-[#087A55]" />
          </div>
          <div className="text-2xl font-bold text-[#172B25]">{customers.length}</div>
          <span className="text-[11px] text-[#718078]">Across Middle East, Africa & EU</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4EAE5] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#718078] mb-1">
            <span>Active Shipments</span>
            <Anchor className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-[#172B25]">{activeShipments}</div>
          <span className="text-[11px] text-blue-600 font-medium">B/L & Container Tracking</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4EAE5] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#718078] mb-1">
            <span>Total Export Sales</span>
            <Globe className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-[#087A55]">
            USD {totalInvoicedFcy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#718078]">
            PKR {totalInvoicedPkr.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4EAE5] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#718078] mb-1">
            <span>Outstanding Export Receivables</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700">
            USD {Number(totalReceivableFcy).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#718078]">
            PKR {Number(totalReceivablePkr).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-2xl border border-[#E4EAE5] shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center border-b border-[#E4EAE5] px-5 py-3 gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'invoices'
                  ? 'bg-[#087A55] text-white shadow-xs'
                  : 'text-[#718078] hover:text-[#172B25] hover:bg-gray-100'
              }`}
            >
              Export Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'customers'
                  ? 'bg-[#087A55] text-white shadow-xs'
                  : 'text-[#718078] hover:text-[#172B25] hover:bg-gray-100'
              }`}
            >
              International Buyers ({customers.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'payments'
                  ? 'bg-[#087A55] text-white shadow-xs'
                  : 'text-[#718078] hover:text-[#172B25] hover:bg-gray-100'
              }`}
            >
              Remittance Realizations ({payments.length})
            </button>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoices, buyers, B/L..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55]"
              />
            </div>

            {activeTab === 'invoices' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-[#E4EAE5] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#087A55] bg-white text-[#172B25]"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="REALIZED">Realized</option>
              </select>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'invoices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold uppercase tracking-wider border-b border-[#E4EAE5]">
                <tr>
                  <th className="py-3 px-4">Invoice # & Date</th>
                  <th className="py-3 px-4">International Buyer</th>
                  <th className="py-3 px-4">Incoterm & Port</th>
                  <th className="py-3 px-4">Container & B/L</th>
                  <th className="py-3 px-4 text-right">FCY Total</th>
                  <th className="py-3 px-4 text-right">FX Rate & PKR Total</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EAE5]">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      No export invoices found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const outstandingFcy = Number(inv.totalFcyAmount) - Number(inv.paidFcyAmount);
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#172B25] block">{inv.invoiceNumber}</span>
                          <span className="text-[11px] text-[#718078]">
                            {new Date(inv.invoiceDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-[#172B25] block">
                            {inv.exportCustomer?.companyName}
                          </span>
                          <span className="text-[11px] text-[#718078]">{inv.exportCustomer?.country}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-[#087A55] font-bold rounded text-[10px] mr-1">
                            {inv.incoterm}
                          </span>
                          <span className="text-[11px] text-[#172B25]">
                            {inv.portOfDischarge || 'Discharge Port'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] text-[#172B25] block">
                            {inv.containerNumber || 'No Container #'}
                          </span>
                          <span className="text-[10px] text-[#718078]">B/L: {inv.blNumber || 'Pending'}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-[#087A55] text-sm">
                            {inv.currency} {Number(inv.totalFcyAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-[#718078] block">
                            {inv.items?.reduce((sum, item) => sum + Number(item.totalWeightMt || 0), 0).toFixed(2)} MT
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-[#172B25] block">
                            PKR {Number(inv.totalPkrAmount).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                          </span>
                          <span className="text-[10px] text-[#718078]">
                            @ {Number(inv.exchangeRate).toFixed(2)} PKR
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-semibold text-xs ${
                              outstandingFcy > 0.01 ? 'text-[#DC5050]' : 'text-emerald-600'
                            }`}
                          >
                            {inv.currency} {outstandingFcy.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              inv.status === 'REALIZED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'SHIPPED'
                                ? 'bg-blue-100 text-blue-800'
                                : inv.status === 'CONFIRMED'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold uppercase tracking-wider border-b border-[#E4EAE5]">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Country & Port</th>
                  <th className="py-3 px-4">Contact Person & Email</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4 text-right">Receivable (FCY)</th>
                  <th className="py-3 px-4 text-right">Receivable (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EAE5]">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No export buyers registered yet.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-[#718078]">{cust.customerCode}</td>
                      <td className="py-3 px-4 font-semibold text-[#172B25]">{cust.companyName}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#172B25] block">{cust.country}</span>
                        <span className="text-[11px] text-[#718078]">{cust.destinationPort || 'Standard Port'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[#172B25] block">{cust.contactPerson || '-'}</span>
                        <span className="text-[11px] text-[#718078]">{cust.email || cust.phone || '-'}</span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#718078] max-w-xs truncate">
                        {cust.paymentTerms || 'L/C at sight'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700">
                        {cust.preferredCurrency}{' '}
                        {Number(cust.currentReceivableFcy).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[#172B25]">
                        PKR {Number(cust.currentReceivablePkr).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold uppercase tracking-wider border-b border-[#E4EAE5]">
                <tr>
                  <th className="py-3 px-4">Payment # & Date</th>
                  <th className="py-3 px-4">Invoice # & Buyer</th>
                  <th className="py-3 px-4 text-right">Remitted FCY</th>
                  <th className="py-3 px-4 text-right">Realized Rate</th>
                  <th className="py-3 px-4 text-right">Gross PKR</th>
                  <th className="py-3 px-4 text-right">Bank Charges</th>
                  <th className="py-3 px-4 text-right">FX Gain / Loss</th>
                  <th className="py-3 px-4">Settlement Bank & SWIFT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EAE5]">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      No export remittance receipts recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((pay) => {
                    const fxVal = Number(pay.exchangeGainLossPkr || 0);
                    return (
                      <tr key={pay.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#172B25] block">{pay.paymentNumber}</span>
                          <span className="text-[11px] text-[#718078]">
                            {new Date(pay.realizationDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-[#172B25] block">
                            {pay.exportInvoice?.invoiceNumber || 'Export Inv'}
                          </span>
                          <span className="text-[11px] text-[#718078]">{pay.exportCustomer?.companyName}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#087A55]">
                          {pay.currency} {Number(pay.amountFcy).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-[#172B25]">
                          {Number(pay.realizedExchangeRate).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-[#172B25]">
                          PKR {Number(pay.amountPkr).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600">
                          - PKR {Number(pay.bankChargesPkr).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center font-bold ${
                              fxVal >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {fxVal >= 0 ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {fxVal >= 0 ? '+' : ''}PKR {fxVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-[#172B25] block">
                            {pay.bankAccount?.bankName || 'Bank'}
                          </span>
                          <span className="text-[10px] text-[#718078] font-mono">
                            Ref: {pay.bankRefNo || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ExportCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={handleCreateCustomer}
      />

      <ExportInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSubmit={handleCreateInvoice}
        customers={customers}
        products={products}
        warehouses={warehouses}
      />

      <ExportPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handleCreatePayment}
        invoices={invoices}
        bankAccounts={bankAccounts}
      />
    </div>
  );
};
