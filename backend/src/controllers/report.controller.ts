import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import Decimal from 'decimal.js';

function parseDateFilters(query: any): { startDate: Date; endDate: Date } {
  const { filter = 'month', startDate: customStart, endDate: customEnd } = query;
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (filter === 'today') {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (filter === 'yesterday') {
    startDate.setDate(now.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setDate(now.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);
  } else if (filter === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startDate = new Date(now.setDate(diff));
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
  } else if (filter === 'custom' && customStart && customEnd) {
    startDate = new Date(customStart);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(customEnd);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Default 'month'
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { startDate, endDate };
}

// 1. Daily Sales Report
export const getDailySalesReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = parseDateFilters(req.query);
    const { warehouseId } = req.query;

    const where: any = { saleDate: { gte: startDate, lte: endDate } };
    if (warehouseId) where.warehouseId = warehouseId as string;

    const sales = await prisma.sale.findMany({
      where,
      orderBy: { saleDate: 'desc' },
      include: {
        customer: true,
        warehouse: true,
        items: { include: { product: true } },
      },
    });

    let totalBags = 0;
    let totalWeightKg = new Decimal(0);
    let totalAmount = new Decimal(0);
    let totalPaid = new Decimal(0);
    let totalBalance = new Decimal(0);

    const rows = sales.map((s) => {
      const bags = s.items.reduce((acc, it) => acc + it.bagCount, 0);
      const weight = s.items.reduce((acc, it) => acc.plus(new Decimal(it.netWeightKg.toString())), new Decimal(0));
      const net = new Decimal(s.netAmount.toString());
      const paid = new Decimal(s.paidAmount.toString());
      const bal = new Decimal(s.balanceAmount.toString());

      totalBags += bags;
      totalWeightKg = totalWeightKg.plus(weight);
      totalAmount = totalAmount.plus(net);
      totalPaid = totalPaid.plus(paid);
      totalBalance = totalBalance.plus(bal);

      return {
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        date: s.saleDate,
        customerName: s.customer?.name || 'Walk-in Cash Customer',
        warehouseName: s.warehouse?.name,
        paymentType: s.paymentType,
        totalBags: bags,
        totalWeightKg: weight.toFixed(2),
        totalMaunds: weight.dividedBy(40).toFixed(2),
        netAmount: net.toFixed(2),
        paidAmount: paid.toFixed(2),
        balanceAmount: bal.toFixed(2),
        status: s.status,
        productsSummary: s.items.map((i) => `${i.product.name} (${i.bagCount} bags)`).join(', '),
      };
    });

    sendSuccess(res, {
      rows,
      summary: {
        count: sales.length,
        totalBags,
        totalWeightKg: totalWeightKg.toFixed(2),
        totalMaunds: totalWeightKg.dividedBy(40).toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        totalBalance: totalBalance.toFixed(2),
      },
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }, 'Daily sales report generated');
  } catch (err) {
    next(err);
  }
};

// 2. Daily Closing Report
export const getDailyClosingReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = parseDateFilters(req.query);

    const dailyEntries = await prisma.dailySalesEntry.findMany({
      where: {
        salesDate: { gte: startDate, lte: endDate },
      },
      orderBy: { salesDate: 'desc' },
      include: {
        warehouse: true,
        lines: { include: { product: true } },
      },
    });

    let totalGross = new Decimal(0);
    let totalDiscount = new Decimal(0);
    let totalNet = new Decimal(0);
    let totalCogs = new Decimal(0);
    let totalGrossProfit = new Decimal(0);
    let totalBags = 0;
    let totalWeightKg = new Decimal(0);

    const rows = dailyEntries.map((d) => {
      totalGross = totalGross.plus(new Decimal(d.grossAmount.toString()));
      totalDiscount = totalDiscount.plus(new Decimal(d.discountAmount.toString()));
      totalNet = totalNet.plus(new Decimal(d.netAmount.toString()));
      totalCogs = totalCogs.plus(new Decimal(d.totalCogs.toString()));
      totalGrossProfit = totalGrossProfit.plus(new Decimal(d.grossProfit.toString()));
      totalBags += d.totalBagsSold;
      totalWeightKg = totalWeightKg.plus(new Decimal(d.totalWeightSoldKg.toString()));

      return {
        id: d.id,
        entryNumber: d.entryNumber,
        date: d.salesDate,
        warehouseName: d.warehouse?.name,
        status: d.status,
        totalBagsSold: d.totalBagsSold,
        totalWeightSoldKg: d.totalWeightSoldKg.toString(),
        totalMaunds: new Decimal(d.totalWeightSoldKg.toString()).dividedBy(40).toFixed(2),
        grossAmount: d.grossAmount.toString(),
        discountAmount: d.discountAmount.toString(),
        commissionAmount: d.commissionAmount.toString(),
        netAmount: d.netAmount.toString(),
        totalCogs: d.totalCogs.toString(),
        grossProfit: d.grossProfit.toString(),
        cashAmount: d.cashAmount.toString(),
        creditAmount: d.creditAmount.toString(),
      };
    });

    sendSuccess(res, {
      rows,
      summary: {
        count: dailyEntries.length,
        totalBags,
        totalWeightKg: totalWeightKg.toFixed(2),
        totalGross: totalGross.toFixed(2),
        totalDiscount: totalDiscount.toFixed(2),
        totalNet: totalNet.toFixed(2),
        totalCogs: totalCogs.toFixed(2),
        totalGrossProfit: totalGrossProfit.toFixed(2),
      },
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }, 'Daily closing report generated');
  } catch (err) {
    next(err);
  }
};

