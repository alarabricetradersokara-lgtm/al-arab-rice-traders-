import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import Decimal from 'decimal.js';

/**
 * Helper to compute date bounds based on standard filter string or custom dates
 */
function getDateBounds(filter?: string, customStart?: string, customEnd?: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (filter === 'yesterday') {
    startDate.setDate(now.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setDate(now.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);
  } else if (filter === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    startDate = new Date(now.setDate(diff));
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
  } else if (filter === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (filter === 'custom' && customStart && customEnd) {
    startDate = new Date(customStart);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(customEnd);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Default: 'today'
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
}

/**
 * 1. Comprehensive Dashboard KPI Statistics
 */
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { filter = 'today', startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateBounds(
      filter as string,
      customStart as string,
      customEnd as string
    );

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Stock Totals & Valuation
    const stocks = await prisma.stock.findMany({
      include: { product: true, warehouse: true },
    });

    let totalStockBags = 0;
    let totalStockWeightKg = new Decimal(0);
    let totalStockValuation = new Decimal(0);
    let lowStockCount = 0;

    for (const s of stocks) {
      totalStockBags += s.currentBags;
      const weight = new Decimal(s.currentWeightKg.toString());
      totalStockWeightKg = totalStockWeightKg.plus(weight);
      totalStockValuation = totalStockValuation.plus(
        weight.times(new Decimal(s.product.costPricePerKg.toString()))
      );

      if (weight.lessThanOrEqualTo(new Decimal(s.product.reorderLevelKg.toString()))) {
        lowStockCount++;
      }
    }

    // 2. Today's Sales & COGS
    const todaySales = await prisma.sale.findMany({
      where: { saleDate: { gte: todayStart, lte: todayEnd } },
      include: { items: { include: { product: true } } },
    });

    const todayDailyEntries = await prisma.dailySalesEntry.findMany({
      where: {
        salesDate: { gte: todayStart, lte: todayEnd },
        status: 'CONFIRMED',
      },
    });

    let todaySalesAmount = new Decimal(0);
    let todaySalesBags = 0;
    let todaySalesWeightKg = new Decimal(0);
    let todayCogs = new Decimal(0);

    for (const s of todaySales) {
      todaySalesAmount = todaySalesAmount.plus(new Decimal(s.netAmount.toString()));
      for (const item of s.items) {
        todaySalesBags += item.bagCount;
        const w = new Decimal(item.netWeightKg.toString());
        todaySalesWeightKg = todaySalesWeightKg.plus(w);
        todayCogs = todayCogs.plus(w.times(new Decimal(item.product.costPricePerKg.toString())));
      }
    }

    for (const d of todayDailyEntries) {
      todaySalesAmount = todaySalesAmount.plus(new Decimal(d.netAmount.toString()));
      todaySalesBags += d.totalBagsSold;
      todaySalesWeightKg = todaySalesWeightKg.plus(new Decimal(d.totalWeightSoldKg.toString()));
      todayCogs = todayCogs.plus(new Decimal(d.totalCogs.toString()));
    }

    const todayGrossProfit = todaySalesAmount.minus(todayCogs);

    // 3. Today's Purchases
    const todayPurchases = await prisma.purchase.findMany({
      where: { purchaseDate: { gte: todayStart, lte: todayEnd } },
      include: { items: true },
    });

    let todayPurchaseAmount = new Decimal(0);
    let todayPurchaseBags = 0;
    let todayPurchaseWeightKg = new Decimal(0);

    for (const p of todayPurchases) {
      todayPurchaseAmount = todayPurchaseAmount.plus(new Decimal(p.netAmount.toString()));
      for (const item of p.items) {
        todayPurchaseBags += item.bagCount;
        todayPurchaseWeightKg = todayPurchaseWeightKg.plus(new Decimal(item.netWeightKg.toString()));
      }
    }

    // 4. Monthly Sales, COGS & Expenses
    const monthSales = await prisma.sale.findMany({
      where: { saleDate: { gte: monthStart, lte: monthEnd } },
      include: { items: { include: { product: true } } },
    });

    const monthDailyEntries = await prisma.dailySalesEntry.findMany({
      where: {
        salesDate: { gte: monthStart, lte: monthEnd },
        status: 'CONFIRMED',
      },
    });

    let monthlySalesAmount = new Decimal(0);
    let monthlyCogs = new Decimal(0);
    let monthlySalesBags = 0;

    for (const s of monthSales) {
      monthlySalesAmount = monthlySalesAmount.plus(new Decimal(s.netAmount.toString()));
      for (const it of s.items) {
        monthlySalesBags += it.bagCount;
        const w = new Decimal(it.netWeightKg.toString());
        monthlyCogs = monthlyCogs.plus(w.times(new Decimal(it.product.costPricePerKg.toString())));
      }
    }

    for (const d of monthDailyEntries) {
      monthlySalesAmount = monthlySalesAmount.plus(new Decimal(d.netAmount.toString()));
      monthlySalesBags += d.totalBagsSold;
      monthlyCogs = monthlyCogs.plus(new Decimal(d.totalCogs.toString()));
    }

    const monthExpenses = await prisma.expense.findMany({
      where: { expenseDate: { gte: monthStart, lte: monthEnd }, status: 'POSTED' },
    });

    const monthlyExpensesAmount = monthExpenses.reduce(
      (acc, exp) => acc.plus(new Decimal(exp.amount.toString())),
      new Decimal(0)
    );

    const monthlyGrossProfit = monthlySalesAmount.minus(monthlyCogs);
    const monthlyNetProfit = monthlyGrossProfit.minus(monthlyExpensesAmount);

    // 5. Cash in Hand & Bank Balances
    const cashAccounts = await prisma.cashAccount.findMany();
    const bankAccounts = await prisma.bankAccount.findMany();

    const cashInHand = cashAccounts.reduce(
      (acc, c) => acc.plus(new Decimal(c.balance.toString())),
      new Decimal(0)
    );
    const bankBalance = bankAccounts.reduce(
      (acc, b) => acc.plus(new Decimal(b.currentBalance.toString())),
      new Decimal(0)
    );

    // 6. Customer Receivables & Supplier Payables
    const customers = await prisma.customer.findMany({ select: { currentBalance: true } });
    const exportCustomers = await prisma.exportCustomer.findMany({ select: { currentReceivablePkr: true } });
    const suppliers = await prisma.supplier.findMany({ select: { currentBalance: true } });
    const commissionAgents = await prisma.commissionAgent.findMany({ select: { currentBalance: true } });

    let customerReceivables = customers.reduce(
      (acc, c) => acc.plus(new Decimal(c.currentBalance.toString())),
      new Decimal(0)
    );
    for (const ec of exportCustomers) {
      customerReceivables = customerReceivables.plus(new Decimal(ec.currentReceivablePkr.toString()));
    }

    let supplierPayables = suppliers.reduce(
      (acc, s) => acc.plus(new Decimal(s.currentBalance.toString())),
      new Decimal(0)
    );
    for (const ca of commissionAgents) {
      supplierPayables = supplierPayables.plus(new Decimal(ca.currentBalance.toString()));
    }

    // 7. Filtered period metrics (if user selected Yesterday, This Week, or Custom Range)
    const periodSales = await prisma.sale.findMany({
      where: { saleDate: { gte: startDate, lte: endDate } },
    });
    const periodDailySales = await prisma.dailySalesEntry.findMany({
      where: { salesDate: { gte: startDate, lte: endDate }, status: 'CONFIRMED' },
    });
    let periodSalesAmount = new Decimal(0);
    for (const s of periodSales) periodSalesAmount = periodSalesAmount.plus(new Decimal(s.netAmount.toString()));
    for (const d of periodDailySales) periodSalesAmount = periodSalesAmount.plus(new Decimal(d.netAmount.toString()));

    const periodPurchases = await prisma.purchase.findMany({
      where: { purchaseDate: { gte: startDate, lte: endDate } },
    });
    let periodPurchaseAmount = new Decimal(0);
    for (const p of periodPurchases) periodPurchaseAmount = periodPurchaseAmount.plus(new Decimal(p.netAmount.toString()));

    sendSuccess(res, {
      kpi: {
        totalStockQuantityBags: totalStockBags,
        totalStockQuantityKg: totalStockWeightKg.toFixed(2),
        totalStockQuantityMaunds: totalStockWeightKg.dividedBy(40).toFixed(2),
        totalStockQuantityMt: totalStockWeightKg.dividedBy(1000).toFixed(3),
        totalStockValue: totalStockValuation.toFixed(2),
        todaySales: todaySalesAmount.toFixed(2),
        todaySalesBags,
        todayPurchases: todayPurchaseAmount.toFixed(2),
        todayPurchaseBags,
        todayGrossProfit: todayGrossProfit.toFixed(2),
        monthlySales: monthlySalesAmount.toFixed(2),
        monthlySalesBags,
        monthlyProfit: monthlyNetProfit.toFixed(2),
        monthlyGrossProfit: monthlyGrossProfit.toFixed(2),
        monthlyExpenses: monthlyExpensesAmount.toFixed(2),
        cashInHand: cashInHand.toFixed(2),
        bankBalance: bankBalance.toFixed(2),
        totalLiquidFunds: cashInHand.plus(bankBalance).toFixed(2),
        customerReceivables: customerReceivables.toFixed(2),
        supplierPayables: supplierPayables.toFixed(2),
        lowStockCount,
      },
      period: {
        filter,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        salesAmount: periodSalesAmount.toFixed(2),
        purchaseAmount: periodPurchaseAmount.toFixed(2),
      },
    }, 'Dashboard KPI statistics retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Visual BI Charts (Daily Sales, Monthly Trend, Purchases vs Sales, Profit, Products, Warehouses)
 */
export const getDashboardCharts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { days = 14 } = req.query;
    const numDays = Math.min(60, Math.max(7, parseInt(days as string) || 14));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (numDays - 1));
    startDate.setHours(0, 0, 0, 0);

    // 1. Daily Sales & Purchases Trend
    const sales = await prisma.sale.findMany({
      where: { saleDate: { gte: startDate } },
      include: { items: { include: { product: true } } },
    });

    const dailyEntries = await prisma.dailySalesEntry.findMany({
      where: { salesDate: { gte: startDate }, status: 'CONFIRMED' },
    });

    const purchases = await prisma.purchase.findMany({
      where: { purchaseDate: { gte: startDate } },
      include: { items: true },
    });

    const expenses = await prisma.expense.findMany({
      where: { expenseDate: { gte: startDate }, status: 'POSTED' },
    });

    // Build timeline map
    const dailyTrendMap: Record<
      string,
      {
        date: string;
        label: string;
        sales: Decimal;
        purchases: Decimal;
        cogs: Decimal;
        grossProfit: Decimal;
        expenses: Decimal;
        netProfit: Decimal;
        bagsSold: number;
        bagsPurchased: number;
      }
    > = {};

    for (let i = 0; i < numDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const shortLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyTrendMap[iso] = {
        date: iso,
        label: shortLabel,
        sales: new Decimal(0),
        purchases: new Decimal(0),
        cogs: new Decimal(0),
        grossProfit: new Decimal(0),
        expenses: new Decimal(0),
        netProfit: new Decimal(0),
        bagsSold: 0,
        bagsPurchased: 0,
      };
    }

    for (const s of sales) {
      const key = s.saleDate.toISOString().split('T')[0];
      if (dailyTrendMap[key]) {
        const net = new Decimal(s.netAmount.toString());
        dailyTrendMap[key].sales = dailyTrendMap[key].sales.plus(net);
        for (const it of s.items) {
          dailyTrendMap[key].bagsSold += it.bagCount;
          const cost = new Decimal(it.netWeightKg.toString()).times(new Decimal(it.product.costPricePerKg.toString()));
          dailyTrendMap[key].cogs = dailyTrendMap[key].cogs.plus(cost);
        }
      }
    }

    for (const d of dailyEntries) {
      const key = d.salesDate.toISOString().split('T')[0];
      if (dailyTrendMap[key]) {
        dailyTrendMap[key].sales = dailyTrendMap[key].sales.plus(new Decimal(d.netAmount.toString()));
        dailyTrendMap[key].cogs = dailyTrendMap[key].cogs.plus(new Decimal(d.totalCogs.toString()));
        dailyTrendMap[key].bagsSold += d.totalBagsSold;
      }
    }

    for (const p of purchases) {
      const key = p.purchaseDate.toISOString().split('T')[0];
      if (dailyTrendMap[key]) {
        dailyTrendMap[key].purchases = dailyTrendMap[key].purchases.plus(new Decimal(p.netAmount.toString()));
        for (const it of p.items) {
          dailyTrendMap[key].bagsPurchased += it.bagCount;
        }
      }
    }

    for (const e of expenses) {
      const key = e.expenseDate.toISOString().split('T')[0];
      if (dailyTrendMap[key]) {
        dailyTrendMap[key].expenses = dailyTrendMap[key].expenses.plus(new Decimal(e.amount.toString()));
      }
    }

    // Format daily trend
    const dailySalesTrend = Object.values(dailyTrendMap).map((item) => {
      const gp = item.sales.minus(item.cogs);
      const np = gp.minus(item.expenses);
      return {
        date: item.date,
        label: item.label,
        sales: parseFloat(item.sales.toFixed(2)),
        purchases: parseFloat(item.purchases.toFixed(2)),
        cogs: parseFloat(item.cogs.toFixed(2)),
        grossProfit: parseFloat(gp.toFixed(2)),
        expenses: parseFloat(item.expenses.toFixed(2)),
        netProfit: parseFloat(np.toFixed(2)),
        bagsSold: item.bagsSold,
        bagsPurchased: item.bagsPurchased,
      };
    });

    // 2. Monthly Sales Trend (Past 6 months)
    const now = new Date();
    const monthlyTrend = [];
    for (let m = 5; m >= 0; m--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const mStart = new Date(mDate.getFullYear(), mDate.getMonth(), 1, 0, 0, 0);
      const mEnd = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 0, 23, 59, 59, 999);
      const mLabel = mStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      const mSales = await prisma.sale.findMany({
        where: { saleDate: { gte: mStart, lte: mEnd } },
      });
      const mDaily = await prisma.dailySalesEntry.findMany({
        where: { salesDate: { gte: mStart, lte: mEnd }, status: 'CONFIRMED' },
      });
      const mPurchases = await prisma.purchase.findMany({
        where: { purchaseDate: { gte: mStart, lte: mEnd } },
      });

      let mSalesTotal = new Decimal(0);
      for (const s of mSales) mSalesTotal = mSalesTotal.plus(new Decimal(s.netAmount.toString()));
      for (const d of mDaily) mSalesTotal = mSalesTotal.plus(new Decimal(d.netAmount.toString()));

      let mPurchaseTotal = new Decimal(0);
      for (const p of mPurchases) mPurchaseTotal = mPurchaseTotal.plus(new Decimal(p.netAmount.toString()));

      monthlyTrend.push({
        month: mLabel,
        sales: parseFloat(mSalesTotal.toFixed(2)),
        purchases: parseFloat(mPurchaseTotal.toFixed(2)),
      });
    }

    // 3. Top Selling Rice Products
    const allSaleItems = await prisma.saleItem.findMany({
      include: { product: true },
    });
    const allDailyLines = await prisma.dailySalesEntryLine.findMany({
      where: { entry: { status: 'CONFIRMED' } },
      include: { product: true },
    });

    const productSalesMap: Record<
      string,
      { name: string; variety: string; bags: number; weightKg: Decimal; revenue: Decimal }
    > = {};

    for (const it of allSaleItems) {
      const pName = it.product.name;
      if (!productSalesMap[pName]) {
        productSalesMap[pName] = {
          name: pName,
          variety: it.product.variety,
          bags: 0,
          weightKg: new Decimal(0),
          revenue: new Decimal(0),
        };
      }
      productSalesMap[pName].bags += it.bagCount;
      productSalesMap[pName].weightKg = productSalesMap[pName].weightKg.plus(new Decimal(it.netWeightKg.toString()));
      productSalesMap[pName].revenue = productSalesMap[pName].revenue.plus(new Decimal(it.lineTotal.toString()));
    }

    for (const d of allDailyLines) {
      const pName = d.product.name;
      if (!productSalesMap[pName]) {
        productSalesMap[pName] = {
          name: pName,
          variety: d.product.variety,
          bags: 0,
          weightKg: new Decimal(0),
          revenue: new Decimal(0),
        };
      }
      productSalesMap[pName].bags += d.bagCount;
      const w = new Decimal(d.weightKg.toString());
      productSalesMap[pName].weightKg = productSalesMap[pName].weightKg.plus(w);
      productSalesMap[pName].revenue = productSalesMap[pName].revenue.plus(w.times(new Decimal(d.ratePerKg.toString())));
    }

    const topProducts = Object.values(productSalesMap)
      .map((p) => ({
        name: p.name,
        variety: p.variety,
        bags: p.bags,
        weightKg: parseFloat(p.weightKg.toFixed(2)),
        maunds: parseFloat(p.weightKg.dividedBy(40).toFixed(1)),
        revenue: parseFloat(p.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // 4. Warehouse Stock Distribution
    const stocks = await prisma.stock.findMany({
      include: { warehouse: true, product: true },
    });

    const warehouseMap: Record<string, { name: string; bags: number; weightKg: Decimal; valuation: Decimal }> = {};
    for (const s of stocks) {
      const wName = s.warehouse.name;
      if (!warehouseMap[wName]) {
        warehouseMap[wName] = {
          name: wName,
          bags: 0,
          weightKg: new Decimal(0),
          valuation: new Decimal(0),
        };
      }
      warehouseMap[wName].bags += s.currentBags;
      const w = new Decimal(s.currentWeightKg.toString());
      warehouseMap[wName].weightKg = warehouseMap[wName].weightKg.plus(w);
      warehouseMap[wName].valuation = warehouseMap[wName].valuation.plus(
        w.times(new Decimal(s.product.costPricePerKg.toString()))
      );
    }

    const warehouseDistribution = Object.values(warehouseMap).map((w) => ({
      name: w.name,
      bags: w.bags,
      weightKg: parseFloat(w.weightKg.toFixed(2)),
      metricTons: parseFloat(w.weightKg.dividedBy(1000).toFixed(2)),
      valuation: parseFloat(w.valuation.toFixed(2)),
    }));

    // 5. Stock Variety Distribution (Pie Chart)
    const varietyMap: Record<string, { name: string; variety: string; bags: number; weightKg: Decimal; valuation: Decimal }> = {};
    for (const s of stocks) {
      const vName = s.product.name;
      if (!varietyMap[vName]) {
        varietyMap[vName] = {
          name: vName,
          variety: s.product.variety,
          bags: 0,
          weightKg: new Decimal(0),
          valuation: new Decimal(0),
        };
      }
      varietyMap[vName].bags += s.currentBags;
      const w = new Decimal(s.currentWeightKg.toString());
      varietyMap[vName].weightKg = varietyMap[vName].weightKg.plus(w);
      varietyMap[vName].valuation = varietyMap[vName].valuation.plus(
        w.times(new Decimal(s.product.costPricePerKg.toString()))
      );
    }

    const varietyDistribution = Object.values(varietyMap)
      .map((v) => ({
        name: v.name,
        variety: v.variety,
        bags: v.bags,
        weightKg: parseFloat(v.weightKg.toFixed(2)),
        valuation: parseFloat(v.valuation.toFixed(2)),
      }))
      .sort((a, b) => b.weightKg - a.weightKg);

    // 6. Expense Category Distribution (Pie Chart)
    const allRecentExpenses = await prisma.expense.findMany({
      where: { status: 'POSTED' },
      take: 100,
    });
    const expenseCategoryMap: Record<string, number> = {};
    for (const e of allRecentExpenses) {
      const cat = e.category.replace(/_/g, ' ');
      expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + parseFloat(e.amount.toString());
    }
    const expenseDistribution = Object.entries(expenseCategoryMap).map(([category, amount]) => ({
      category,
      amount,
    }));

    sendSuccess(res, {
      dailySalesTrend,
      monthlyTrend,
      topProducts,
      warehouseDistribution,
      varietyDistribution,
      expenseDistribution,
    }, 'Dashboard charts retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Recent Activity & Ranked Leaderboards (Sales, Purchases, Customers, Suppliers, Low Stock, Payments)
 */
export const getDashboardRecent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Recent Sales
    const recentSales = await prisma.sale.findMany({
      take: 6,
      orderBy: { saleDate: 'desc' },
      include: { customer: true, items: { include: { product: true } } },
    });

    // 2. Recent Purchases
    const recentPurchases = await prisma.purchase.findMany({
      take: 6,
      orderBy: { purchaseDate: 'desc' },
      include: { supplier: true, warehouse: true, items: true },
    });

    // 3. Top Customers by Revenue
    const topCustomersQuery = await prisma.customer.findMany({
      take: 6,
      orderBy: { currentBalance: 'desc' },
      include: { sales: { select: { netAmount: true } } },
    });

    // 4. Top Suppliers by Volume
    const topSuppliersQuery = await prisma.supplier.findMany({
      take: 6,
      orderBy: { currentBalance: 'desc' },
      include: { purchases: { select: { netAmount: true } } },
    });

    // 5. Low Stock Products
    const products = await prisma.riceProduct.findMany({
      where: { isActive: true },
      include: { stocks: { include: { warehouse: true } } },
    });

    const lowStockProducts = [];
    for (const p of products) {
      let totalBags = 0;
      let totalWeight = new Decimal(0);
      for (const s of p.stocks) {
        totalBags += s.currentBags;
        totalWeight = totalWeight.plus(new Decimal(s.currentWeightKg.toString()));
      }
      const reorder = new Decimal(p.reorderLevelKg.toString());
      if (totalWeight.lessThanOrEqualTo(reorder)) {
        lowStockProducts.push({
          id: p.id,
          code: p.code,
          name: p.name,
          variety: p.variety,
          totalBags,
          totalWeightKg: totalWeight.toFixed(2),
          reorderLevelKg: reorder.toFixed(2),
          deficitKg: reorder.minus(totalWeight).toFixed(2),
          isOutOfStock: totalWeight.lessThanOrEqualTo(0),
        });
      }
    }

    // 6. Recent Payments & Receipts (from Customer and Supplier Khatabooks)
    const recentCustomerPayments = await prisma.customerLedger.findMany({
      take: 5,
      where: { transactionType: 'RECEIPT' },
      orderBy: { date: 'desc' },
      include: { customer: true },
    });

    const recentSupplierPayments = await prisma.supplierLedger.findMany({
      take: 5,
      where: { transactionType: 'PAYMENT' },
      orderBy: { date: 'desc' },
      include: { supplier: true },
    });

    const recentPayments = [
      ...recentCustomerPayments.map((cp) => ({
        id: cp.id,
        date: cp.date,
        partyName: cp.customer?.name || 'Customer',
        partyType: 'CUSTOMER' as const,
        type: 'RECEIPT (Vasooli)' as const,
        referenceNo: cp.referenceNo,
        amount: cp.credit.toString(),
      })),
      ...recentSupplierPayments.map((sp) => ({
        id: sp.id,
        date: sp.date,
        partyName: sp.supplier?.name || 'Supplier',
        partyType: 'SUPPLIER' as const,
        type: 'PAYMENT (Adaigi)' as const,
        referenceNo: sp.referenceNo,
        amount: sp.debit.toString(),
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    sendSuccess(res, {
      recentSales: recentSales.map((s) => ({
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        customerName: s.customer?.name || 'Walk-in Cash Customer',
        date: s.saleDate,
        totalBags: s.items.reduce((acc, it) => acc + it.bagCount, 0),
        totalWeightKg: s.items.reduce((acc, it) => acc + Number(it.netWeightKg), 0).toFixed(2),
        netAmount: s.netAmount.toString(),
        paymentType: s.paymentType,
        status: s.status,
      })),
      recentPurchases: recentPurchases.map((p) => ({
        id: p.id,
        purchaseNumber: p.purchaseNumber,
        supplierName: p.supplier?.name || 'Direct Mandi Lot',
        warehouseName: p.warehouse?.name,
        date: p.purchaseDate,
        totalBags: p.items.reduce((acc, it) => acc + it.bagCount, 0),
        totalWeightKg: p.items.reduce((acc, it) => acc + Number(it.netWeightKg), 0).toFixed(2),
        netAmount: p.netAmount.toString(),
        paymentType: p.paymentType,
        biltyNumber: p.biltyNumber,
      })),
      topCustomers: topCustomersQuery.map((c) => ({
        id: c.id,
        customerCode: c.code,
        name: c.name,
        phone: c.phone,
        totalPurchases: c.sales.reduce((acc, s) => acc.plus(new Decimal(s.netAmount.toString())), new Decimal(0)).toFixed(2),
        currentBalance: c.currentBalance.toString(),
      })),
      topSuppliers: topSuppliersQuery.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        phone: s.phone,
        totalSupplied: s.purchases.reduce((acc, p) => acc.plus(new Decimal(p.netAmount.toString())), new Decimal(0)).toFixed(2),
        currentBalance: s.currentBalance.toString(),
      })),
      lowStockProducts,
      recentPayments,
    }, 'Dashboard recent records and leaderboards retrieved');
  } catch (err) {
    next(err);
  }
};
