import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import { RiceCalculator } from '../utils/calc';
import Decimal from 'decimal.js';

// ==================== 1. CREATE PURCHASE BILL ====================

export const createPurchase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      supplierId,
      warehouseId,
      purchaseDate = new Date().toISOString(),
      paymentType = 'CREDIT',
      truckNumber,
      biltyNumber,
      items,
      moistureDeductionWeightKg = 0,
      moistureDeductionAmount = 0,
      kardaDeductionAmount = 0,
      commissionRatePercent = 0,
      palledariAmount = 0,
      freightAmount = 0,
      paidAmount = 0,
      cashAccountId,
      bankAccountId,
      notes,
    } = req.body;

    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
      const defaultWh = await prisma.warehouse.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
      if (defaultWh) targetWarehouseId = defaultWh.id;
    }

    if (!supplierId || !targetWarehouseId) {
      throw new AppError('Supplier and destination warehouse are required', 400);
    }
    if (!items || !items.length) {
      throw new AppError('At least one rice product item is required', 400);
    }

    const purchaseResult = await prisma.$transaction(async (tx) => {
      // 1. Verify Supplier and Warehouse
      const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
      if (!supplier || !supplier.isActive) {
        throw new AppError('Supplier / Arthi record not found or inactive', 404);
      }

      const warehouse = await tx.warehouse.findUnique({ where: { id: targetWarehouseId } });
      if (!warehouse || !warehouse.isActive) {
        throw new AppError('Target warehouse not found or inactive', 404);
      }

      // 2. Process Items & Quantities
      let subTotal = new Decimal(0);
      let totalBags = 0;
      let totalNetWeightKg = new Decimal(0);

      const processedItems = [];
      for (const it of items) {
        const product = await tx.riceProduct.findUnique({ where: { id: it.productId } });
        if (!product) throw new AppError(`Product ID ${it.productId} not found`, 404);

        const bags = parseInt(it.bagCount || '0', 10);
        const bagWeight = new Decimal(it.bagWeightKg || product.defaultBagWeightKg.toString());
        const grossWeight = new Decimal(it.grossWeightKg || (bags > 0 ? bagWeight.times(bags) : it.netWeightKg));
        const tare = new Decimal(it.bardanaTareKg || 0);
        const netKg = new Decimal(it.netWeightKg || grossWeight.minus(tare));
        const rateKg = new Decimal(it.unitPricePerKg);
        const lineTotal = netKg.times(rateKg);

        subTotal = subTotal.plus(lineTotal);
        totalBags += bags;
        totalNetWeightKg = totalNetWeightKg.plus(netKg);

        processedItems.push({
          productId: it.productId,
          bagCount: bags,
          bagWeightKg: bagWeight,
          grossWeightKg: grossWeight,
          bardanaTareKg: tare,
          netWeightKg: netKg,
          unitPricePerKg: rateKg,
          lineTotal,
        });
      }

      // 3. Deductions & Expenses
      const moistureCutAmt = new Decimal(moistureDeductionAmount);
      const kardaCutAmt = new Decimal(kardaDeductionAmount);
      const commissionAmt = RiceCalculator.calculateCommission(subTotal, commissionRatePercent);
      const palledariAmt = new Decimal(palledariAmount);
      const freightAmt = new Decimal(freightAmount);

      // Net Amount Payable = SubTotal - MoistureCut - KardaCut + Commission + Palledari + Freight
      const netAmount = subTotal
        .minus(moistureCutAmt)
        .minus(kardaCutAmt)
        .plus(commissionAmt)
        .plus(palledariAmt)
        .plus(freightAmt);

      const paid = new Decimal(paidAmount);
      const balance = netAmount.minus(paid);

      const purchaseNumber = `PUR-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      // 4. Create Purchase Record
      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId,
          warehouseId: targetWarehouseId,
          purchaseDate: new Date(purchaseDate),
          paymentType,
          status: 'BILLED',
          subTotal,
          moistureDeductionWeightKg: new Decimal(moistureDeductionWeightKg),
          moistureDeductionAmount: moistureCutAmt,
          bardanaTareDeductionKg: items.reduce((acc: number, cur: any) => acc + (cur.bardanaTareKg || 0), 0),
          kardaDeductionAmount: kardaCutAmt,
          commissionAmount: commissionAmt,
          palledariAmount: palledariAmt,
          freightAmount: freightAmt,
          netAmount,
          paidAmount: paid,
          balanceAmount: balance,
          truckNumber,
          biltyNumber,
          notes,
          createdById: (req as any).user?.id || null,
          items: {
            create: processedItems,
          },
        },
        include: {
          items: { include: { product: true } },
          supplier: true,
          warehouse: true,
        },
      });

      // 5. Update Inventory Stocks & Record Movements
      for (const item of processedItems) {
        // Landed unit cost attribution: line unit price + proportional freight/palledari
        const proportionalCostPerKg = totalNetWeightKg.isZero()
          ? item.unitPricePerKg
          : item.unitPricePerKg.plus(freightAmt.plus(palledariAmt).dividedBy(totalNetWeightKg));

        const stock = await tx.stock.upsert({
          where: {
            warehouseId_productId: { warehouseId: targetWarehouseId, productId: item.productId },
          },
          update: {
            currentBags: { increment: item.bagCount },
            currentWeightKg: { increment: item.netWeightKg },
            availableBags: { increment: item.bagCount },
            availableWeightKg: { increment: item.netWeightKg },
            lastMovementDate: new Date(),
          },
          create: {
            warehouseId: targetWarehouseId,
            productId: item.productId,
            currentBags: item.bagCount,
            currentWeightKg: item.netWeightKg,
            availableBags: item.bagCount,
            availableWeightKg: item.netWeightKg,
            lastMovementDate: new Date(),
          },
        });

        // Stock movement
        await tx.stockMovement.create({
          data: {
            movementNumber: `MOV-PUR-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            movementType: 'PURCHASE',
            warehouseId: targetWarehouseId,
            productId: item.productId,
            bagCountDelta: item.bagCount,
            weightKgDelta: item.netWeightKg,
            unitCostPerKg: proportionalCostPerKg,
            totalCost: item.netWeightKg.times(proportionalCostPerKg),
            referenceType: 'PurchaseBill',
            referenceId: purchase.purchaseNumber,
            notes: `Procured from ${supplier.name} (Truck: ${truckNumber || 'N/A'}, Bilty: ${biltyNumber || 'N/A'})`,
            createdById: (req as any).user?.id || null,
          },
        });

        // Update product standard cost price if needed
        await tx.riceProduct.update({
          where: { id: item.productId },
          data: { costPricePerKg: item.unitPricePerKg },
        });
      }

      // 6. Post to Supplier Ledger (Khatabook)
      const prevBal = new Decimal(supplier.currentBalance.toString());
      const newBal = prevBal.plus(netAmount).minus(paid);

      await tx.supplier.update({
        where: { id: supplierId },
        data: { currentBalance: newBal },
      });

      // Ledger entry for Bill Credit
      await tx.supplierLedger.create({
        data: {
          supplierId,
          date: new Date(purchaseDate),
          transactionType: 'PURCHASE',
          referenceNo: purchase.purchaseNumber,
          description: `Grain Purchase Bill (Truck: ${truckNumber || 'N/A'}, Bilty: ${biltyNumber || 'N/A'})`,
          debit: 0,
          credit: netAmount,
          runningBalance: prevBal.plus(netAmount),
        },
      });

      // If instant cash/bank payment was made
      if (paid.greaterThan(0)) {
        const payVoucherNo = `PAY-${purchase.purchaseNumber}`;

        await tx.supplierLedger.create({
          data: {
            supplierId,
            date: new Date(purchaseDate),
            transactionType: 'PAYMENT',
            referenceNo: payVoucherNo,
            description: `Payment against purchase bill ${purchase.purchaseNumber}`,
            debit: paid,
            credit: 0,
            runningBalance: newBal,
          },
        });

        // Deduct from Cash or Bank Account
        if (cashAccountId) {
          const cashAcc = await tx.cashAccount.findUnique({ where: { id: cashAccountId } });
          if (cashAcc) {
            await tx.cashAccount.update({
              where: { id: cashAccountId },
              data: { balance: new Decimal(cashAcc.balance.toString()).minus(paid) },
            });
          }
        } else if (bankAccountId) {
          const bankAcc = await tx.bankAccount.findUnique({ where: { id: bankAccountId } });
          if (bankAcc) {
            await tx.bankAccount.update({
              where: { id: bankAccountId },
              data: { currentBalance: new Decimal(bankAcc.currentBalance.toString()).minus(paid) },
            });
          }
        }

        // Create Payment record for accounting traceability
        await tx.payment.create({
          data: {
            paymentNumber: payVoucherNo,
            supplierId,
            paymentDate: new Date(purchaseDate),
            amount: paid,
            paymentMethod: paymentType === 'CASH' ? 'CASH' : paymentType === 'BANK' ? 'BANK' : 'PARTIAL',
            cashAccountId: cashAccountId || null,
            bankAccountId: bankAccountId || null,
            referenceNumber: purchase.purchaseNumber,
            notes: `Disbursement on Purchase Bill ${purchase.purchaseNumber}`,
            createdById: (req as any).user?.id || null,
          },
        });
      }

      return purchase;
    });

    sendSuccess(res, purchaseResult, 'Purchase bill recorded, stock updated, and ledger posted', 201);
  } catch (err) {
    next(err);
  }
};

