import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import { RiceCalculator } from '../utils/calc';
import Decimal from 'decimal.js';

// ==================== 1. GET DAILY SALES SHEET & RECONCILIATION ====================

export const getDailySalesSheet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, warehouseId } = req.query;

    let targetWarehouseId = warehouseId as string;
    if (!targetWarehouseId || typeof targetWarehouseId !== 'string') {
      const defaultWh = await prisma.warehouse.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
      if (!defaultWh) {
        throw new AppError('Warehouse ID is required to load daily sales sheet', 400);
      }
      targetWarehouseId = defaultWh.id;
    }

    const targetDate = date ? new Date(date as string) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // 1. Fetch Warehouse Details
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: targetWarehouseId },
    });
    if (!warehouse) {
      throw new AppError('Warehouse not found', 404);
    }

    // 2. Load all active products with current stock in this warehouse
    const products = await prisma.riceProduct.findMany({
      where: { isActive: true },
      include: {
        category: true,
        stocks: {
          where: { warehouseId: targetWarehouseId },
        },
      },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });

    const productsCatalog = products.map((p) => {
      const stock = p.stocks[0];
      return {
        id: p.id,
        code: p.code,
        name: p.name,
        variety: p.variety,
        grade: p.grade,
        category: p.category.name,
        defaultBagWeightKg: parseFloat(p.defaultBagWeightKg.toString()),
        costPricePerKg: parseFloat(p.costPricePerKg.toString()),
        salePricePerKg: parseFloat(p.salePricePerKg.toString()),
        availableBags: stock ? stock.availableBags : 0,
        availableWeightKg: stock ? parseFloat(stock.availableWeightKg.toString()) : 0,
        availableMaunds: stock ? parseFloat(new Decimal(stock.availableWeightKg.toString()).dividedBy(40).toFixed(2)) : 0,
      };
    });

    // 3. Load Existing DailySalesEntry for this date & warehouse (if any)
    const existingEntry = await prisma.dailySalesEntry.findFirst({
      where: {
        salesDate: targetDate,
        warehouseId: targetWarehouseId,
      },
      include: {
        lines: {
          include: { product: true },
        },
        customerAllocations: {
          include: { customer: true },
        },
        cashAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Reconciliation: Load Individual Sales Invoices already registered on this date
    const individualInvoices = await prisma.sale.findMany({
      where: {
        warehouseId: targetWarehouseId,
        saleDate: {
          gte: targetDate,
          lt: nextDate,
        },
      },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    let individualBags = 0;
    let individualWeightKg = new Decimal(0);
    let individualAmount = new Decimal(0);
    const itemBreakdownMap: Record<string, { productName: string; bags: number; weightKg: Decimal; amount: Decimal }> = {};

    for (const inv of individualInvoices) {
      individualAmount = individualAmount.plus(new Decimal(inv.netAmount.toString()));
      for (const item of inv.items) {
        individualBags += item.bagCount;
        const w = new Decimal(item.netWeightKg.toString());
        individualWeightKg = individualWeightKg.plus(w);

        const key = item.productId;
        if (!itemBreakdownMap[key]) {
          itemBreakdownMap[key] = {
            productName: item.product.name,
            bags: 0,
            weightKg: new Decimal(0),
            amount: new Decimal(0),
          };
        }
        itemBreakdownMap[key].bags += item.bagCount;
        itemBreakdownMap[key].weightKg = itemBreakdownMap[key].weightKg.plus(w);
        itemBreakdownMap[key].amount = itemBreakdownMap[key].amount.plus(new Decimal(item.lineTotal.toString()));
      }
    }

    const individualSalesSummary = {
      totalInvoices: individualInvoices.length,
      totalBags: individualBags,
      totalWeightKg: individualWeightKg.toFixed(2),
      totalMaunds: individualWeightKg.dividedBy(40).toFixed(2),
      totalAmount: individualAmount.toFixed(2),
      items: Object.entries(itemBreakdownMap).map(([productId, val]) => ({
        productId,
        productName: val.productName,
        bags: val.bags,
        weightKg: val.weightKg.toFixed(2),
        amount: val.amount.toFixed(2),
      })),
    };

    // 5. Cash accounts & Active customers for dropdowns
    const cashAccounts = await prisma.cashAccount.findMany({
      orderBy: { code: 'asc' },
    });
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, phone: true, currentBalance: true },
      orderBy: { name: 'asc' },
    });

    sendSuccess(res, {
      date: targetDate.toISOString().split('T')[0],
      warehouse: { id: warehouse.id, name: warehouse.name, code: warehouse.code },
      productsCatalog,
      existingEntry,
      individualSalesSummary,
      cashAccounts,
      customers,
    });
  } catch (err) {
    next(err);
  }
};

