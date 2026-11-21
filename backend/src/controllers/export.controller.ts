import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import Decimal from 'decimal.js';
import { COA } from './accounting.controller';

export const getExportCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, country } = req.query;
    const where: any = {};
    if (country) where.country = country as string;
    if (search) {
      where.OR = [
        { companyName: { contains: search as string, mode: 'insensitive' } },
        { customerCode: { contains: search as string, mode: 'insensitive' } },
        { country: { contains: search as string, mode: 'insensitive' } },
        { contactPerson: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.exportCustomer.findMany({
      where,
      orderBy: { companyName: 'asc' },
    });

    let totalReceivableFcy = new Decimal(0);
    let totalReceivablePkr = new Decimal(0);
    for (const c of customers) {
      totalReceivableFcy = totalReceivableFcy.plus(new Decimal(c.currentReceivableFcy.toString()));
      totalReceivablePkr = totalReceivablePkr.plus(new Decimal(c.currentReceivablePkr.toString()));
    }

    sendSuccess(res, {
      customers,
      totalReceivableFcy: totalReceivableFcy.toFixed(2),
      totalReceivablePkr: totalReceivablePkr.toFixed(2),
    }, 'Export customers retrieved');
  } catch (err) {
    next(err);
  }
};

export const getExportCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const customer = await prisma.exportCustomer.findUnique({
      where: { id },
      include: {
        invoices: {
          include: { items: { include: { product: true } } },
          orderBy: { invoiceDate: 'desc' },
        },
        payments: { orderBy: { realizationDate: 'desc' } },
      },
    });

    if (!customer) throw new AppError('Export customer not found', 404);

    sendSuccess(res, customer, 'Export customer profile retrieved');
  } catch (err) {
    next(err);
  }
};

export const createExportCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      companyName,
      country,
      contactPerson,
      email,
      phone,
      address,
      preferredCurrency = 'USD',
      destinationPort,
      paymentTerms = '100% Irrevocable Letter of Credit (L/C) at sight',
      taxId,
      notes,
    } = req.body;

    if (!companyName || !country) {
      throw new AppError('Company name and country are required', 400);
    }

    const code = req.body.customerCode || `EXP-CUST-${Date.now().toString().slice(-4)}`;

    const customer = await prisma.exportCustomer.create({
      data: {
        customerCode: code,
        companyName,
        country,
        contactPerson,
        email,
        phone,
        address,
        preferredCurrency,
        destinationPort,
        paymentTerms,
        taxId,
        notes,
      },
    });

    sendSuccess(res, customer, 'Export customer registered', 201);
  } catch (err) {
    next(err);
  }
};

export const getExportInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { customerId, status, startDate, endDate } = req.query;
    const where: any = {};
    if (customerId) where.exportCustomerId = customerId as string;
    if (status) where.status = status as any;
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate as string);
      if (endDate) where.invoiceDate.lte = new Date(endDate as string);
    }

    const invoices = await prisma.exportInvoice.findMany({
      where,
      include: {
        exportCustomer: true,
        items: { include: { product: true } },
        payments: true,
      },
      orderBy: { invoiceDate: 'desc' },
      take: 100,
    });

    sendSuccess(res, invoices, 'Export invoices retrieved');
  } catch (err) {
    next(err);
  }
};

export const getExportInvoiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const invoice = await prisma.exportInvoice.findUnique({
      where: { id },
      include: {
        exportCustomer: true,
        items: { include: { product: true } },
        payments: { include: { bankAccount: true } },
      },
    });

    if (!invoice) throw new AppError('Export invoice not found', 404);

    sendSuccess(res, invoice, 'Export invoice details retrieved');
  } catch (err) {
    next(err);
  }
};