// ==================== 2. LIST PURCHASES (HISTORY) ====================

export const getPurchases = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { supplierId, warehouseId, paymentType, search, startDate, endDate, limit = '50', page = '1' } = req.query;

    const take = parseInt(limit as string, 10);
    const skip = (parseInt(page as string, 10) - 1) * take;

    const where: any = {};
    if (supplierId) where.supplierId = supplierId as string;
    if (warehouseId) where.warehouseId = warehouseId as string;
    if (paymentType) where.paymentType = paymentType as any;
    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) where.purchaseDate.gte = new Date(startDate as string);
      if (endDate) where.purchaseDate.lte = new Date(endDate as string);
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { purchaseNumber: { contains: search, mode: 'insensitive' } },
        { truckNumber: { contains: search, mode: 'insensitive' } },
        { biltyNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          supplier: true,
          warehouse: true,
          items: {
            include: { product: true },
          },
          returns: true,
        },
        orderBy: { purchaseDate: 'desc' },
        take,
        skip,
      }),
      prisma.purchase.count({ where }),
    ]);

    const formatted = purchases.map((p) => {
      const totalBags = p.items.reduce((acc, it) => acc + it.bagCount, 0);
      const totalWeightKg = p.items.reduce(
        (acc, it) => acc.plus(new Decimal(it.netWeightKg.toString())),
        new Decimal(0)
      );

      return {
        id: p.id,
        purchaseNumber: p.purchaseNumber,
        purchaseDate: p.purchaseDate,
        supplier: { id: p.supplier.id, name: p.supplier.name, code: p.supplier.code, phone: p.supplier.phone },
        warehouse: { id: p.warehouse.id, name: p.warehouse.name, code: p.warehouse.code },
        paymentType: p.paymentType,
        status: p.status,
        truckNumber: p.truckNumber,
        biltyNumber: p.biltyNumber,
        subTotal: p.subTotal,
        moistureDeductionAmount: p.moistureDeductionAmount,
        kardaDeductionAmount: p.kardaDeductionAmount,
        commissionAmount: p.commissionAmount,
        palledariAmount: p.palledariAmount,
        freightAmount: p.freightAmount,
        netAmount: p.netAmount,
        paidAmount: p.paidAmount,
        balanceAmount: p.balanceAmount,
        totalBags,
        totalWeightKg: totalWeightKg.toFixed(2),
        totalMaunds: totalWeightKg.dividedBy(40).toFixed(2),
        hasReturns: p.returns.length > 0,
        itemsCount: p.items.length,
      };
    });

    sendSuccess(res, formatted, 'Purchases retrieved successfully', 200, {
      page: parseInt(page as string, 10),
      limit: take,
      totalCount: total,
      totalPages: Math.ceil(total / take),
    });
  } catch (err) {
    next(err);
  }
};