// 3. Monthly Sales Report
export const getMonthlySalesReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const months = [];

    for (let m = 11; m >= 0; m--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const mStart = new Date(mDate.getFullYear(), mDate.getMonth(), 1, 0, 0, 0);
      const mEnd = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 0, 23, 59, 59, 999);
      const mLabel = mStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const sales = await prisma.sale.findMany({
        where: { saleDate: { gte: mStart, lte: mEnd } },
        include: { items: true },
      });

      const dailyEntries = await prisma.dailySalesEntry.findMany({
        where: { salesDate: { gte: mStart, lte: mEnd }, status: 'CONFIRMED' },
      });

      let netAmount = new Decimal(0);
      let bags = 0;
      let weightKg = new Decimal(0);

      for (const s of sales) {
        netAmount = netAmount.plus(new Decimal(s.netAmount.toString()));
        for (const it of s.items) {
          bags += it.bagCount;
          weightKg = weightKg.plus(new Decimal(it.netWeightKg.toString()));
        }
      }

      for (const d of dailyEntries) {
        netAmount = netAmount.plus(new Decimal(d.netAmount.toString()));
        bags += d.totalBagsSold;
        weightKg = weightKg.plus(new Decimal(d.totalWeightSoldKg.toString()));
      }

      months.push({
        month: mLabel,
        year: mStart.getFullYear(),
        invoicesCount: sales.length + dailyEntries.length,
        totalBags: bags,
        totalWeightKg: weightKg.toFixed(2),
        totalMaunds: weightKg.dividedBy(40).toFixed(2),
        totalMetricTons: weightKg.dividedBy(1000).toFixed(2),
        totalRevenue: netAmount.toFixed(2),
      });
    }

    sendSuccess(res, { rows: months }, 'Monthly sales report generated');
  } catch (err) {
    next(err);
  }
};