export const createExportInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      exportCustomerId,
      warehouseId, // Warehouse from which stock is dispatched
      invoiceDate = new Date().toISOString(),
      currency = 'USD',
      exchangeRate = 280.0,
      contractNo,
      paymentTerms,
      incoterm = 'FOB',
      portOfLoading = 'Karachi Port, Pakistan',
      portOfDischarge,
      vesselName,
      containerNumber,
      blNumber,
      shippingLine,
      oceanFreightCost = 0,
      portHandlingCost = 0,
      otherShippingCosts = 0,
      notes,
      items = [],
    } = req.body;

    if (!exportCustomerId) throw new AppError('Export customer is required', 400);
    if (!items.length) throw new AppError('At least one rice product item is required for export', 400);

    const fxRate = new Decimal(exchangeRate || 280);
    const freight = new Decimal(oceanFreightCost || 0);
    const portCost = new Decimal(portHandlingCost || 0);
    const otherCost = new Decimal(otherShippingCosts || 0);
    const totalFreightCostPkr = freight.plus(portCost).plus(otherCost);

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.exportCustomer.findUnique({ where: { id: exportCustomerId } });
      if (!customer) throw new AppError('Export customer not found', 404);

      const invNumber = `EXP-INV-${Date.now().toString().slice(-8)}`;

      let totalFcy = new Decimal(0);
      let totalPkr = new Decimal(0);
      const processedItems = [];

      for (const item of items) {
        const product = await tx.riceProduct.findUnique({ where: { id: item.productId } });
        if (!product) throw new AppError(`Product ID ${item.productId} not found`, 404);

        const bagCount = Number(item.bagCount || 0);
        const bagWeightKg = new Decimal(item.bagWeightKg || product.defaultBagWeightKg.toString());
        const totalWeightKg = new Decimal(item.totalWeightKg || bagWeightKg.times(bagCount));
        const totalWeightMt = totalWeightKg.dividedBy(1000); // 1000 Kg = 1 Metric Ton

        const ratePerMtFcy = new Decimal(item.ratePerMtFcy || 1000);
        const lineTotalFcy = totalWeightMt.times(ratePerMtFcy);
        const lineTotalPkr = lineTotalFcy.times(fxRate);

        totalFcy = totalFcy.plus(lineTotalFcy);
        totalPkr = totalPkr.plus(lineTotalPkr);

        // Deduct inventory if warehouseId is provided
        if (warehouseId) {
          const stock = await tx.stock.findUnique({
            where: { warehouseId_productId: { warehouseId, productId: item.productId } },
          });

          if (stock && new Decimal(stock.availableWeightKg.toString()).gte(totalWeightKg)) {
            await tx.stock.update({
              where: { warehouseId_productId: { warehouseId, productId: item.productId } },
              data: {
                currentBags: { decrement: bagCount },
                currentWeightKg: { decrement: totalWeightKg },
                availableBags: { decrement: bagCount },
                availableWeightKg: { decrement: totalWeightKg },
                lastMovementDate: new Date(),
              },
            });

            await tx.stockMovement.create({
              data: {
                movementNumber: `MOV-EXP-${invNumber}-${Math.floor(100 + Math.random() * 900)}`,
                movementType: 'SALE',
                warehouseId,
                productId: item.productId,
                bagCountDelta: -bagCount,
                weightKgDelta: totalWeightKg.negated(),
                unitCostPerKg: new Decimal(product.costPricePerKg.toString()),
                totalCost: totalWeightKg.times(new Decimal(product.costPricePerKg.toString())),
                referenceType: 'ExportInvoice',
                referenceId: invNumber,
                notes: `Export Shipment ${invNumber} to ${customer.country} (${customer.companyName})`,
                createdById: (req as any).user?.id || null,
              },
            });
          }
        }

        processedItems.push({
          productId: item.productId,
          bagType: item.bagType || 'PP Non-Woven Export Bag',
          bagWeightKg,
          bagCount,
          totalWeightKg,
          totalWeightMt,
          ratePerMtFcy,
          lineTotalFcy,
          lineTotalPkr,
          grainLengthMm: item.grainLengthMm ? new Decimal(item.grainLengthMm) : null,
          moisturePct: item.moisturePct ? new Decimal(item.moisturePct) : null,
          brokenPct: item.brokenPct ? new Decimal(item.brokenPct) : null,
          notes: item.notes,
        });
      }

      // 1. Create Export Invoice
      const invoice = await tx.exportInvoice.create({
        data: {
          invoiceNumber: invNumber,
          exportCustomerId,
          invoiceDate: new Date(invoiceDate),
          currency,
          exchangeRate: fxRate,
          contractNo,
          paymentTerms: paymentTerms || customer.paymentTerms,
          incoterm,
          portOfLoading,
          portOfDischarge: portOfDischarge || customer.destinationPort,
          vesselName,
          containerNumber,
          blNumber,
          shippingLine,
          oceanFreightCost: freight,
          portHandlingCost: portCost,
          otherShippingCosts: otherCost,
          totalFreightCostPkr,
          totalFcyAmount: totalFcy,
          totalPkrAmount: totalPkr,
          status: 'CONFIRMED',
          notes,
          items: { create: processedItems },
        },
        include: {
          exportCustomer: true,
          items: { include: { product: true } },
        },
      });

      // 2. Increment Customer Receivables
      await tx.exportCustomer.update({
        where: { id: exportCustomerId },
        data: {
          currentReceivableFcy: { increment: totalFcy },
          currentReceivablePkr: { increment: totalPkr },
        },
      });

      // 3. Post Double-Entry Journal Entry:
      // Dr. Accounts Receivable - Export Customer (PKR equivalent)
      // Cr. Export Sales Revenue (PKR)
      await tx.journalEntry.create({
        data: {
          entryNumber: `JV-${invNumber}`,
          entryDate: new Date(invoiceDate),
          voucherType: 'GENERAL',
          referenceNo: invNumber,
          narration: `Export Invoice ${invNumber} to ${customer.companyName} (${customer.country}). FCY: ${currency} ${totalFcy.toFixed(2)} @ Rs ${fxRate.toFixed(2)}. Container: ${containerNumber || 'N/A'}, B/L: ${blNumber || 'N/A'}`,
          totalDebit: totalPkr,
          totalCredit: totalPkr,
          status: 'POSTED',
          lines: {
            create: [
              {
                accountCode: COA.ACCOUNTS_RECEIVABLE.code,
                accountName: `Accounts Receivable - ${customer.companyName} (${customer.country})`,
                accountType: 'ASSET',
                debit: totalPkr,
                credit: 0,
                memo: `Export receivables ${currency} ${totalFcy.toFixed(2)}`,
              },
              {
                accountCode: COA.SALES_REVENUE.code,
                accountName: `Export Rice Sales Revenue (${incoterm})`,
                accountType: 'REVENUE',
                debit: 0,
                credit: totalPkr,
                memo: `Export shipment ${invNumber}`,
              },
            ],
          },
        },
      });

      return invoice;
    });

    sendSuccess(res, result, 'Export invoice created and posted to GL', 201);
  } catch (err) {
    next(err);
  }
};