// ==================== 3. GET PURCHASE DETAILS ====================

export const getPurchaseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const purchase = await prisma.purchase.findUnique({
      where: { id: id as string },
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: { product: { include: { category: true } } },
        },
        returns: true,
        commissions: true,
      },
    });

    if (!purchase) {
      throw new AppError('Purchase bill not found', 404);
    }

    sendSuccess(res, purchase, 'Purchase details retrieved');
  } catch (err) {
    next(err);
  }
};

// ==================== 4. PURCHASE RETURN (DEBIT NOTE) ====================

export const createPurchaseReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let { purchaseId, returnDate = new Date().toISOString(), items, reason } = req.body;

    if (!items && req.body.productId) {
      items = [
        {
          productId: req.body.productId,
          bagCount: req.body.bagsReturned || 0,
          weightKg: req.body.weightReturnedKg,
          unitPricePerKg: req.body.returnRatePerKg,
        },
      ];
    }

    if (!purchaseId || !items || !items.length) {
      throw new AppError('Purchase ID and returned items are required', 400);
    }

    const returnResult = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({
        where: { id: purchaseId },
        include: { supplier: true, warehouse: true, items: true },
      });

      if (!purchase) {
        throw new AppError('Original purchase bill not found', 404);
      }

      let totalReturnBags = 0;
      let totalReturnWeightKg = new Decimal(0);
      let totalReturnAmount = new Decimal(0);

      const returnNo = `PRT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      for (const it of items) {
        const bags = parseInt(it.bagCount || '0', 10);
        const weight = new Decimal(it.weightKg);
        const rate = new Decimal(it.unitPricePerKg);
        const lineAmount = weight.times(rate);

        totalReturnBags += bags;
        totalReturnWeightKg = totalReturnWeightKg.plus(weight);
        totalReturnAmount = totalReturnAmount.plus(lineAmount);

        // Check stock availability in warehouse
        const stock = await tx.stock.findUnique({
          where: { warehouseId_productId: { warehouseId: purchase.warehouseId, productId: it.productId } },
        });

        if (!stock || new Decimal(stock.availableWeightKg.toString()).lessThan(weight)) {
          throw new AppError(
            `Insufficient warehouse stock to process purchase return for product ID ${it.productId}. Available: ${stock?.availableWeightKg || 0} Kg. Requested return: ${weight} Kg.`,
            409
          );
        }

        // Deduct stock
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            currentBags: { decrement: bags },
            currentWeightKg: { decrement: weight },
            availableBags: { decrement: bags },
            availableWeightKg: { decrement: weight },
            lastMovementDate: new Date(),
          },
        });

        // Stock movement
        await tx.stockMovement.create({
          data: {
            movementNumber: `MOV-PRT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            movementType: 'PURCHASE_RETURN',
            warehouseId: purchase.warehouseId,
            productId: it.productId,
            bagCountDelta: -bags,
            weightKgDelta: weight.negated(),
            unitCostPerKg: rate,
            totalCost: lineAmount,
            referenceType: 'PurchaseReturn',
            referenceId: returnNo,
            notes: `Purchase Return to ${purchase.supplier.name}: ${reason || 'Grain quality rejection'}`,
            createdById: (req as any).user?.id || null,
          },
        });
      }

      // Create PurchaseReturn record
      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          returnNumber: returnNo,
          purchaseId,
          supplierId: purchase.supplierId,
          returnDate: new Date(returnDate),
          totalBags: totalReturnBags,
          totalWeightKg: totalReturnWeightKg,
          totalAmount: totalReturnAmount,
          reason,
        },
      });

      // Update Supplier Balance & Post to Supplier Ledger (DEBIT)
      const prevBal = new Decimal(purchase.supplier.currentBalance.toString());
      const newBal = prevBal.minus(totalReturnAmount);

      await tx.supplier.update({
        where: { id: purchase.supplierId },
        data: { currentBalance: newBal },
      });

      await tx.supplierLedger.create({
        data: {
          supplierId: purchase.supplierId,
          date: new Date(returnDate),
          transactionType: 'PURCHASE_RETURN',
          referenceNo: returnNo,
          description: `Debit Note: Purchase return on Bill ${purchase.purchaseNumber} (${reason || 'Quality rejection'})`,
          debit: totalReturnAmount,
          credit: 0,
          runningBalance: newBal,
        },
      });

      return purchaseReturn;
    });

    sendSuccess(res, returnResult, 'Purchase return processed, debit note generated, and inventory deducted', 201);
  } catch (err) {
    next(err);
  }
};