// ==================== 2. SAVE DAILY SALES DRAFT ====================

export const saveDailySalesDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      entryId,
      salesDate,
      warehouseId,
      lines,
      discountAmount = 0,
      commissionAmount = 0,
      cashAmount = 0,
      creditAmount = 0,
      unallocatedCredit = 0,
      cashAccountId,
      customerAllocations = [],
      notes,
    } = req.body;

    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
      const defaultWh = await prisma.warehouse.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
      if (defaultWh) {
        targetWarehouseId = defaultWh.id;
      }
    }

    if (!targetWarehouseId || !salesDate) {
      throw new AppError('Warehouse ID and sales date are required', 400);
    }

    const targetDate = new Date(salesDate);
    targetDate.setHours(0, 0, 0, 0);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if an existing confirmed entry already exists for this date and warehouse
      const existingConfirmed = await tx.dailySalesEntry.findFirst({
        where: {
          salesDate: targetDate,
          warehouseId: targetWarehouseId,
          status: 'CONFIRMED',
          id: entryId ? { not: entryId } : undefined,
        },
      });

      if (existingConfirmed) {
        throw new AppError(
          `A confirmed daily closing already exists for this date (${salesDate}) in this warehouse [${existingConfirmed.entryNumber}]. Modification blocked.`,
          409
        );
      }

      // 2. Calculate line totals and COGS
      let grossAmount = new Decimal(0);
      let totalCogs = new Decimal(0);
      let totalBags = 0;
      let totalWeightKg = new Decimal(0);

      const processedLines = [];
      for (const line of lines) {
        if (!line.productId) continue;
        const bags = parseInt(line.bagCount || '0', 10);
        const weight = new Decimal(line.weightKg || 0);
        const rate = new Decimal(line.ratePerKg || 0);

        if (weight.isZero() && bags === 0) continue;

        const product = await tx.riceProduct.findUnique({ where: { id: line.productId } });
        if (!product) throw new AppError(`Product ID ${line.productId} not found`, 404);

        const lineTotal = weight.times(rate);
        const unitCost = new Decimal(line.unitCostPerKg || product.costPricePerKg.toString());
        const cogs = weight.times(unitCost);
        const profit = lineTotal.minus(cogs);

        grossAmount = grossAmount.plus(lineTotal);
        totalCogs = totalCogs.plus(cogs);
        totalBags += bags;
        totalWeightKg = totalWeightKg.plus(weight);

        processedLines.push({
          productId: line.productId,
          bagCount: bags,
          weightKg: weight,
          ratePerKg: rate,
          lineTotal,
          unitCostPerKg: unitCost,
          cogsAmount: cogs,
          grossProfit: profit,
        });
      }

      const netAmount = grossAmount.minus(new Decimal(discountAmount)).minus(new Decimal(commissionAmount));
      const grossProfit = netAmount.minus(totalCogs);

      // 3. Process Customer Allocations
      let sumAllocatedCredit = new Decimal(0);
      const processedAllocations = [];
      for (const alloc of customerAllocations) {
        const amt = new Decimal(alloc.amount || 0);
        if (amt.isZero()) continue;

        let customerName = alloc.customerName || 'Counter Customer';
        if (alloc.customerId) {
          const cust = await tx.customer.findUnique({ where: { id: alloc.customerId } });
          if (cust) customerName = cust.name;
        }

        sumAllocatedCredit = sumAllocatedCredit.plus(amt);
        processedAllocations.push({
          customerId: alloc.customerId || null,
          customerName,
          amount: amt,
          notes: alloc.notes || null,
        });
      }

      // Auto-compute unallocated credit
      const totalCredit = new Decimal(creditAmount);
      const computedUnallocated = totalCredit.minus(sumAllocatedCredit);
      const finalUnallocated = computedUnallocated.greaterThan(0) ? computedUnallocated : new Decimal(0);

      // 4. Upsert DailySalesEntry
      let entry;
      if (entryId) {
        const current = await tx.dailySalesEntry.findUnique({ where: { id: entryId } });
        if (!current) throw new AppError('Daily sales entry not found to update', 404);
        if (current.status === 'CONFIRMED') {
          throw new AppError('Cannot edit a confirmed and locked daily closing', 400);
        }

        // Delete existing lines and re-create
        await tx.dailySalesEntryLine.deleteMany({ where: { entryId } });
        await tx.dailySalesCustomerAllocation.deleteMany({ where: { entryId } });

        entry = await tx.dailySalesEntry.update({
          where: { id: entryId },
          data: {
            salesDate: targetDate,
            warehouseId: targetWarehouseId,
            status: 'DRAFT',
            grossAmount,
            discountAmount: new Decimal(discountAmount),
            commissionAmount: new Decimal(commissionAmount),
            netAmount,
            totalCogs,
            grossProfit,
            totalBagsSold: totalBags,
            totalWeightSoldKg: totalWeightKg,
            cashAmount: new Decimal(cashAmount),
            creditAmount: totalCredit,
            unallocatedCredit: finalUnallocated,
            cashAccountId: cashAccountId || null,
            notes,
            lines: { create: processedLines },
            customerAllocations: { create: processedAllocations },
          },
          include: {
            lines: { include: { product: true } },
            customerAllocations: { include: { customer: true } },
          },
        });
      } else {
        const entryNo = `DSE-${targetDate.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

        entry = await tx.dailySalesEntry.create({
          data: {
            entryNumber: entryNo,
            salesDate: targetDate,
            warehouseId: targetWarehouseId,
            status: 'DRAFT',
            grossAmount,
            discountAmount: new Decimal(discountAmount),
            commissionAmount: new Decimal(commissionAmount),
            netAmount,
            totalCogs,
            grossProfit,
            totalBagsSold: totalBags,
            totalWeightSoldKg: totalWeightKg,
            cashAmount: new Decimal(cashAmount),
            creditAmount: totalCredit,
            unallocatedCredit: finalUnallocated,
            cashAccountId: cashAccountId || null,
            notes,
            createdById: (req as any).user?.id || null,
            lines: { create: processedLines },
            customerAllocations: { create: processedAllocations },
          },
          include: {
            lines: { include: { product: true } },
            customerAllocations: { include: { customer: true } },
          },
        });
      }

      return entry;
    });

    sendSuccess(res, result, 'Daily sales draft saved successfully', 200);
  } catch (err) {
    next(err);
  }
};

// ==================== 3. CONFIRM & LOCK DAILY CLOSING ====================

export const confirmDailySales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const entry = await tx.dailySalesEntry.findUnique({
        where: { id: id as string },
        include: {
          lines: { include: { product: true } },
          customerAllocations: { include: { customer: true } },
          warehouse: true,
        },
      });

      if (!entry) {
        throw new AppError('Daily sales entry not found', 404);
      }

      if (entry.status === 'CONFIRMED') {
        throw new AppError('This daily sales entry is already confirmed and locked. Duplicate stock deductions prevented.', 409);
      }

      if (entry.status === 'REVERSED') {
        throw new AppError('Cannot confirm a reversed daily sales entry. Create a new entry.', 400);
      }

      if (!entry.lines.length) {
        throw new AppError('Cannot confirm daily sales with zero product lines', 400);
      }

      // 1. Pre-flight stock check: verify adequate physical stock in the warehouse
      const settings = await tx.companySettings.findFirst();
      const allowNegative = settings?.allowNegativeInventory ?? false;

      for (const line of entry.lines) {
        const stock = await tx.stock.findUnique({
          where: {
            warehouseId_productId: { warehouseId: entry.warehouseId, productId: line.productId },
          },
        });

        const reqBags = line.bagCount;
        const reqWeightKg = new Decimal(line.weightKg.toString());

        if (!allowNegative) {
          if (!stock || stock.availableBags < reqBags || new Decimal(stock.availableWeightKg.toString()).lessThan(reqWeightKg)) {
            throw new AppError(
              `Insufficient stock for '${line.product.name}' in '${entry.warehouse.name}'. Available: ${stock?.availableBags || 0} Bags (${stock?.availableWeightKg || 0} Kg). Requested for closing: ${reqBags} Bags (${reqWeightKg} Kg).`,
              409
            );
          }
        }
      }

      // 2. Deduct Warehouse Stock & Post Stock Movements
      for (const line of entry.lines) {
        const reqBags = line.bagCount;
        const reqWeightKg = new Decimal(line.weightKg.toString());

        await tx.stock.update({
          where: {
            warehouseId_productId: { warehouseId: entry.warehouseId, productId: line.productId },
          },
          data: {
            currentBags: { decrement: reqBags },
            currentWeightKg: { decrement: reqWeightKg },
            availableBags: { decrement: reqBags },
            availableWeightKg: { decrement: reqWeightKg },
            lastMovementDate: new Date(),
          },
        });

        await tx.stockMovement.create({
          data: {
            movementNumber: `MOV-DSE-${entry.entryNumber}-${line.product.code}`,
            movementType: 'SALE',
            warehouseId: entry.warehouseId,
            productId: line.productId,
            bagCountDelta: -reqBags,
            weightKgDelta: reqWeightKg.negated(),
            unitCostPerKg: line.unitCostPerKg,
            totalCost: line.cogsAmount,
            referenceType: 'DailySalesEntry',
            referenceId: entry.entryNumber,
            notes: `Daily closing sales dispatch (${entry.salesDate.toISOString().split('T')[0]})`,
            createdById: (req as any).user?.id || null,
          },
        });
      }

      // 3. Post Cash Received (if cash sales present)
      const cashAmt = new Decimal(entry.cashAmount.toString());
      if (cashAmt.greaterThan(0) && entry.cashAccountId) {
        await tx.cashAccount.update({
          where: { id: entry.cashAccountId },
          data: { balance: { increment: cashAmt } },
        });
      }

      // 4. Post Customer Ledgers (for allocated credit)
      for (const alloc of entry.customerAllocations) {
        if (alloc.customerId) {
          const allocAmt = new Decimal(alloc.amount.toString());
          const customer = await tx.customer.findUnique({ where: { id: alloc.customerId } });
          if (customer) {
            const newBal = new Decimal(customer.currentBalance.toString()).plus(allocAmt);

            await tx.customer.update({
              where: { id: alloc.customerId },
              data: { currentBalance: newBal },
            });

            await tx.customerLedger.create({
              data: {
                customerId: alloc.customerId,
                date: entry.salesDate,
                transactionType: 'SALE',
                referenceNo: entry.entryNumber,
                description: `Daily sales credit allocation for ${entry.salesDate.toISOString().split('T')[0]}${alloc.notes ? ` - ${alloc.notes}` : ''}`,
                debit: allocAmt,
                credit: 0,
                runningBalance: newBal,
              },
            });
          }
        }
      }

      // 5. Update Entry Status to CONFIRMED
      const confirmed = await tx.dailySalesEntry.update({
        where: { id: entry.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          confirmedById: (req as any).user?.id || null,
        },
        include: {
          lines: { include: { product: true } },
          customerAllocations: { include: { customer: true } },
          warehouse: true,
          cashAccount: true,
        },
      });

      return confirmed;
    });

    sendSuccess(res, result, 'Daily sales closing confirmed, inventory deducted, and financial accounts posted', 200);
  } catch (err) {
    next(err);
  }
};

// ==================== 4. REVERSE DAILY CLOSING ====================

export const reverseDailySales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new AppError('A valid operational reason is required to reverse a confirmed daily closing', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const entry = await tx.dailySalesEntry.findUnique({
        where: { id: id as string },
        include: {
          lines: { include: { product: true } },
          customerAllocations: { include: { customer: true } },
          warehouse: true,
        },
      });

      if (!entry) {
        throw new AppError('Daily sales entry not found', 404);
      }

      if (entry.status !== 'CONFIRMED') {
        throw new AppError('Only confirmed daily sales entries can be reversed', 400);
      }

      // 1. Reverse Stock Deductions
      for (const line of entry.lines) {
        const reqBags = line.bagCount;
        const reqWeightKg = new Decimal(line.weightKg.toString());

        await tx.stock.update({
          where: {
            warehouseId_productId: { warehouseId: entry.warehouseId, productId: line.productId },
          },
          data: {
            currentBags: { increment: reqBags },
            currentWeightKg: { increment: reqWeightKg },
            availableBags: { increment: reqBags },
            availableWeightKg: { increment: reqWeightKg },
            lastMovementDate: new Date(),
          },
        });

        await tx.stockMovement.create({
          data: {
            movementNumber: `MOV-REV-DSE-${entry.entryNumber}-${line.product.code}`,
            movementType: 'SALE_RETURN',
            warehouseId: entry.warehouseId,
            productId: line.productId,
            bagCountDelta: reqBags,
            weightKgDelta: reqWeightKg,
            unitCostPerKg: line.unitCostPerKg,
            totalCost: line.cogsAmount,
            referenceType: 'DailySalesReversal',
            referenceId: entry.entryNumber,
            notes: `Reversal of Daily Closing ${entry.entryNumber}: ${reason}`,
            createdById: (req as any).user?.id || null,
          },
        });
      }

      // 2. Reverse Cash Account increment
      const cashAmt = new Decimal(entry.cashAmount.toString());
      if (cashAmt.greaterThan(0) && entry.cashAccountId) {
        await tx.cashAccount.update({
          where: { id: entry.cashAccountId },
          data: { balance: { decrement: cashAmt } },
        });
      }

      // 3. Reverse Customer Ledgers
      for (const alloc of entry.customerAllocations) {
        if (alloc.customerId) {
          const allocAmt = new Decimal(alloc.amount.toString());
          const customer = await tx.customer.findUnique({ where: { id: alloc.customerId } });
          if (customer) {
            const newBal = new Decimal(customer.currentBalance.toString()).minus(allocAmt);

            await tx.customer.update({
              where: { id: alloc.customerId },
              data: { currentBalance: newBal },
            });

            await tx.customerLedger.create({
              data: {
                customerId: alloc.customerId,
                date: new Date(),
                transactionType: 'SALE_RETURN',
                referenceNo: `REV-${entry.entryNumber}`,
                description: `Reversal of daily sales credit allocation: ${reason}`,
                debit: 0,
                credit: allocAmt,
                runningBalance: newBal,
              },
            });
          }
        }
      }

      // 4. Update Entry Status to REVERSED
      const reversed = await tx.dailySalesEntry.update({
        where: { id: entry.id },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          reversedById: (req as any).user?.id || null,
          reversalReason: reason,
        },
        include: {
          lines: { include: { product: true } },
          customerAllocations: { include: { customer: true } },
        },
      });

      return reversed;
    });

    sendSuccess(res, result, 'Daily sales closing reversed, inventory restored, and financial entries adjusted', 200);
  } catch (err) {
    next(err);
  }
};

// ==================== 5. LIST PAST ENTRIES & CLOSINGS ====================

export const getDailySalesHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { warehouseId, startDate, endDate, status } = req.query;

    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId as string;
    if (status) where.status = status as any;
    if (startDate || endDate) {
      where.salesDate = {};
      if (startDate) where.salesDate.gte = new Date(startDate as string);
      if (endDate) where.salesDate.lte = new Date(endDate as string);
    }

    const entries = await prisma.dailySalesEntry.findMany({
      where,
      include: {
        warehouse: true,
        lines: { include: { product: true } },
        customerAllocations: { include: { customer: true } },
        cashAccount: true,
      },
      orderBy: { salesDate: 'desc' },
      take: 50,
    });

    sendSuccess(res, entries, 'Daily sales history retrieved');
  } catch (err) {
    next(err);
  }
};

// ==================== 6. DAILY CLOSING REPORT ====================

export const getDailyClosingReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const entry = await prisma.dailySalesEntry.findUnique({
      where: { id: id as string },
      include: {
        warehouse: true,
        cashAccount: true,
        lines: {
          include: { product: { include: { category: true } } },
        },
        customerAllocations: {
          include: { customer: true },
        },
      },
    });

    if (!entry) {
      throw new AppError('Daily sales entry record not found', 404);
    }

    const settings = await prisma.companySettings.findFirst();

    sendSuccess(res, {
      company: settings,
      entry,
      metrics: {
        totalBags: entry.totalBagsSold,
        totalWeightKg: entry.totalWeightSoldKg,
        totalMaunds: new Decimal(entry.totalWeightSoldKg.toString()).dividedBy(40).toFixed(2),
        grossRevenue: entry.grossAmount,
        discount: entry.discountAmount,
        commission: entry.commissionAmount,
        netRevenue: entry.netAmount,
        cogs: entry.totalCogs,
        grossProfit: entry.grossProfit,
        grossMarginPct: new Decimal(entry.netAmount.toString()).isZero()
          ? '0.00'
          : new Decimal(entry.grossProfit.toString()).dividedBy(new Decimal(entry.netAmount.toString())).times(100).toFixed(2),
        cashReceived: entry.cashAmount,
        allocatedCredit: new Decimal(entry.creditAmount.toString()).minus(new Decimal(entry.unallocatedCredit.toString())).toFixed(2),
        unallocatedCredit: entry.unallocatedCredit,
      },
    });
  } catch (err) {
    next(err);
  }
};