// 4. Purchase Report
export const getPurchaseReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = parseDateFilters(req.query);
    const { supplierId, warehouseId } = req.query;

    const where: any = { purchaseDate: { gte: startDate, lte: endDate } };
    if (supplierId) where.supplierId = supplierId as string;
    if (warehouseId) where.warehouseId = warehouseId as string;

    const purchases = await prisma.purchase.findMany({
      where,
      orderBy: { purchaseDate: 'desc' },
      include: {
        supplier: true,
        warehouse: true,
        items: { include: { product: true } },
      },
    });

    let totalBags = 0;
    let totalWeightKg = new Decimal(0);
    let totalSubTotal = new Decimal(0);
    let totalFreight = new Decimal(0);
    let totalPalledari = new Decimal(0);
    let totalCommission = new Decimal(0);
    let totalNet = new Decimal(0);
    let totalPaid = new Decimal(0);
    let totalBalance = new Decimal(0);

    const rows = purchases.map((p) => {
      const bags = p.items.reduce((acc, it) => acc + it.bagCount, 0);
      const weight = p.items.reduce((acc, it) => acc.plus(new Decimal(it.netWeightKg.toString())), new Decimal(0));
      const net = new Decimal(p.netAmount.toString());
      const paid = new Decimal(p.paidAmount.toString());
      const bal = new Decimal(p.balanceAmount.toString());

      totalBags += bags;
      totalWeightKg = totalWeightKg.plus(weight);
      totalSubTotal = totalSubTotal.plus(new Decimal(p.subTotal.toString()));
      totalFreight = totalFreight.plus(new Decimal(p.freightAmount.toString()));
      totalPalledari = totalPalledari.plus(new Decimal(p.palledariAmount.toString()));
      totalCommission = totalCommission.plus(new Decimal(p.commissionAmount.toString()));
      totalNet = totalNet.plus(net);
      totalPaid = totalPaid.plus(paid);
      totalBalance = totalBalance.plus(bal);

      return {
        id: p.id,
        purchaseNumber: p.purchaseNumber,
        biltyNumber: p.biltyNumber,
        truckNumber: p.truckNumber,
        date: p.purchaseDate,
        supplierName: p.supplier?.name,
        warehouseName: p.warehouse?.name,
        paymentType: p.paymentType,
        totalBags: bags,
        totalWeightKg: weight.toFixed(2),
        totalMaunds: weight.dividedBy(40).toFixed(2),
        subTotal: p.subTotal.toString(),
        freightAmount: p.freightAmount.toString(),
        palledariAmount: p.palledariAmount.toString(),
        commissionAmount: p.commissionAmount.toString(),
        netAmount: net.toFixed(2),
        paidAmount: paid.toFixed(2),
        balanceAmount: bal.toFixed(2),
        productsSummary: p.items.map((i) => `${i.product.name} (${i.bagCount} bags)`).join(', '),
      };
    });

    sendSuccess(res, {
      rows,
      summary: {
        count: purchases.length,
        totalBags,
        totalWeightKg: totalWeightKg.toFixed(2),
        totalMaunds: totalWeightKg.dividedBy(40).toFixed(2),
        totalSubTotal: totalSubTotal.toFixed(2),
        totalFreight: totalFreight.toFixed(2),
        totalPalledari: totalPalledari.toFixed(2),
        totalCommission: totalCommission.toFixed(2),
        totalNet: totalNet.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        totalBalance: totalBalance.toFixed(2),
      },
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }, 'Purchase report generated');
  } catch (err) {
    next(err);
  }
};