// ==================== 5. PURCHASE RATE HISTORY ====================

export const getPurchaseRateHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.query;

    const where: any = {};
    if (productId) where.productId = productId as string;

    const items = await prisma.purchaseItem.findMany({
      where,
      include: {
        product: true,
        purchase: {
          include: { supplier: true },
        },
      },
      orderBy: { purchase: { purchaseDate: 'desc' } },
      take: 30,
    });

    const rates = items.map((it) => ({
      purchaseId: it.purchase.id,
      purchaseNumber: it.purchase.purchaseNumber,
      date: it.purchase.purchaseDate,
      supplierName: it.purchase.supplier.name,
      productName: it.product.name,
      bagCount: it.bagCount,
      netWeightKg: it.netWeightKg,
      ratePerKg: it.unitPricePerKg,
      ratePerMaund: new Decimal(it.unitPricePerKg.toString()).times(40).toFixed(2),
      freightPerKg: new Decimal(it.purchase.freightAmount.toString()).dividedBy(new Decimal(it.netWeightKg.toString()).isZero() ? 1 : it.netWeightKg.toString()).toFixed(2),
    }));

    sendSuccess(res, rates, 'Purchase rate history retrieved');
  } catch (err) {
    next(err);
  }
};

// ==================== 6. SUPPLIER STATEMENT OF ACCOUNT ====================

