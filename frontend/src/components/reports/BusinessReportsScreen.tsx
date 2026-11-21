import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Package,
  Truck,
  Users,
  Building2,
  Boxes,
  Layers,
  ArrowRight,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { reportsService } from '../../services/reports.service';
import { ReportType, ReportFilterParams, ReportResponse } from '../../types/reports';
import { exportToExcel, printReportDocument } from '../../utils/exportUtils';

export const BusinessReportsScreen: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('daily-sales');
  const [filter, setFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const reportList: { id: ReportType; title: string; category: string }[] = [
    { id: 'daily-sales', title: 'Daily Sales Report', category: 'Sales & Revenue' },
    { id: 'daily-closing', title: 'Daily Closing Register', category: 'Sales & Revenue' },
    { id: 'monthly-sales', title: 'Monthly Sales Report', category: 'Sales & Revenue' },
    { id: 'purchases', title: 'Procurement & Purchases', category: 'Procurement' },
    { id: 'profit-loss', title: 'Profit & Loss Statement', category: 'Financials' },
    { id: 'stock-valuation', title: 'Stock Valuation Report', category: 'Inventory' },
    { id: 'stock-ledger', title: 'Stock Movement Ledger', category: 'Inventory' },
    { id: 'customer-outstanding', title: 'Customer Outstanding (AR)', category: 'Parties' },
    { id: 'supplier-outstanding', title: 'Supplier Outstanding (AP)', category: 'Parties' },
    { id: 'expenses', title: 'Operational Expenses', category: 'Financials' },
    { id: 'commission', title: 'Commission & Brokerage', category: 'Commercial' },
    { id: 'warehouses', title: 'Warehouse Utilization', category: 'Logistics' },
  ];

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: ReportFilterParams = {
        filter,
        startDate: customStart || undefined,
        endDate: customEnd || undefined,
      };

      let res: any;
      switch (activeReport) {
        case 'daily-sales':
          res = await reportsService.getDailySales(params);
          break;
        case 'daily-closing':
          res = await reportsService.getDailyClosing(params);
          break;
        case 'monthly-sales':
          res = await reportsService.getMonthlySales(params);
          break;
        case 'purchases':
          res = await reportsService.getPurchases(params);
          break;
        case 'profit-loss':
          res = await reportsService.getProfitLoss(params);
          break;
        case 'stock-valuation':
          res = await reportsService.getStockValuation(params);
          break;
        case 'stock-ledger':
          res = await reportsService.getStockLedger(params);
          break;
        case 'customer-outstanding':
          res = await reportsService.getCustomerOutstanding(params);
          break;
        case 'supplier-outstanding':
          res = await reportsService.getSupplierOutstanding(params);
          break;
        case 'expenses':
          res = await reportsService.getExpenses(params);
          break;
        case 'commission':
          res = await reportsService.getCommission(params);
          break;
        case 'warehouses':
          res = await reportsService.getWarehouseReports(params);
          break;
      }

      setReportData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, filter]);

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      setFilter('custom');
      fetchReport();
    }
  };

  const currentReportDef = reportList.find((r) => r.id === activeReport);

  const handleExportExcel = () => {
    if (!reportData) return;
    const rows = reportData.rows || [];
    if (rows.length === 0) {
      alert('No rows available to export.');
      return;
    }
    exportToExcel(rows, activeReport);
  };

  const handlePrint = () => {
    if (!reportData) return;
    const rows = reportData.rows || [];
    if (rows.length === 0 && !reportData.netProfit) {
      alert('No report data to print.');
      return;
    }

    let tableHtml = '';
    if (activeReport === 'profit-loss') {
      tableHtml = `
        <h3>Revenue</h3>
        <p>Domestic Sales: PKR ${Number(reportData.revenue?.domesticSales || 0).toLocaleString()}</p>
        <p>Export Sales: PKR ${Number(reportData.revenue?.exportSales || 0).toLocaleString()}</p>
        <p><strong>Total Sales Revenue: PKR ${Number(reportData.revenue?.totalRevenue || 0).toLocaleString()}</strong></p>
        <hr/>
        <h3>Cost of Goods Sold (COGS)</h3>
        <p>Total COGS: PKR ${Number(reportData.cogs?.totalCogs || 0).toLocaleString()}</p>
        <p><strong>Gross Profit: PKR ${Number(reportData.cogs?.grossProfit || 0).toLocaleString()} (${reportData.cogs?.grossMarginPct}%)</strong></p>
        <hr/>
        <h3>Operating Expenses</h3>
        <p>Total Operating Expenses: PKR ${Number(reportData.expenses?.totalExpenses || 0).toLocaleString()}</p>
        <hr/>
        <h2 style="color: #087A55;">Net Profit: PKR ${Number(reportData.netProfit?.amount || 0).toLocaleString()} (${reportData.netProfit?.netMarginPct}%)</h2>
      `;
    } else {
      const headers = Object.keys(rows[0] || {});
      tableHtml = `
        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #F5F7F5;">
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r: any) =>
                  `<tr>${headers
                    .map((h) => `<td>${r[h] !== null && r[h] !== undefined ? r[h] : ''}</td>`)
                    .join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>
      `;
    }

    printReportDocument(currentReportDef?.title || 'Business Intelligence Report', tableHtml);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E4EAE5] shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-[#087A55]/10 text-[#087A55] rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-[#172B25]">
                {currentReportDef?.title || 'Business Reports & Statements'}
              </h1>
              <p className="text-xs text-[#718078]">
                Audited Management Reports, Double-Entry General Ledger Financials & Excel/PDF Exports
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Presets */}
          <div className="flex items-center bg-[#F5F7F5] p-1 rounded-xl border border-[#E4EAE5]">
            {(['today', 'yesterday', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  filter === t
                    ? 'bg-[#087A55] text-white shadow-xs'
                    : 'text-[#718078] hover:text-[#172B25]'
                }`}
              >
                {t === 'week' ? 'This Week' : t === 'month' ? 'This Month' : t}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {filter === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 text-xs border border-[#E4EAE5] rounded-lg bg-white"
              />
              <span className="text-xs text-[#718078]">&rarr;</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 text-xs border border-[#E4EAE5] rounded-lg bg-white"
              />
              <button
                onClick={handleApplyCustom}
                className="px-2.5 py-1 text-xs bg-[#087A55] text-white rounded-lg font-medium"
              >
                Apply
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 text-xs font-semibold text-[#087A55] bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-all flex items-center"
              title="Download Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Excel Export
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-[#172B25] bg-[#F5F7F5] hover:bg-gray-200 rounded-xl border border-[#E4EAE5] transition-all flex items-center"
              title="Print to PDF"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print / PDF
            </button>
            <button
              onClick={fetchReport}
              className="p-2 text-[#718078] hover:text-[#172B25] hover:bg-gray-100 rounded-xl border border-[#E4EAE5] transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center text-sm">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 12 Reports Switcher Grid */}
      <div className="bg-white p-4 rounded-2xl border border-[#E4EAE5] shadow-xs">
        <span className="text-[10px] font-bold text-[#718078] uppercase tracking-wider block mb-2.5">
          Select Business Intelligence Report
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {reportList.map((r) => {
            const isSelected = activeReport === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setActiveReport(r.id)}
                className={`p-2.5 text-left rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-[#087A55] text-white border-[#087A55] shadow-xs'
                    : 'bg-[#F5F7F5] text-[#172B25] border-[#E4EAE5] hover:bg-white hover:border-[#087A55]/40'
                }`}
              >
                <span className="block font-semibold text-xs leading-tight">{r.title}</span>
                <span
                  className={`text-[10px] block mt-1 ${
                    isSelected ? 'text-emerald-100' : 'text-[#718078]'
                  }`}
                >
                  {r.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary KPI Cards for Active Report (if summary exists) */}
      {reportData?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(reportData.summary).map(([key, val]: any) => (
            <div key={key} className="bg-white p-3.5 rounded-xl border border-[#E4EAE5] shadow-xs">
              <span className="text-[10px] text-[#718078] uppercase tracking-wider block font-semibold truncate">
                {key.replace(/([A-Z])/g, ' $1')}
              </span>
              <span className="text-base font-bold text-[#172B25] block mt-0.5 truncate">
                {typeof val === 'number'
                  ? val.toLocaleString()
                  : isNaN(Number(val))
                  ? val
                  : Number(val).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Report Data Container */}
      <div className="bg-white rounded-2xl border border-[#E4EAE5] shadow-xs overflow-hidden">
        {/* Special P&L Presentation */}
        {activeReport === 'profit-loss' && reportData && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-xs text-[#718078] block font-semibold">Total Sales Revenue</span>
                <span className="text-2xl font-bold text-[#087A55] block mt-1">
                  PKR {Number(reportData.revenue?.totalRevenue || 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-[#718078]">
                  Domestic: PKR {Number(reportData.revenue?.domesticSales || 0).toLocaleString()} | Export: PKR{' '}
                  {Number(reportData.revenue?.exportSales || 0).toLocaleString()}
                </span>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-xs text-[#718078] block font-semibold">Cost of Goods Sold (COGS)</span>
                <span className="text-2xl font-bold text-blue-700 block mt-1">
                  PKR {Number(reportData.cogs?.totalCogs || 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-[#087A55] font-semibold">
                  Gross Profit: PKR {Number(reportData.cogs?.grossProfit || 0).toLocaleString()} ({reportData.cogs?.grossMarginPct}%)
                </span>
              </div>

              <div className="p-4 bg-[#172B25] text-white rounded-xl">
                <span className="text-xs text-gray-300 block font-semibold">Net Business Profit</span>
                <span className="text-2xl font-bold text-emerald-400 block mt-1">
                  PKR {Number(reportData.netProfit?.amount || 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-gray-300">
                  Net Margin: {reportData.netProfit?.netMarginPct}% | Expenses: PKR {Number(reportData.expenses?.totalExpenses || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Operating Expenses Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-[#172B25] uppercase tracking-wider mb-3">
                Operating Expenses Breakdown
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {reportData.expenses?.breakdown?.map((b: any) => (
                  <div key={b.category} className="p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5]">
                    <span className="text-[11px] text-[#718078] block font-medium">{b.category}</span>
                    <span className="text-sm font-bold text-[#172B25] block mt-0.5">
                      PKR {Number(b.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Standard Tabular Data Report */}
        {activeReport !== 'profit-loss' && reportData?.rows && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold uppercase tracking-wider border-b border-[#E4EAE5]">
                <tr>
                  {Object.keys(reportData.rows[0] || {})
                    .filter((col) => col !== 'id')
                    .map((col) => (
                      <th key={col} className="py-3 px-4 whitespace-nowrap">
                        {col.replace(/([A-Z])/g, ' $1').toUpperCase()}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EAE5]">
                {reportData.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Object.keys(reportData.rows[0] || {}).length || 5}
                      className="py-12 text-center text-gray-400"
                    >
                      No records found for the selected reporting period.
                    </td>
                  </tr>
                ) : (
                  reportData.rows.map((row: any, idx: number) => (
                    <tr key={row.id || idx} className="hover:bg-gray-50/80 transition-colors">
                      {Object.entries(row)
                        .filter(([k]) => k !== 'id')
                        .map(([k, val]: any, colIdx) => {
                          const isNumeric =
                            typeof val === 'number' || (!isNaN(Number(val)) && typeof val === 'string' && val.trim() !== '');
                          return (
                            <td
                              key={colIdx}
                              className={`py-3 px-4 whitespace-nowrap ${
                                isNumeric && k.toLowerCase().includes('amount')
                                  ? 'text-right font-bold text-[#087A55]'
                                  : isNumeric && k.toLowerCase().includes('balance')
                                  ? 'text-right font-bold text-amber-700'
                                  : isNumeric
                                  ? 'text-right font-medium text-[#172B25]'
                                  : 'text-[#172B25]'
                              }`}
                            >
                              {val !== null && val !== undefined ? String(val) : '-'}
                            </td>
                          );
                        })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