// 5. Profit & Loss Report
export const getProfitLossReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = parseDateFilters(req.query);

    // Domestic Sales
    const sales = await prisma.sale.findMany({
      where: { saleDate: { gte: startDate, lte: endDate } },
      include: { items: { include: { product: true } } },
    });
    const dailyEntries = await prisma.dailySalesEntry.findMany({
      where: { salesDate: { gte: startDate, lte: endDate }, status: 'CONFIRMED' },
    });

    let domesticSalesRevenue = new Decimal(0);
    let totalCogs = new Decimal(0);

    for (const s of sales) {
      domesticSalesRevenue = domesticSalesRevenue.plus(new Decimal(s.netAmount.toString()));
      for (const it of s.items) {
        const w = new Decimal(it.netWeightKg.toString());
        totalCogs = totalCogs.plus(w.times(new Decimal(it.product.costPricePerKg.toString())));
      }
    }

    for (const d of dailyEntries) {
      domesticSalesRevenue = domesticSalesRevenue.plus(new Decimal(d.netAmount.toString()));
      totalCogs = totalCogs.plus(new Decimal(d.totalCogs.toString()));
    }

    // Export Sales
    const exportInvoices = await prisma.exportInvoice.findMany({
      where: { invoiceDate: { gte: startDate, lte: endDate } },
    });
    const exportSalesRevenue = exportInvoices.reduce(
      (acc, inv) => acc.plus(new Decimal(inv.totalPkrAmount.toString())),
      new Decimal(0)
    );

    const totalSalesRevenue = domesticSalesRevenue.plus(exportSalesRevenue);
    const grossProfit = totalSalesRevenue.minus(totalCogs);

    // Operating Expenses
    const expenses = await prisma.expense.findMany({
      where: { expenseDate: { gte: startDate, lte: endDate }, status: 'POSTED' },
    });

    const expenseBreakdown: Record<string, Decimal> = {};
    let totalOperatingExpenses = new Decimal(0);

    for (const e of expenses) {
      const cat = e.category || 'OTHER';
      expenseBreakdown[cat] = (expenseBreakdown[cat] || new Decimal(0)).plus(new Decimal(e.amount.toString()));
      totalOperatingExpenses = totalOperatingExpenses.plus(new Decimal(e.amount.toString()));
    }

    // Other Income & FX Realization
    const otherIncomes = await prisma.otherIncome.findMany({
      where: { incomeDate: { gte: startDate, lte: endDate }, status: 'POSTED' },
    });
    const totalOtherIncome = otherIncomes.reduce(
      (acc, inc) => acc.plus(new Decimal(inc.amount.toString())),
      new Decimal(0)
    );

    const exportPayments = await prisma.exportPayment.findMany({
      where: { realizationDate: { gte: startDate, lte: endDate }, status: 'POSTED' },
    });
    const totalFxGainLoss = exportPayments.reduce(
      (acc, pay) => acc.plus(new Decimal(pay.exchangeGainLossPkr.toString())),
      new Decimal(0)
    );

    const operatingProfit = grossProfit.minus(totalOperatingExpenses);
    const netProfit = operatingProfit.plus(totalOtherIncome).plus(totalFxGainLoss);

    sendSuccess(res, {
      revenue: {
        domesticSales: domesticSalesRevenue.toFixed(2),
        exportSales: exportSalesRevenue.toFixed(2),
        totalRevenue: totalSalesRevenue.toFixed(2),
      },
      cogs: {
        totalCogs: totalCogs.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        grossMarginPct: totalSalesRevenue.gt(0)
          ? grossProfit.dividedBy(totalSalesRevenue).times(100).toFixed(2)
          : '0.00',
      },
      expenses: {
        breakdown: Object.entries(expenseBreakdown).map(([category, amount]) => ({
          category,
          amount: amount.toFixed(2),
        })),
        totalExpenses: totalOperatingExpenses.toFixed(2),
        operatingProfit: operatingProfit.toFixed(2),
      },
      other: {
        otherIncome: totalOtherIncome.toFixed(2),
        fxGainLoss: totalFxGainLoss.toFixed(2),
      },
      netProfit: {
        amount: netProfit.toFixed(2),
        netMarginPct: totalSalesRevenue.gt(0)
          ? netProfit.dividedBy(totalSalesRevenue).times(100).toFixed(2)
          : '0.00',
        isProfitable: netProfit.gte(0),
      },
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }, 'Profit & Loss report generated');
  } catch (err) {
    next(err);
  }
};