export const getSupplierStatement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { supplierId } = req.params;
    const { startDate, endDate } = req.query;

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId as string },
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    const where: any = { supplierId: supplierId as string };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const ledgers = await prisma.supplierLedger.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // Opening balance before startDate
    let openingBalance = new Decimal(supplier.openingBalance.toString());
    if (startDate) {
      const priorEntries = await prisma.supplierLedger.findMany({
        where: {
          supplierId: supplierId as string,
          date: { lt: new Date(startDate as string) },
        },
        orderBy: { date: 'asc' },
      });
      if (priorEntries.length > 0) {
        const lastPrior = priorEntries[priorEntries.length - 1];
        openingBalance = new Decimal(lastPrior.runningBalance.toString());
      }
    }

    const totalDebit = ledgers.reduce((acc, l) => acc.plus(new Decimal(l.debit.toString())), new Decimal(0));
    const totalCredit = ledgers.reduce((acc, l) => acc.plus(new Decimal(l.credit.toString())), new Decimal(0));

    sendSuccess(res, {
      supplier: {
        id: supplier.id,
        name: supplier.name,
        code: supplier.code,
        phone: supplier.phone,
        city: supplier.city,
        currentBalance: supplier.currentBalance,
      },
      period: { startDate, endDate },
      openingBalance: openingBalance.toFixed(2),
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      closingBalance: supplier.currentBalance,
      transactions: ledgers,
    });
  } catch (err) {
    next(err);
  }
};
