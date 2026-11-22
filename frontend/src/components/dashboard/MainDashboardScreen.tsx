import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Building2,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Printer,
  Download,
  Boxes,
  ArrowRight,
  CheckCircle2,
  Wallet,
  Clock,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { dashboardService } from '../../services/dashboard.service';
import {
  DashboardKpi,
  DashboardPeriodInfo,
  DashboardChartsData,
  DashboardRecentData,
} from '../../types/dashboard';
import { exportToExcel, printReportDocument } from '../../utils/exportUtils';
import { ensureAuthenticated } from '../../services/api';

export const MainDashboardScreen: React.FC = () => {
  const [filter, setFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpi, setKpi] = useState<DashboardKpi | null>(null);
  const [period, setPeriod] = useState<DashboardPeriodInfo | null>(null);
  const [charts, setCharts] = useState<DashboardChartsData | null>(null);
  const [recent, setRecent] = useState<DashboardRecentData | null>(null);

  const [activeTableTab, setActiveTableTab] = useState<
    'sales' | 'purchases' | 'customers' | 'suppliers' | 'lowStock' | 'payments'
  >('sales');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure valid JWT before fetching stats
      await ensureAuthenticated();

      const [statsRes, chartsRes, recentRes] = await Promise.all([
        dashboardService.getStats({
          filter,
          startDate: customStart || undefined,
          endDate: customEnd || undefined,
        }),
        dashboardService.getCharts(14),
        dashboardService.getRecent(),
      ]);

      setKpi(statsRes.kpi);
      setPeriod(statsRes.period);
      setCharts(chartsRes);
      setRecent(recentRes);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        try {
          await ensureAuthenticated(true);
          const [statsRes, chartsRes, recentRes] = await Promise.all([
            dashboardService.getStats({
              filter,
              startDate: customStart || undefined,
              endDate: customEnd || undefined,
            }),
            dashboardService.getCharts(14),
            dashboardService.getRecent(),
          ]);
          setKpi(statsRes.kpi);
          setPeriod(statsRes.period);
          setCharts(chartsRes);
          setRecent(recentRes);
          return;
        } catch (retryErr: any) {
          setError(retryErr?.response?.data?.message || retryErr?.message || 'Failed to load dashboard data');
          return;
        }
      }
      setError(err?.response?.data?.message || err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [filter]);

  const handleApplyCustomFilter = () => {
    if (customStart && customEnd) {
      setFilter('custom');
      loadDashboardData();
    }
  };

  // Export current active table to Excel CSV
  const handleExportTable = () => {
    if (!recent) return;
    if (activeTableTab === 'sales') {
      exportToExcel(recent.recentSales, 'Recent_Sales');
    } else if (activeTableTab === 'purchases') {
      exportToExcel(recent.recentPurchases, 'Recent_Purchases');
    } else if (activeTableTab === 'customers') {
      exportToExcel(recent.topCustomers, 'Top_Customers');
    } else if (activeTableTab === 'suppliers') {
      exportToExcel(recent.topSuppliers, 'Top_Suppliers');
    } else if (activeTableTab === 'lowStock') {
      exportToExcel(recent.lowStockProducts, 'Low_Stock_Products');
    } else if (activeTableTab === 'payments') {
      exportToExcel(recent.recentPayments, 'Recent_Payments');
    }
  };

  const handlePrintDashboard = () => {
    if (!kpi) return;
    const content = `
      <div style="margin-bottom: 20px;">
        <h3>Business Intelligence Executive Summary (${filter.toUpperCase()})</h3>
        <table style="width: 100%; border: 1px solid #E4EAE5;">
          <tr>
            <td><strong>Today's Sales:</strong> PKR ${Number(kpi.todaySales).toLocaleString()}</td>
            <td><strong>Today's Purchases:</strong> PKR ${Number(kpi.todayPurchases).toLocaleString()}</td>
            <td><strong>Today's Gross Profit:</strong> PKR ${Number(kpi.todayGrossProfit).toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Monthly Sales:</strong> PKR ${Number(kpi.monthlySales).toLocaleString()}</td>
            <td><strong>Monthly Net Profit:</strong> PKR ${Number(kpi.monthlyProfit).toLocaleString()}</td>
            <td><strong>Total Stock Value:</strong> PKR ${Number(kpi.totalStockValue).toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Cash in Hand:</strong> PKR ${Number(kpi.cashInHand).toLocaleString()}</td>
            <td><strong>Bank Balance:</strong> PKR ${Number(kpi.bankBalance).toLocaleString()}</td>
            <td><strong>Total Liquid Funds:</strong> PKR ${Number(kpi.totalLiquidFunds).toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Customer Receivables:</strong> PKR ${Number(kpi.customerReceivables).toLocaleString()}</td>
            <td><strong>Supplier Payables:</strong> PKR ${Number(kpi.supplierPayables).toLocaleString()}</td>
            <td><strong>Total Stock Bags:</strong> ${kpi.totalStockQuantityBags.toLocaleString()} Bags (${Number(kpi.totalStockQuantityMaunds).toLocaleString()} Maunds)</td>
          </tr>
        </table>
      </div>
    `;
    printReportDocument('Executive BI Dashboard Summary', content);
  };

  // Modern Cohesive Color Palette for Charts
  const COLORS = ['#0F766E', '#0284C7', '#6366F1', '#F59E0B', '#10B981', '#64748B', '#F43F5E'];

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">کاروباری ڈیش بورڈ</h1>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Overview Dashboard</span>
              </div>
              <p className="text-xs text-slate-500">
                العرب رائز ٹریڈرز کا مجموعی مالی و کاروباری خلاصہ
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center bg-[#F5F7F5] p-1 rounded-xl border border-[#E4EAE5] overflow-x-auto max-w-full">
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
                onClick={handleApplyCustomFilter}
                className="px-2.5 py-1 text-xs bg-[#087A55] text-white rounded-lg font-medium"
              >
                Apply
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <button
              onClick={handlePrintDashboard}
              className="p-2 text-[#718078] hover:text-[#087A55] hover:bg-emerald-50 rounded-xl border border-[#E4EAE5] transition-all"
              title="Print / Save as PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportTable}
              className="p-2 text-[#718078] hover:text-[#087A55] hover:bg-emerald-50 rounded-xl border border-[#E4EAE5] transition-all"
              title="Export Current Table to Excel"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={loadDashboardData}
              className="p-2 text-[#718078] hover:text-[#172B25] hover:bg-gray-100 rounded-xl border border-[#E4EAE5] transition-all"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center text-sm">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 11 Primary KPI Metrics Grid */}
      {kpi && (
        <div className="space-y-4">
          {/* Row 1: Core Daily & Monthly Trading KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Today's Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 text-sm">آج کی فروخت</span>
                  <span className="text-[10px] font-medium text-slate-400">Today's Sales</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono-num">
                PKR {Number(kpi.todaySales).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-emerald-700 font-medium">{kpi.todaySalesBags} بوریاں فروخت</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-800 rounded font-semibold">مال بکا</span>
              </div>
            </div>

            {/* 2. Today's Purchases */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 text-sm">آج کی خریداریاں</span>
                  <span className="text-[10px] font-medium text-slate-400">Today's Purchases</span>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono-num">
                PKR {Number(kpi.todayPurchases).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-blue-700 font-medium">{kpi.todayPurchaseBags} بوریاں موصول</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-800 rounded font-semibold">مال آیا</span>
              </div>
            </div>

            {/* 3. Today's Gross Profit */}
            <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <span className="font-bold text-emerald-900 text-sm">آج کا منافع</span>
                  <span className="text-[10px] font-medium text-emerald-600">Today's Gross Profit</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-emerald-900 font-mono-num">
                PKR {Number(kpi.todayGrossProfit).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-100 text-[11px]">
                <span className="text-emerald-800 font-medium">خام مارجن بعد از لاگت</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded font-semibold">منافع</span>
              </div>
            </div>

            {/* 4. Cash in Hand (Galla) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 text-sm">نقد گلہ</span>
                  <span className="text-[10px] font-medium text-slate-400">Cash in Hand</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono-num">
                PKR {Number(kpi.cashInHand).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500">کاؤنٹر کیش</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-semibold">سیف بیلنس</span>
              </div>
            </div>

            {/* 5. Total Stock Value */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 text-sm">کل سٹاک مالیت</span>
                  <span className="text-[10px] font-medium text-slate-400">Total Stock Value</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono-num">
                PKR {Number(kpi.totalStockValue).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500">{kpi.totalStockQuantityBags.toLocaleString()} بوریاں</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-semibold">موجود مال</span>
              </div>
            </div>
          </div>

          {/* Row 2: Khata Highlight Row: لینا ہے (Receivables) vs دینا ہے (Payables) & Bank */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 6. Customer Receivables (لینے ہیں) */}
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span className="text-xs font-bold text-emerald-900">آپ نے لینے ہیں</span>
                  <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">· Receivables</span>
                </div>
                <div className="text-2xl font-extrabold text-emerald-950 font-mono-num">
                  PKR {Number(kpi.customerReceivables).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </div>
                <span className="text-[11px] text-emerald-800 font-medium">مارکیٹ گاہکوں کا ادھار</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 flex items-center justify-center text-emerald-800">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* 7. Supplier Payables (دینے ہیں) */}
            <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200/80 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  <span className="text-xs font-bold text-rose-900">آپ نے دینے ہیں</span>
                  <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wide">· Payables</span>
                </div>
                <div className="text-2xl font-extrabold text-rose-950 font-mono-num">
                  PKR {Number(kpi.supplierPayables).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </div>
                <span className="text-[11px] text-rose-800 font-medium">سپلائرز اور آڑھتیوں کا کھاتہ</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-rose-100/80 flex items-center justify-center text-rose-800">
                <Truck className="w-5 h-5" />
              </div>
            </div>

            {/* 8. Bank Balances */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200/80 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span className="text-xs font-bold text-blue-900">بینک بیلنس</span>
                  <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">· Bank Balance</span>
                </div>
                <div className="text-2xl font-extrabold text-blue-950 font-mono-num">
                  PKR {Number(kpi.bankBalance).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </div>
                <span className="text-[11px] text-blue-800 font-medium">میزان، ایچ بی ایل و دیگر بینک</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-100/80 flex items-center justify-center text-blue-800">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Charts Section: Profit Chart, Pie Charts, and Bar Charts */}
      {charts && (
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-bold text-slate-900">کاروباری تجزیہ و گراف</h2>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Business Analytics</span>
              </div>
              <p className="text-xs text-slate-500">
                منافع، خریداریاں بمقابلہ فروخت اور چاول کے سٹاک کی تقسیم
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200">
                مرکزی دکان - مانسہرہ · Main Shop Mansehra
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Profit Progression (Gross vs Net Profit Area Chart) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-bold text-slate-800">منافع کا رجحان</h3>
                    <span className="text-xs font-medium text-slate-400">Profit Trend</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-full ml-1">
                      منافع
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">خام منافع (فروخت منفی لاگت) بمقابلہ خالص منافع (بعد از اخراجات)</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-emerald-800 block">
                    آج کا خالص منافع: PKR {Number(kpi?.todayGrossProfit || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.dailySalesTrend}>
                    <defs>
                      <linearGradient id="grossProfitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F766E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0F766E" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="netProfitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="label" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis
                      stroke="#64748B"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => [`PKR ${Number(val).toLocaleString()}`, '']}
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: 12, border: 'none', color: '#fff', fontSize: 11 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area
                      type="monotone"
                      dataKey="grossProfit"
                      name="خام منافع · Gross Profit"
                      stroke="#0F766E"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#grossProfitGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="netProfit"
                      name="خالص منافع · Net Profit"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#netProfitGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Monthly Sales vs Purchases Bar Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-bold text-slate-800">خریداریاں بمقابلہ فروخت</h3>
                    <span className="text-xs font-medium text-slate-400">Sales vs Purchases</span>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 font-semibold rounded-full ml-1">
                      بار چارٹ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">ہر ماہ مال کتنا خریدا گیا اور کتنی فروخت ہوئی (PKR)</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-full border border-slate-200">
                  ماہانہ تقابل
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F1" />
                    <XAxis dataKey="month" stroke="#718078" fontSize={10} tickLine={false} />
                    <YAxis
                      stroke="#718078"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      formatter={(val: any) => [`PKR ${Number(val).toLocaleString()}`, '']}
                      contentStyle={{ backgroundColor: '#172B25', borderRadius: 8, color: '#fff', fontSize: 11 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="sales" name="فروخت · Sales Revenue" fill="#087A55" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="purchases" name="خریداریاں · Purchases" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Stock Variety Distribution Pie Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-bold text-slate-800">چاول کے سٹاک کی تقسیم</h3>
                    <span className="text-xs font-medium text-slate-400">Stock Varieties</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-full ml-1">
                      پائی چارٹ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">دکان میں موجود چاول کی مختلف ورائٹیز کا تناسب (بوری اور وزن)</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-full border border-slate-200">
                  سٹاک کی مقدار
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                <div className="h-64 sm:col-span-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          charts.varietyDistribution && charts.varietyDistribution.length > 0
                            ? charts.varietyDistribution
                            : charts.topProducts.map((p) => ({ name: p.name, bags: p.bags, weightKg: p.weightKg }))
                        }
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={88}
                        paddingAngle={3}
                        dataKey="weightKg"
                        nameKey="name"
                      >
                        {(charts.varietyDistribution && charts.varietyDistribution.length > 0
                          ? charts.varietyDistribution
                          : charts.topProducts
                        ).map((_, index) => (
                          <Cell key={`var-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, _name: any, item: any) => [
                          `${Number(val).toLocaleString()} Kg (${item?.payload?.bags || 0} بوریاں)`,
                          'سٹاک کا وزن',
                        ]}
                        contentStyle={{ backgroundColor: '#172B25', borderRadius: 8, color: '#fff', fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="sm:col-span-2 space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(charts.varietyDistribution && charts.varietyDistribution.length > 0
                    ? charts.varietyDistribution
                    : charts.topProducts
                  ).slice(0, 5).map((v: any, idx: number) => (
                    <div key={v.name} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex items-center space-x-1.5 truncate mr-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        <span className="font-semibold text-[#172B25] truncate">{v.name}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-[#087A55] block">{v.bags || 0} بوری</span>
                        <span className="text-[10px] text-[#718078]">{Number(v.weightKg).toLocaleString()} Kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 4: Expenses Breakdown Pie Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-bold text-slate-800">کاروباری اخراجات کی تقسیم</h3>
                    <span className="text-xs font-medium text-slate-400">Expenses Breakdown</span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 font-semibold rounded-full ml-1">
                      پائی چارٹ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">دکان کے اخراجات (پلی داری، کرایہ، بجلی، تنخواہیں وغیرہ)</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-full border border-slate-200">
                  اخراجات
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                <div className="h-64 sm:col-span-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          charts.expenseDistribution && charts.expenseDistribution.length > 0
                            ? charts.expenseDistribution
                            : [
                                { category: 'LOADING UNLOADING (پلی داری)', amount: 45000 },
                                { category: 'ELECTRICITY (بجلی کا بل)', amount: 28000 },
                                { category: 'SHOP RENT (دکان کا کرایہ)', amount: 50000 },
                                { category: 'TRANSPORTATION (ٹرانسپورٹ)', amount: 35000 },
                                { category: 'OFFICE & TEA (چائے خرچہ)', amount: 12000 },
                              ]
                        }
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={88}
                        paddingAngle={3}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {(charts.expenseDistribution && charts.expenseDistribution.length > 0
                          ? charts.expenseDistribution
                          : [1, 2, 3, 4, 5]
                        ).map((_, index) => (
                          <Cell key={`exp-cell-${index}`} fill={['#DC5050', '#E6A23C', '#3B82F6', '#8B5CF6', '#16A36A'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`PKR ${Number(val).toLocaleString()}`, 'خرچہ']}
                        contentStyle={{ backgroundColor: '#172B25', borderRadius: 8, color: '#fff', fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="sm:col-span-2 space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(charts.expenseDistribution && charts.expenseDistribution.length > 0
                    ? charts.expenseDistribution
                    : [
                        { category: 'پلی داری و لیبر', amount: 45000 },
                        { category: 'دکان کا کرایہ', amount: 50000 },
                        { category: 'ٹرانسپورٹ و گاری بھاڑہ', amount: 35000 },
                        { category: 'بجلی و فیول', amount: 28000 },
                        { category: 'چائے و متفرق خرچ', amount: 12000 },
                      ]
                  ).map((e: any, idx: number) => (
                    <div key={e.category} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex items-center space-x-1.5 truncate mr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: ['#DC5050', '#E6A23C', '#3B82F6', '#8B5CF6', '#16A36A'][idx % 5] }}
                        ></span>
                        <span className="font-semibold text-[#172B25] truncate">{e.category}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-red-600">PKR {Number(e.amount).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 5: Top Selling Rice Products (Horizontal Bar Chart) */}
            <div className="bg-white p-5 rounded-2xl border border-[#E4EAE5] shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-bold text-slate-900">سب سے زیادہ بکنے والے چاول</h3>
                    <span className="text-xs font-medium text-slate-400">Top Selling Rice Varieties</span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full ml-1">
                      بار چارٹ
                    </span>
                  </div>
                  <p className="text-[11px] text-[#718078]">آمدنی اور فروخت کی بنیاد پر چاول کی بہترین ورائٹیز</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 font-semibold rounded-full border border-amber-200">
                  ٹاپ ورائٹیز
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F1" />
                    <XAxis
                      type="number"
                      stroke="#718078"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis dataKey="name" type="category" stroke="#718078" fontSize={11} tickLine={false} width={150} />
                    <Tooltip
                      formatter={(val: any, _n: any, item: any) => [
                        `PKR ${Number(val).toLocaleString()} (${item?.payload?.bags || 0} بوریاں / ${Number(item?.payload?.weightKg || 0).toLocaleString()} Kg)`,
                        'فروخت',
                      ]}
                      contentStyle={{ backgroundColor: '#172B25', borderRadius: 8, color: '#fff', fontSize: 11 }}
                    />
                    <Bar dataKey="revenue" name="فروخت آمدن" fill="#087A55" radius={[0, 6, 6, 0]}>
                      {charts.topProducts.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6 Detailed Recent Activity & Ranked Leaderboard Tables */}
      {recent && (
        <div className="bg-white rounded-2xl border border-[#E4EAE5] shadow-xs overflow-hidden">
          {/* Table Tab Selector */}
          <div className="flex flex-col sm:flex-row justify-between items-center border-b border-[#E4EAE5] px-5 py-3 gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveTableTab('sales')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTableTab === 'sales'
                    ? 'bg-[#087A55] text-white shadow-xs'
                    : 'text-[#718078] hover:text-[#172B25] hover:bg-gray-100'
                }`}
              >
                Recent Sales ({recent.recentSales.length})
              </button>
              <button
                onClick={() => setActiveTableTab('purchases')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTableTab === 'purchases'
                    ? 'bg-[#087A55] text-white shadow-xs'
                    : 'text-[#718078] hover:text-[#172B25] hover:bg-gray-100'
                }`}
              >
                Recent Purchases ({recent.recentPurchases.length})
              </button>
              <button
                onClick={() => setActiveTableTab('customers')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTableTab === 'customers'
                    ? 'bg-[#087A55] text-white shadow-xs'
                    : 'text-[#718078] hover:text-[#172B25] hover:bg-gray-100'
                }`}
              >
                Top Customers ({recent.topCustomers.length})
              </button>
              <button
                onClick={() => setActiveTableTab('suppliers')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTableTab === 'suppliers'
                    ? 'bg-[#087A55] text-white shadow-xs'
                    : 'text-[#718078] hover:text-[#172B25] hover:bg-gray-100'
                }`}
              >
                Top Suppliers ({recent.topSuppliers.length})
              </button>
              <button
                onClick={() => setActiveTableTab('lowStock')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTableTab === 'lowStock'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-[#718078] hover:text-[#172B25] hover:bg-gray-100'
                }`}
              >
                Low Stock Alerts ({recent.lowStockProducts.length})
              </button>
              <button
                onClick={() => setActiveTableTab('payments')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTableTab === 'payments'
                    ? 'bg-[#087A55] text-white shadow-xs'
                    : 'text-[#718078] hover:text-[#172B25] hover:bg-gray-100'
                }`}
              >
                Recent Payments ({recent.recentPayments.length})
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportTable}
                className="px-3 py-1.5 text-xs font-semibold text-[#087A55] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all flex items-center"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* 1. Recent Sales Table */}
          {activeTableTab === 'sales' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold uppercase tracking-wider border-b border-[#E4EAE5]">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Bags</th>
                    <th className="py-3 px-4 text-right">Weight (Kg)</th>
                    <th className="py-3 px-4 text-right">Amount (PKR)</th>
                    <th className="py-3 px-4 text-center">Payment</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {recent.recentSales.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#172B25]">{s.invoiceNumber}</td>
                      <td className="py-3 px-4 font-medium text-[#172B25]">{s.customerName}</td>
                      <td className="py-3 px-4 text-[#718078]">{new Date(s.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right font-medium">{s.totalBags}</td>
                      <td className="py-3 px-4 text-right font-mono text-[#718078]">{s.totalWeightKg}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#087A55]">
                        PKR {Number(s.netAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-[#172B25]">
                          {s.paymentType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Recent Purchases Table */}
          {activeTableTab === 'purchases' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold uppercase tracking-wider border-b border-[#E4EAE5]">
                  <tr>
                    <th className="py-3 px-4">Purchase Bill #</th>
                    <th className="py-3 px-4">Supplier / Arthi</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Bags</th>
                    <th className="py-3 px-4 text-right">Weight (Kg)</th>
                    <th className="py-3 px-4 text-right">Amount (PKR)</th>
                    <th className="py-3 px-4">Bilty #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {recent.recentPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#172B25]">{p.purchaseNumber}</td>
                      <td className="py-3 px-4 font-medium text-[#172B25]">{p.supplierName}</td>
                      <td className="py-3 px-4 text-[#718078]">{p.warehouseName || 'Main'}</td>
                      <td className="py-3 px-4 text-[#718078]">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right font-medium">{p.totalBags}</td>
                      <td className="py-3 px-4 text-right font-mono text-[#718078]">{p.totalWeightKg}</td>
                      <td className="py-3 px-4 text-right font-bold text-blue-700">
                        PKR {Number(p.netAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#718078]">{p.biltyNumber || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Top Customers Table */}
          {activeTableTab === 'customers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold uppercase tracking-wider border-b border-[#E4EAE5]">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4 text-right">Total Purchases (PKR)</th>
                    <th className="py-3 px-4 text-right">Receivable Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {recent.topCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#718078]">{c.customerCode}</td>
                      <td className="py-3 px-4 font-semibold text-[#172B25]">{c.name}</td>
                      <td className="py-3 px-4 text-[#718078]">{c.phone}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#087A55]">
                        PKR {Number(c.totalPurchases).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700">
                        PKR {Number(c.currentBalance).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Top Suppliers Table */}
          {activeTableTab === 'suppliers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold uppercase tracking-wider border-b border-[#E4EAE5]">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Supplier Name</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4 text-right">Total Supplied (PKR)</th>
                    <th className="py-3 px-4 text-right">Payable Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {recent.topSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#718078]">{s.code}</td>
                      <td className="py-3 px-4 font-semibold text-[#172B25]">{s.name}</td>
                      <td className="py-3 px-4 text-[#718078]">{s.phone}</td>
                      <td className="py-3 px-4 text-right font-bold text-blue-700">
                        PKR {Number(s.totalSupplied).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-red-700">
                        PKR {Number(s.currentBalance).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. Low Stock Alerts Table */}
          {activeTableTab === 'lowStock' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold uppercase tracking-wider border-b border-[#E4EAE5]">
                  <tr>
                    <th className="py-3 px-4">Product Code</th>
                    <th className="py-3 px-4">Rice Product</th>
                    <th className="py-3 px-4">Variety</th>
                    <th className="py-3 px-4 text-right">Current Bags</th>
                    <th className="py-3 px-4 text-right">Current Weight</th>
                    <th className="py-3 px-4 text-right">Reorder Level</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {recent.lowStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        All rice products are above safety buffer reorder levels.
                      </td>
                    </tr>
                  ) : (
                    recent.lowStockProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-[#718078]">{p.code}</td>
                        <td className="py-3 px-4 font-semibold text-[#172B25]">{p.name}</td>
                        <td className="py-3 px-4 text-[#718078]">{p.variety}</td>
                        <td className="py-3 px-4 text-right font-bold text-[#DC5050]">{p.totalBags}</td>
                        <td className="py-3 px-4 text-right font-bold text-[#DC5050]">{p.totalWeightKg} Kg</td>
                        <td className="py-3 px-4 text-right text-[#718078]">{p.reorderLevelKg} Kg</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              p.isOutOfStock
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 6. Recent Payments Table */}
          {activeTableTab === 'payments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold uppercase tracking-wider border-b border-[#E4EAE5]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Party Name</th>
                    <th className="py-3 px-4">Party Type</th>
                    <th className="py-3 px-4">Voucher Type</th>
                    <th className="py-3 px-4">Reference #</th>
                    <th className="py-3 px-4 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {recent.recentPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 text-[#718078]">{new Date(pay.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-semibold text-[#172B25]">{pay.partyName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            pay.partyType === 'CUSTOMER'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {pay.partyType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#172B25]">{pay.type}</td>
                      <td className="py-3 px-4 font-mono text-[#718078]">{pay.referenceNo}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#087A55]">
                        PKR {Number(pay.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