// 6. Stock Valuation Report
export const getStockValuationReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { warehouseId, categoryId } = req.query;
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId as string;
    if (categoryId) where.product = { categoryId: categoryId as string };

    const stocks = await prisma.stock.findMany({
      where,
      include: {
        product: { include: { category: true } },
        warehouse: true,
      },
      orderBy: [{ warehouse: { name: 'asc' } }, { product: { name: 'asc' } }],
    });

    let grandTotalBags = 0;
    let grandTotalWeightKg = new Decimal(0);
    let grandTotalValuation = new Decimal(0);

    for (const s of stocks) {
      grandTotalBags += s.currentBags;
      const w = new Decimal(s.currentWeightKg.toString());
      grandTotalWeightKg = grandTotalWeightKg.plus(w);
      grandTotalValuation = grandTotalValuation.plus(w.times(new Decimal(s.product.costPricePerKg.toString())));
    }

    const rows = stocks.map((s) => {
      const weight = new Decimal(s.currentWeightKg.toString());
      const costPerKg = new Decimal(s.product.costPricePerKg.toString());
      const val = weight.times(costPerKg);
      const share = grandTotalValuation.gt(0)
        ? val.dividedBy(grandTotalValuation).times(100).toFixed(2)
        : '0.00';

      return {
        id: s.id,
        warehouseName: s.warehouse.name,
        warehouseCode: s.warehouse.code,
        productCode: s.product.code,
        productName: s.product.name,
        variety: s.product.variety,
        grade: s.product.grade,
        categoryName: s.product.category?.name,
        currentBags: s.currentBags,
        currentWeightKg: weight.toFixed(2),
        currentMaunds: weight.dividedBy(40).toFixed(2),
        currentMetricTons: weight.dividedBy(1000).toFixed(3),
        costPricePerKg: costPerKg.toFixed(2),
        costPricePerBag: costPerKg.times(new Decimal(s.product.defaultBagWeightKg.toString())).toFixed(2),
        salePricePerKg: s.product.salePricePerKg.toString(),
        totalValuation: val.toFixed(2),
        sharePct: share,
      };
    });

    sendSuccess(res, {
      rows,
      summary: {
        totalRecords: stocks.length,
        grandTotalBags,
        grandTotalWeightKg: grandTotalWeightKg.toFixed(2),
        grandTotalMaunds: grandTotalWeightKg.dividedBy(40).toFixed(2),
        grandTotalMetricTons: grandTotalWeightKg.dividedBy(1000).toFixed(3),
        grandTotalValuation: grandTotalValuation.toFixed(2),
      },
    }, 'Stock valuation report generated');
  } catch (err) {
    next(err);
  }
};

// 7. Stock Ledger Report
export const getStockLedgerReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = parseDateFilters(req.query);
    const { productId, warehouseId, movementType } = req.query;

    const where: any = { createdAt: { gte: startDate, lte: endDate } };
    if (productId) where.productId = productId as string;
    if (warehouseId) where.warehouseId = warehouseId as string;
    if (movementType) where.movementType = movementType as string;

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { product: true, warehouse: true },
    });

    let totalInwardBags = 0;
    let totalOutwardBags = 0;
    let totalInwardKg = new Decimal(0);
    let totalOutwardKg = new Decimal(0);

    const rows = movements.map((m) => {
      const bagDelta = m.bagCountDelta;
      const wtDelta = new Decimal(m.weightKgDelta.toString());

      if (bagDelta > 0) totalInwardBags += bagDelta;
      else totalOutwardBags += Math.abs(bagDelta);

      if (wtDelta.gt(0)) totalInwardKg = totalInwardKg.plus(wtDelta);
      else totalOutwardKg = totalOutwardKg.plus(wtDelta.abs());

      return {
        id: m.id,
        movementNumber: m.movementNumber,
        date: m.createdAt,
        productName: m.product.name,
        warehouseName: m.warehouse.name,
        movementType: m.movementType,
        bagCountDelta: bagDelta,
        weightKgDelta: wtDelta.toFixed(2),
        referenceType: m.referenceType,
        referenceId: m.referenceId,
        notes: m.notes,
      };
    });

    sendSuccess(res, {
      rows,
      summary: {
        totalMovements: movements.length,
        totalInwardBags,
        totalOutwardBags,
        totalInwardKg: totalInwardKg.toFixed(2),
        totalOutwardKg: totalOutwardKg.toFixed(2),
      },
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }, 'Stock ledger report generated');
  } catch (err) {
    next(err);
  }
};