export const getExportPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { customerId, invoiceId } = req.query;
    const where: any = {};
    if (customerId) where.exportCustomerId = customerId as string;
    if (invoiceId) where.exportInvoiceId = invoiceId as string;

    const payments = await prisma.exportPayment.findMany({
      where,
      include: {
        exportInvoice: true,
        exportCustomer: true,
        bankAccount: true,
      },
      orderBy: { realizationDate: 'desc' },
      take: 100,
    });

    sendSuccess(res, payments, 'Export payments retrieved');
  } catch (err) {
    next(err);
  }
};

export const createExportPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      exportInvoiceId,
      paymentDate = new Date().toISOString(),
      realizationDate = new Date().toISOString(),
      amountFcy,
      realizedExchangeRate,
      bankChargesPkr = 0,
      bankAccountId,
      bankRefNo,
      notes,
    } = req.body;

    if (!exportInvoiceId) throw new AppError('Export invoice ID is required', 400);
    if (!bankAccountId) throw new AppError('Bank account is required for export remittance', 400);

    const fcyAmount = new Decimal(amountFcy || 0);
    if (fcyAmount.lessThanOrEqualTo(0)) {
      throw new AppError('Foreign currency remittance amount must be greater than zero', 400);
    }

    const realizedRate = new Decimal(realizedExchangeRate);
    if (realizedRate.lessThanOrEqualTo(0)) {
      throw new AppError('Realized exchange rate must be greater than zero', 400);
    }

    const bCharges = new Decimal(bankChargesPkr || 0);

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.exportInvoice.findUnique({
        where: { id: exportInvoiceId },
        include: { exportCustomer: true },
      });
      if (!invoice) throw new AppError('Export invoice not found', 404);

      const customer = invoice.exportCustomer;
      const bankAccount = await tx.bankAccount.findUnique({ where: { id: bankAccountId } });
      if (!bankAccount) throw new AppError('Bank account not found', 404);

      // Calculations:
      const grossRealizedPkr = fcyAmount.times(realizedRate);
      const netDepositedPkr = grossRealizedPkr.minus(bCharges);

      // Booked exchange rate at time of invoice:
      const bookedRate = new Decimal(invoice.exchangeRate.toString());
      const bookedPkr = fcyAmount.times(bookedRate);

      // Exchange Gain / Loss:
      // If realized PKR > booked PKR: Gain (Credit Revenue)
      // If realized PKR < booked PKR: Loss (Debit Expense)
      const fxGainLoss = grossRealizedPkr.minus(bookedPkr);

      const payNumber = `EPAY-${Date.now().toString().slice(-8)}`;

      // 1. Create Export Payment Record
      const payment = await tx.exportPayment.create({
        data: {
          paymentNumber: payNumber,
          exportInvoiceId,
          exportCustomerId: customer.id,
          paymentDate: new Date(paymentDate),
          realizationDate: new Date(realizationDate),
          currency: invoice.currency,
          amountFcy: fcyAmount,
          realizedExchangeRate: realizedRate,
          amountPkr: grossRealizedPkr,
          bankChargesPkr: bCharges,
          exchangeGainLossPkr: fxGainLoss,
          bankAccountId,
          bankRefNo,
          notes,
          status: 'POSTED',
        },
      });

      // 2. Deposit Net PKR into Bank Account
      await tx.bankAccount.update({
        where: { id: bankAccountId },
        data: {
          currentBalance: { increment: netDepositedPkr },
        },
      });

      // 3. Update Invoice Paid Amounts
      const updatedPaidFcy = new Decimal(invoice.paidFcyAmount.toString()).plus(fcyAmount);
      const updatedPaidPkr = new Decimal(invoice.paidPkrAmount.toString()).plus(bookedPkr);
      const isFullyPaid = updatedPaidFcy.gte(new Decimal(invoice.totalFcyAmount.toString()));

      await tx.exportInvoice.update({
        where: { id: exportInvoiceId },
        data: {
          paidFcyAmount: updatedPaidFcy,
          paidPkrAmount: updatedPaidPkr,
          status: isFullyPaid ? 'REALIZED' : invoice.status,
        },
      });

      // 4. Reduce Customer Receivables
      await tx.exportCustomer.update({
        where: { id: customer.id },
        data: {
          currentReceivableFcy: { decrement: fcyAmount },
          currentReceivablePkr: { decrement: bookedPkr },
        },
      });

      // 5. Post Double-Entry Journal Entry:
      // Dr. Bank Account (Net Deposited PKR)
      // Dr. Bank Charges Expense (Bank Deductions)
      // Cr. Accounts Receivable - Customer (Booked PKR)
      // Cr. / Dr. Foreign Exchange Gain / Loss
      const jvLines: any[] = [
        {
          accountCode: COA.BANK_ACCOUNTS.code,
          accountName: `${bankAccount.bankName} (${bankAccount.accountNumber})`,
          accountType: 'ASSET',
          debit: netDepositedPkr,
          credit: 0,
          memo: `Export proceeds realized from ${customer.companyName}`,
        },
      ];

      if (bCharges.greaterThan(0)) {
        jvLines.push({
          accountCode: '6070',
          accountName: 'Bank Realization & Swift Charges',
          accountType: 'EXPENSE',
          debit: bCharges,
          credit: 0,
          memo: `Foreign remittance processing charges`,
        });
      }

      jvLines.push({
        accountCode: COA.ACCOUNTS_RECEIVABLE.code,
        accountName: `Accounts Receivable - ${customer.companyName}`,
        accountType: 'ASSET',
        debit: 0,
        credit: bookedPkr,
        memo: `Clearance of ${invoice.currency} ${fcyAmount.toFixed(2)} on Inv ${invoice.invoiceNumber}`,
      });

      if (fxGainLoss.greaterThan(0)) {
        // Gain on foreign exchange
        jvLines.push({
          accountCode: COA.OTHER_INCOME.code,
          accountName: 'Foreign Exchange Fluctuation Gain',
          accountType: 'REVENUE',
          debit: 0,
          credit: fxGainLoss,
          memo: `FX Gain: Realized @ Rs ${realizedRate.toFixed(2)} vs Booked @ Rs ${bookedRate.toFixed(2)}`,
        });
      } else if (fxGainLoss.lessThan(0)) {
        // Loss on foreign exchange
        jvLines.push({
          accountCode: '6900',
          accountName: 'Foreign Exchange Fluctuation Loss',
          accountType: 'EXPENSE',
          debit: fxGainLoss.abs(),
          credit: 0,
          memo: `FX Loss: Realized @ Rs ${realizedRate.toFixed(2)} vs Booked @ Rs ${bookedRate.toFixed(2)}`,
        });
      }

      const totalJVDr = jvLines.reduce((acc, l) => acc.plus(new Decimal(l.debit.toString())), new Decimal(0));
      const totalJVCr = jvLines.reduce((acc, l) => acc.plus(new Decimal(l.credit.toString())), new Decimal(0));

      await tx.journalEntry.create({
        data: {
          entryNumber: `JV-${payNumber}`,
          entryDate: new Date(realizationDate),
          voucherType: 'RECEIPT',
          referenceNo: payNumber,
          narration: `Export Remittance Realization ${invoice.currency} ${fcyAmount.toFixed(2)} from ${customer.companyName}. Realized Rate: Rs ${realizedRate.toFixed(2)}, Bank Charges: Rs ${bCharges.toFixed(2)}, Net Deposited: Rs ${netDepositedPkr.toFixed(2)}`,
          totalDebit: totalJVDr,
          totalCredit: totalJVCr,
          status: 'POSTED',
          lines: { create: jvLines },
        },
      });

      return payment;
    });

    sendSuccess(res, result, 'Export foreign remittance realized and posted to GL', 201);
  } catch (err) {
    next(err);
  }
};
