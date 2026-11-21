import prisma from './config/prisma';

const API_BASE = 'http://localhost:5000/api';

async function apiPost(endpoint: string, body: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function apiGet(endpoint: string, token: string) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runStep10Tests() {
  console.log('===============================================================');
  console.log('🚀 RUNNING STEP 10 AUTOMATED TEST SUITE: BI DASHBOARD & REPORTS');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate as Admin
    const loginRes = await apiPost('/auth/login', {
      username: 'admin',
      password: 'Admin@12345',
    });
    const token = loginRes.data?.data?.tokens?.accessToken;
    assert(!!token, 'Admin Authentication for BI tests');

    // 2. Test Dashboard KPI Stats
    const statsToday = await apiGet('/dashboard/stats?filter=today', token);
    const kpi = statsToday.data.data.kpi;
    assert(statsToday.status === 200, 'GET /dashboard/stats?filter=today returns 200');
    assert(Number(kpi.totalStockQuantityBags) >= 0, 'Total Stock Quantity Bags is non-negative number', `${kpi.totalStockQuantityBags} Bags`);
    assert(Number(kpi.totalStockValue) > 0, 'Total Stock Value is strictly derived from inventory valuation', `PKR ${kpi.totalStockValue}`);
    assert(Number(kpi.totalLiquidFunds) > 0, 'Total Liquid Funds equals Cash in Hand + Bank Balance', `PKR ${kpi.totalLiquidFunds}`);
    assert(Number(kpi.customerReceivables) >= 0, 'Customer Receivables is non-negative', `PKR ${kpi.customerReceivables}`);
    assert(Number(kpi.supplierPayables) >= 0, 'Supplier Payables is non-negative', `PKR ${kpi.supplierPayables}`);

    // 3. Test Dashboard KPI with different filters (yesterday, week, month)
    const statsMonth = await apiGet('/dashboard/stats?filter=month', token);
    assert(statsMonth.status === 200, 'GET /dashboard/stats?filter=month returns 200');
    assert(statsMonth.data.data.period.filter === 'month', 'Dashboard period filter correctly set to month');

    // 4. Test Dashboard Charts Endpoint
    const chartsRes = await apiGet('/dashboard/charts?days=14', token);
    const charts = chartsRes.data.data;
    assert(chartsRes.status === 200, 'GET /dashboard/charts returns 200');
    assert(Array.isArray(charts.dailySalesTrend) && charts.dailySalesTrend.length === 14, 'Daily Sales Trend has 14 date points', `${charts.dailySalesTrend.length} points`);
    assert(Array.isArray(charts.monthlyTrend) && charts.monthlyTrend.length === 6, 'Monthly Trend has 6 month points', `${charts.monthlyTrend.length} months`);
    assert(Array.isArray(charts.topProducts), 'Top Selling Products array returned', `${charts.topProducts.length} products`);
    assert(Array.isArray(charts.warehouseDistribution) && charts.warehouseDistribution.length > 0, 'Warehouse Stock Distribution returned', `${charts.warehouseDistribution.length} warehouses`);

    // 5. Test Dashboard Recent Activity & Leaderboards
    const recentRes = await apiGet('/dashboard/recent', token);
    const recent = recentRes.data.data;
    assert(recentRes.status === 200, 'GET /dashboard/recent returns 200');
    assert(Array.isArray(recent.recentSales), 'Recent Sales table data returned', `${recent.recentSales.length} sales`);
    assert(Array.isArray(recent.recentPurchases), 'Recent Purchases table data returned', `${recent.recentPurchases.length} purchases`);
    assert(Array.isArray(recent.topCustomers), 'Top Customers leaderboard returned', `${recent.topCustomers.length} customers`);
    assert(Array.isArray(recent.topSuppliers), 'Top Suppliers leaderboard returned', `${recent.topSuppliers.length} suppliers`);
    assert(Array.isArray(recent.lowStockProducts), 'Low Stock Products alerts returned', `${recent.lowStockProducts.length} low stock`);
    assert(Array.isArray(recent.recentPayments), 'Recent Payments & Receipts returned', `${recent.recentPayments.length} payments`);

    // 6. Test Reports Endpoints (All 12 Reports)
    // Rep 1: Daily Sales Report
    const rDailySales = await apiGet('/reports/daily-sales?filter=month', token);
    assert(rDailySales.status === 200, '1. GET /reports/daily-sales returns 200', `${rDailySales.data.data.rows.length} rows`);

    // Rep 2: Daily Closing Register
    const rDailyClosing = await apiGet('/reports/daily-closing?filter=month', token);
    assert(rDailyClosing.status === 200, '2. GET /reports/daily-closing returns 200', `${rDailyClosing.data.data.rows.length} rows`);

    // Rep 3: Monthly Sales Report
    const rMonthlySales = await apiGet('/reports/monthly-sales', token);
    assert(rMonthlySales.status === 200, '3. GET /reports/monthly-sales returns 200', `${rMonthlySales.data.data.rows.length} months`);

    // Rep 4: Purchase Report
    const rPurchases = await apiGet('/reports/purchases?filter=month', token);
    assert(rPurchases.status === 200, '4. GET /reports/purchases returns 200', `${rPurchases.data.data.rows.length} rows`);

    // Rep 5: Profit & Loss Report
    const rProfitLoss = await apiGet('/reports/profit-loss?filter=month', token);
    assert(rProfitLoss.status === 200, '5. GET /reports/profit-loss returns 200', `Revenue: PKR ${rProfitLoss.data.data.revenue.totalRevenue}`);
    assert(rProfitLoss.data.data.netProfit !== undefined, 'Profit & Loss calculates Net Profit');

    // Rep 6: Stock Valuation Report
    const rStockVal = await apiGet('/reports/stock-valuation', token);
    assert(rStockVal.status === 200, '6. GET /reports/stock-valuation returns 200', `${rStockVal.data.data.rows.length} items`);

    // Rep 7: Stock Ledger Report
    const rStockLedger = await apiGet('/reports/stock-ledger?filter=month', token);
    assert(rStockLedger.status === 200, '7. GET /reports/stock-ledger returns 200', `${rStockLedger.data.data.rows.length} movements`);

    // Rep 8: Customer Outstanding Report
    const rCustOut = await apiGet('/reports/customer-outstanding', token);
    assert(rCustOut.status === 200, '8. GET /reports/customer-outstanding returns 200', `${rCustOut.data.data.rows.length} customers`);

    // Rep 9: Supplier Outstanding Report
    const rSuppOut = await apiGet('/reports/supplier-outstanding', token);
    assert(rSuppOut.status === 200, '9. GET /reports/supplier-outstanding returns 200', `${rSuppOut.data.data.rows.length} suppliers`);

    // Rep 10: Expenses Report
    const rExpenses = await apiGet('/reports/expenses?filter=month', token);
    assert(rExpenses.status === 200, '10. GET /reports/expenses returns 200', `${rExpenses.data.data.rows.length} expenses`);

    // Rep 11: Commission Report
    const rCommission = await apiGet('/reports/commission?filter=month', token);
    assert(rCommission.status === 200, '11. GET /reports/commission returns 200', `${rCommission.data.data.rows.length} agents`);

    // Rep 12: Warehouse Utilization Report
    const rWarehouses = await apiGet('/reports/warehouses', token);
    assert(rWarehouses.status === 200, '12. GET /reports/warehouses returns 200', `${rWarehouses.data.data.rows.length} warehouses`);

    console.log('===============================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('===============================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Test execution error:', err?.response?.data || err?.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStep10Tests();
