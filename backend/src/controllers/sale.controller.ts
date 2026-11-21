import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import Decimal from 'decimal.js';

export const createSale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      customerId,
      warehouseId,
      saleDate = new Date().toISOString(),
      paymentType,
      items,
      discountAmount = 0,
      taxAmount = 0,
      freightAmount = 0,
      paidAmount = 0,
      cashAccountId,
      bankAccountId,
      truckNumber,
      gatePassNumber,
      notes,
    } = req.body;

    const saleResult = await prisma.$transaction(async (tx) => {
      // 1. Verify Warehouse & Customer
      const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouse || !warehouse.isActive) {
        throw new AppError('Dispatch warehouse not found or inactive', 404);
      }

      let customer: any = null;
      if (customerId) {
        customer = await tx.customer.findUnique({ where: { id: customerId } });
        if (!customer || !customer.isActive) {
          throw new AppError('Customer account not found or inactive', 404);
        }
      }

      const settings = await tx.companySettings.findFirst();
      const allowNegative = settings?.allowNegativeInventory ?? false;

      // 2. Validate Stock and Calculate Totals
      let subTotal = new Decimal(0);
      let totalBags = 0;
      let totalWeightKg = new Decimal(0);

      const processedItems = [];

      for (const it of items) {
        const product = await tx.riceProduct.findUnique({ where: { id: it.productId } });
        if (!product || !product.isActive) {
          throw new AppError(`Product ID ${it.productId} not found or inactive`, 404);
        }

        const stock = await tx.stock.findUnique({
          where: {
            warehouseId_productId: { warehouseId, productId: it.productId },
          },
        });

        const reqBags = it.bagCount || 0;
        const reqWeightKg = new Decimal(it.netWeightKg);

        if (!allowNegative) {
          if (!stock || stock.availableBags < reqBags || new Decimal(stock.availableWeightKg.toString()).lessThan(reqWeightKg)) {
            throw new AppError(
              `Insufficient stock for '${product.name}' in '${warehouse.name}'. Available: ${stock?.availableBags || 0} Bags (${stock?.availableWeightKg || 0} Kg). Requested: ${reqBags} Bags (${reqWeightKg} Kg).`,
              409
            );
          }
        }

        const rateKg = new Decimal(it.unitPricePerKg);
        const lineTotal = reqWeightKg.times(rateKg);
        subTotal = subTotal.plus(lineTotal);
        totalBags += reqBags;
        totalWeightKg = totalWeightKg.plus(reqWeightKg);

        processedItems.push({
          productId: it.productId,
          bagCount: reqBags,
          bagWeightKg: it.bagWeightKg || product.defaultBagWeightKg,
          netWeightKg: reqWeightKg.toFixed(4),
          unitPricePerKg: rateKg.toFixed(4),
          unitPricePerBag: it.unitPricePerBag ? new Decimal(it.unitPricePerBag).toFixed(4) : null,
          lineTotal: lineTotal.toFixed(4),
        });
      }

      // 3. Totals with discounts, tax & freight
      const discount = new Decimal(discountAmount);
      const tax = new Decimal(taxAmount);
      const freight = new Decimal(freightAmount);

      const netAmount = subTotal.minus(discount).plus(tax).plus(freight);
      const paid = new Decimal(paidAmount);
      const balance = netAmount.minus(paid);

      // Check Customer Credit Limit
      if (customer && balance.greaterThan(0)) {
        const creditLimit = new Decimal(customer.creditLimit.toString());
        if (creditLimit.greaterThan(0)) {
          const currentBal = new Decimal(customer.openingBalance.toString());
          if (currentBal.plus(balance).greaterThan(creditLimit)) {
            throw new AppError(
              `Credit limit exceeded for '${customer.name}'. Limit: PKR ${creditLimit.toFixed(2)}, Projected: PKR ${currentBal.plus(balance).toFixed(2)}`,
              400
            );
          }
        }
      }

      // Generate Invoice Reference
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      // 4. Create Sale Record
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: customer ? customer.id : null,
          warehouseId,
          saleDate: new Date(saleDate),
          paymentType,
          subTotal: subTotal.toFixed(4),
          discountAmount: discount.toFixed(4),
          taxAmount: tax.toFixed(4),
          freightAmount: freight.toFixed(4),
          netAmount: netAmount.toFixed(4),
          paidAmount: paid.toFixed(4),
          balanceAmount: balance.toFixed(4),
          truckNumber,
          gatePassNumber,
          notes,
          createdById: req.user?.id || null,
          items: {
            create: processedItems,
          },
        },
        include: { items: true, customer: true, warehouse: true },
      });

      // 5. Decrement Stock and Log Movements
      for (const it of processedItems) {
        await tx.stock.upsert({
          where: { warehouseId_productId: { warehouseId, productId: it.productId } },
          update: {
            currentBags: { decrement: it.bagCount },
            currentWeightKg: { decrement: it.netWeightKg },
            availableBags: { decrement: it.bagCount },
            availableWeightKg: { decrement: it.netWeightKg },
            lastMovementDate: new Date(),
          },
          create: {
            warehouseId,
            productId: it.productId,
            currentBags: -it.bagCount,
            currentWeightKg: new Decimal(-it.netWeightKg).toFixed(4),
            availableBags: -it.bagCount,
            availableWeightKg: new Decimal(-it.netWeightKg).toFixed(4),
            lastMovementDate: new Date(),
          },
        });

        await tx.stockMovement.create({
          data: {
            movementNumber: `MOV-SAL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            movementType: 'SALE',
            warehouseId,
            productId: it.productId,
            bagCountDelta: -it.bagCount,
            weightKgDelta: new Decimal(it.netWeightKg).negated().toFixed(4),
            unitCostPerKg: it.unitPricePerKg,
            totalCost: it.lineTotal,
            referenceType: 'SaleInvoice',
            referenceId: sale.invoiceNumber,
            notes: `Sale to ${customer ? customer.name : 'Counter Walk-in'} (Inv: ${sale.invoiceNumber})`,
            createdById: req.user?.id || null,
          },
        });
      }

      // 6. Post Accounting to Customer Ledger if Credit Sale
      if (customer) {
        const lastLedger = await tx.customerLedger.findFirst({
          where: { customerId: customer.id },
          orderBy: { date: 'desc' },
        });

        const prevBal = lastLedger ? new Decimal(lastLedger.runningBalance.toString()) : new Decimal(customer.openingBalance.toString());
        let newBal = prevBal.plus(netAmount);

        await tx.customerLedger.create({
          data: {
            customerId: customer.id,
            date: new Date(saleDate),
            transactionType: 'SALE',
            referenceNo: sale.invoiceNumber,
            description: `Sales invoice ${sale.invoiceNumber} (${totalBags} bags, ${totalWeightKg.toFixed(2)} kg)`,
            debit: netAmount.toFixed(4),
            credit: '0.0000',
            runningBalance: newBal.toFixed(4),
          },
        });

        // Credit: Cash/Bank payment received
        if (paid.greaterThan(0)) {
          newBal = newBal.minus(paid);
          await tx.customerLedger.create({
            data: {
              customerId: customer.id,
              date: new Date(saleDate),
              transactionType: 'RECEIPT',
              referenceNo: `REC-${sale.invoiceNumber}`,
              description: `Receipt against invoice ${sale.invoiceNumber}`,
              debit: '0.0000',
              credit: paid.toFixed(4),
              runningBalance: newBal.toFixed(4),
            },
          });
        }
      }

      // 7. Update Cash or Bank Account
      if (paid.greaterThan(0)) {
        if (cashAccountId) {
          await tx.cashAccount.update({
            where: { id: cashAccountId },
            data: { balance: { increment: paid.toFixed(4) } },
          });
        } else if (bankAccountId) {
          await tx.bankAccount.update({
            where: { id: bankAccountId },
            data: { currentBalance: { increment: paid.toFixed(4) } },
          });
        }
      }

      // 8. Update Daily Sales Summary
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const summary = await tx.dailySalesSummary.upsert({
        where: { summaryDate: today },
        update: {
          totalSalesAmount: { increment: netAmount.toFixed(4) },
          totalCashSales: { increment: paymentType === 'CASH' ? netAmount.toFixed(4) : paid.toFixed(4) },
          totalCreditSales: { increment: balance.greaterThan(0) ? balance.toFixed(4) : '0.0000' },
          totalWeightSoldKg: { increment: totalWeightKg.toFixed(4) },
          totalBagsSold: { increment: totalBags },
          totalTransactions: { increment: 1 },
        },
        create: {
          summaryDate: today,
          totalSalesAmount: netAmount.toFixed(4),
          totalCashSales: paymentType === 'CASH' ? netAmount.toFixed(4) : paid.toFixed(4),
          totalCreditSales: balance.greaterThan(0) ? balance.toFixed(4) : '0.0000',
          totalWeightSoldKg: totalWeightKg.toFixed(4),
          totalBagsSold: totalBags,
          totalTransactions: 1,
          status: 'OPEN',
        },
      });

      await tx.dailySalesItem.create({
        data: {
          summaryId: summary.id,
          saleId: sale.id,
          invoiceNumber: sale.invoiceNumber,
          customerName: customer ? customer.name : 'Counter Retail',
          paymentType,
          amount: netAmount.toFixed(4),
          bagCount: totalBags,
          weightKg: totalWeightKg.toFixed(4),
        },
      });

      return sale;
    });

    sendSuccess(res, saleResult, 'Sales invoice completed and inventory decremented', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/sales
 * List past sales invoices
 */
export const getSales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { warehouseId, customerId, limit = 50 } = req.query;
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId as string;
    if (customerId) where.customerId = customerId as string;

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        warehouse: true,
        items: { include: { product: true } },
      },
      orderBy: { saleDate: 'desc' },
      take: Number(limit),
    });

    sendSuccess(res, sales, 'Sales invoices retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/sales/:id
 * Get single sales invoice details
 */
export const getSaleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        warehouse: true,
        items: { include: { product: true } },
        returns: true,
      },
    });

    if (!sale) {
      throw new AppError('Sale invoice not found', 404);
    }

    sendSuccess(res, sale, 'Sale invoice retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/sales/return
 * Process sales return (Credit note): restore stock and credit customer balance
 */
export const createSalesReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let { saleId, returnDate = new Date().toISOString(), items, reason } = req.body;

    if (!items && req.body.productId) {
      items = [
        {
          productId: req.body.productId,
          bagCount: req.body.bagsReturned || req.body.bagCount || 0,
          weightKg: req.body.weightReturnedKg || req.body.weightKg,
          unitPricePerKg: req.body.returnRatePerKg || req.body.unitPricePerKg,
        },
      ];
    }

    if (!saleId || !items || !items.length) {
      throw new AppError('Sale ID and returned items are required', 400);
    }

    const returnResult = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { customer: true, warehouse: true, items: true },
      });

      if (!sale) {
        throw new AppError('Original sale invoice not found', 404);
      }

      let totalReturnBags = 0;
      let totalReturnWeightKg = new Decimal(0);
      let totalReturnAmount = new Decimal(0);

      const returnNo = `SRT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      for (const it of items) {
        const bags = parseInt(it.bagCount || '0', 10);
        const weight = new Decimal(it.weightKg);
        const rate = new Decimal(it.unitPricePerKg);
        const lineAmount = weight.times(rate);

        totalReturnBags += bags;
        totalReturnWeightKg = totalReturnWeightKg.plus(weight);
        totalReturnAmount = totalReturnAmount.plus(lineAmount);

        // 1. Restore Stock in Warehouse
        await tx.stock.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: sale.warehouseId,
              productId: it.productId,
            },
          },
          update: {
            currentBags: { increment: bags },
            currentWeightKg: { increment: weight.toFixed(4) },
            availableBags: { increment: bags },
            availableWeightKg: { increment: weight.toFixed(4) },
            lastMovementDate: new Date(),
          },
          create: {
            warehouseId: sale.warehouseId,
            productId: it.productId,
            currentBags: bags,
            currentWeightKg: weight.toFixed(4),
            availableBags: bags,
            availableWeightKg: weight.toFixed(4),
            lastMovementDate: new Date(),
          },
        });

        // 2. Log Stock Movement
        await tx.stockMovement.create({
          data: {
            movementNumber: `MOV-SRT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            movementType: 'SALE_RETURN',
            warehouseId: sale.warehouseId,
            productId: it.productId,
            bagCountDelta: bags,
            weightKgDelta: weight.toFixed(4),
            unitCostPerKg: rate.toFixed(4),
            totalCost: lineAmount.toFixed(4),
            referenceType: 'SalesReturn',
            referenceId: returnNo,
            notes: `Sales Return ${returnNo} from ${sale.customer ? sale.customer.name : 'Counter'} - Reason: ${reason || 'Customer Return'}`,
            createdById: req.user?.id || null,
          },
        });
      }

      // 3. Create SalesReturn Record
      const salesReturn = await tx.salesReturn.create({
        data: {
          returnNumber: returnNo,
          saleId: sale.id,
          customerId: sale.customerId,
          returnDate: new Date(returnDate),
          totalBags: totalReturnBags,
          totalWeightKg: totalReturnWeightKg.toFixed(4),
          totalAmount: totalReturnAmount.toFixed(4),
          reason,
        },
      });

      // 4. Update Customer Ledger (Credit Note to decrease debt)
      if (sale.customerId) {
        const lastLedger = await tx.customerLedger.findFirst({
          where: { customerId: sale.customerId },
          orderBy: { date: 'desc' },
        });

        const prevBal = lastLedger ? new Decimal(lastLedger.runningBalance.toString()) : new Decimal(0);
        const newBal = prevBal.minus(totalReturnAmount);

        await tx.customerLedger.create({
          data: {
            customerId: sale.customerId,
            date: new Date(returnDate),
            transactionType: 'SALE_RETURN',
            referenceNo: returnNo,
            description: `Sales Return ${returnNo} for Invoice ${sale.invoiceNumber}: ${reason || 'Defective/Damaged return'}`,
            debit: '0.0000',
            credit: totalReturnAmount.toFixed(4),
            runningBalance: newBal.toFixed(4),
          },
        });
      }

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user?.id || null,
          action: 'CREATE',
          entityName: 'SalesReturn',
          entityId: salesReturn.id,
          newValues: {
            returnNumber: returnNo,
            saleId: sale.id,
            totalBags: totalReturnBags,
            totalWeightKg: totalReturnWeightKg.toFixed(4),
            totalAmount: totalReturnAmount.toFixed(4),
          },
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'AL ARAB ERP Client',
        },
      });

      return salesReturn;
    });

    sendSuccess(res, returnResult, 'Sales return processed, stock restored, and customer account credited', 201);
  } catch (err) {
    next(err);
  }
};