// 8. Customer Outstanding (Receivables) Report
export const getCustomerOutstandingReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { currentBalance: 'desc' },
      include: {
        sales: { select: { netAmount: true } },
        customerLedgers: { where: { transactionType: 'RECEIPT' }, select: { credit: true } },
      },
    });

    let totalReceivables = new Decimal(0);
    let totalOverdue = new Decimal(0);

    const rows = customers.map((c) => {
      const bal = new Decimal(c.currentBalance.toString());
      const limit = new Decimal(c.creditLimit.toString());
      const isOverLimit = bal.gt(limit);

      totalReceivables = totalReceivables.plus(bal);
      if (isOverLimit) totalOverdue = totalOverdue.plus(bal.minus(limit));

      const totSales = c.sales.reduce((acc, s) => acc.plus(new Decimal(s.netAmount.toString())), new Decimal(0));
      const totReceipts = c.customerLedgers.reduce((acc, cl) => acc.plus(new Decimal(cl.credit.toString())), new Decimal(0));

      return {
        id: c.id,
        customerCode: c.code,
        name: c.name,
        phone: c.phone || 'N/A',
        city: c.city || 'N/A',
        customerType: c.customerType,
        creditLimit: limit.toFixed(2),
        totalPurchases: totSales.toFixed(2),
        totalPayments: totReceipts.toFixed(2),
        currentBalance: bal.toFixed(2),
        isOverLimit,
      };
    });

    sendSuccess(res, {
      rows,
      summary: {
        totalCustomers: customers.length,
        totalReceivables: totalReceivables.toFixed(2),
        totalOverdue: totalOverdue.toFixed(2),
      },
    }, 'Customer outstanding report generated');
  } catch (err) {
    next(err);
  }
};

// 9. Supplier Outstanding (Payables) Report
export const getSupplierOutstandingReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { currentBalance: 'desc' },
      include: {
        purchases: { select: { netAmount: true } },
        supplierLedgers: { where: { transactionType: 'PAYMENT' }, select: { debit: true } },
      },
    });

    let totalPayables = new Decimal(0);

    const rows = suppliers.map((s) => {
      const bal = new Decimal(s.currentBalance.toString());
      totalPayables = totalPayables.plus(bal);

      const totSupplied = s.purchases.reduce((acc, p) => acc.plus(new Decimal(p.netAmount.toString())), new Decimal(0));
      const totPaid = s.supplierLedgers.reduce((acc, sl) => acc.plus(new Decimal(sl.debit.toString())), new Decimal(0));

      return {
        id: s.id,
        code: s.code,
        name: s.name,
        phone: s.phone || 'N/A',
        city: s.city || 'N/A',
        isArthi: s.isArthi,
        paymentTermsDays: s.paymentTerms || '30 Days Net',
        totalSupplied: totSupplied.toFixed(2),
        totalPaid: totPaid.toFixed(2),
        currentBalance: bal.toFixed(2),
      };
    });

    sendSuccess(res, {
      rows,
      summary: {
        totalSuppliers: suppliers.length,
        totalPayables: totalPayables.toFixed(2),
      },
    }, 'Supplier outstanding report generated');
  } catch (err) {
    next(err);
  }
};

// 10. Expenses Report
export const getExpensesReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = parseDateFilters(req.query);
    const { category } = req.query;

    const where: any = {
      expenseDate: { gte: startDate, lte: endDate },
      status: 'POSTED',
    };
    if (category) where.category = category as string;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
      include: { cashAccount: true, bankAccount: true },
    });

    let totalAmount = new Decimal(0);
    const categoryTotals: Record<string, Decimal> = {};

    const rows = expenses.map((e) => {
      const amt = new Decimal(e.amount.toString());
      totalAmount = totalAmount.plus(amt);
      categoryTotals[e.category] = (categoryTotals[e.category] || new Decimal(0)).plus(amt);

      return {
        id: e.id,
        expenseNumber: e.expenseNumber,
        date: e.expenseDate,
        category: e.category,
        title: e.title,
        description: e.description,
        amount: amt.toFixed(2),
        paymentMethod: e.paymentMethod,
        accountName: e.cashAccount?.name || e.bankAccount?.bankName || 'General',
        paidTo: e.paidTo,
        referenceNumber: e.reversalRef || e.expenseNumber,
      };
    });

    sendSuccess(res, {
      rows,
      summary: {
        count: expenses.length,
        totalAmount: totalAmount.toFixed(2),
        categoryBreakdown: Object.entries(categoryTotals).map(([cat, val]) => ({
          category: cat,
          amount: val.toFixed(2),
        })),
      },
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }, 'Expenses report generated');
  } catch (err) {
    next(err);
  }
};

// 11. Commission Report
export const getCommissionReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = parseDateFilters(req.query);

    const agents = await prisma.commissionAgent.findMany({
      include: {
        transactions: { where: { transactionDate: { gte: startDate, lte: endDate } } },
        payments: { where: { paymentDate: { gte: startDate, lte: endDate } } },
      },
      orderBy: { name: 'asc' },
    });

    let totalAccrued = new Decimal(0);
    let totalPaid = new Decimal(0);
    let totalPayable = new Decimal(0);

    const rows = agents.map((a) => {
      const periodAccrued = a.transactions.reduce(
        (sum, t) => sum.plus(new Decimal(t.commissionAmount.toString())),
        new Decimal(0)
      );
      const periodPaid = a.payments.reduce(
        (sum, p) => sum.plus(new Decimal(p.amount.toString())),
        new Decimal(0)
      );
      const bal = new Decimal(a.currentBalance.toString());

      totalAccrued = totalAccrued.plus(periodAccrued);
      totalPaid = totalPaid.plus(periodPaid);
      totalPayable = totalPayable.plus(bal);

      return {
        id: a.id,
        code: a.code,
        name: a.name,
        phone: a.phone || 'N/A',
        mandiCity: a.mandiCity || 'N/A',
        commissionType: a.commissionType,
        defaultRate: a.defaultRate.toString(),
        periodAccrued: periodAccrued.toFixed(2),
        periodPaid: periodPaid.toFixed(2),
        currentBalance: bal.toFixed(2),
      };
    });

    sendSuccess(res, {
      rows,
      summary: {
        totalAgents: agents.length,
        totalPeriodAccrued: totalAccrued.toFixed(2),
        totalPeriodPaid: totalPaid.toFixed(2),
        totalPayable: totalPayable.toFixed(2),
      },
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }, 'Commission report generated');
  } catch (err) {
    next(err);
  }
};

// 12. Warehouse Reports
export const getWarehouseReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        stocks: { include: { product: true } },
      },
      orderBy: { name: 'asc' },
    });

    let grandTotalBags = 0;
    let grandTotalWeightKg = new Decimal(0);
    let grandTotalValuation = new Decimal(0);

    const rows = warehouses.map((w) => {
      let totalBags = 0;
      let totalWeight = new Decimal(0);
      let totalValuation = new Decimal(0);

      for (const s of w.stocks) {
        totalBags += s.currentBags;
        const weight = new Decimal(s.currentWeightKg.toString());
        totalWeight = totalWeight.plus(weight);
        totalValuation = totalValuation.plus(
          weight.times(new Decimal(s.product.costPricePerKg.toString()))
        );
      }

      grandTotalBags += totalBags;
      grandTotalWeightKg = grandTotalWeightKg.plus(totalWeight);
      grandTotalValuation = grandTotalValuation.plus(totalValuation);

      const capKg = w.capacityKg ? new Decimal(w.capacityKg.toString()) : new Decimal(0);
      const utilizationPct = capKg.gt(0)
        ? totalWeight.dividedBy(capKg).times(100).toFixed(1)
        : 'N/A';

      return {
        id: w.id,
        code: w.code,
        name: w.name,
        location: w.location || 'N/A',
        capacityBags: w.capacityBags || 'N/A',
        capacityKg: w.capacityKg ? w.capacityKg.toString() : 'N/A',
        currentBags: totalBags,
        currentWeightKg: totalWeight.toFixed(2),
        currentMaunds: totalWeight.dividedBy(40).toFixed(2),
        currentMetricTons: totalWeight.dividedBy(1000).toFixed(3),
        totalValuation: totalValuation.toFixed(2),
        utilizationPct,
        activeVarietiesCount: w.stocks.filter((s) => s.currentBags > 0).length,
      };
    });

    sendSuccess(res, {
      rows,
      summary: {
        totalWarehouses: warehouses.length,
        grandTotalBags,
        grandTotalWeightKg: grandTotalWeightKg.toFixed(2),
        grandTotalMaunds: grandTotalWeightKg.dividedBy(40).toFixed(2),
        grandTotalMetricTons: grandTotalWeightKg.dividedBy(1000).toFixed(3),
        grandTotalValuation: grandTotalValuation.toFixed(2),
      },
    }, 'Warehouse report generated');
  } catch (err) {
    next(err);
  }
};
