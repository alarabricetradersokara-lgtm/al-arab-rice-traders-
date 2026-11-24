import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import Decimal from 'decimal.js';

// =========================================================================
// 1. CUSTOMERS MANAGEMENT
// =========================================================================

/**
 * Get all customers with dynamic transaction-calculated balances and search
 */
export const getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, customerType, isActive, overLimit } = req.query;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (customerType) {
      where.customerType = customerType as string;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { alternatePhone: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        customerLedgers: {
          select: {
            debit: true,
            credit: true,
          },
        },
        _count: {
          select: {
            sales: true,
            receipts: true,
            customerLedgers: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Compute exact balances from posted transactions (not hardcoded)
    const formatted = customers.map((c) => {
      let totalDebits = new Decimal(0);
      let totalCredits = new Decimal(0);

      for (const entry of c.customerLedgers) {
        totalDebits = totalDebits.plus(new Decimal(entry.debit.toString()));
        totalCredits = totalCredits.plus(new Decimal(entry.credit.toString()));
      }

      // Customer Balance = Total Debits - Total Credits
      // Note: Opening balance is already posted as an OPENING_BALANCE ledger entry if > 0
      const calculatedBalance = totalDebits.minus(totalCredits);
      const creditLimit = new Decimal(c.creditLimit.toString());
      const isOverLimit = creditLimit.greaterThan(0) && calculatedBalance.greaterThan(creditLimit);

      return {
        id: c.id,
        code: c.code,
        name: c.name,
        businessName: c.businessName,
        phone: c.phone,
        alternatePhone: c.alternatePhone,
        email: c.email,
        address: c.address,
        city: c.city,
        taxNumber: c.taxNumber,
        customerType: c.customerType || 'WHOLESALER',
        creditLimit: creditLimit.toFixed(2),
        openingBalance: c.openingBalance.toString(),
        totalDebits: totalDebits.toFixed(2),
        totalCredits: totalCredits.toFixed(2),
        currentBalance: calculatedBalance.toFixed(2),
        isOverLimit,
        isActive: c.isActive,
        notes: c.notes,
        totalSalesCount: c._count.sales,
        totalReceiptsCount: c._count.receipts,
        totalTransactionsCount: c._count.customerLedgers,
        createdAt: c.createdAt,
      };
    });

    const finalCustomers = overLimit === 'true' ? formatted.filter((c) => c.isOverLimit) : formatted;

    sendSuccess(res, finalCustomers, 'Customers retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Get single customer profile and recent activity
 */
export const getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        customerLedgers: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: {
          select: { sales: true, receipts: true, customerLedgers: true },
        },
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Calculate full ledger balance from all transactions
    const aggregate = await prisma.customerLedger.aggregate({
      where: { customerId: id },
      _sum: { debit: true, credit: true },
    });

    const totalDebits = new Decimal(aggregate._sum.debit?.toString() || '0');
    const totalCredits = new Decimal(aggregate._sum.credit?.toString() || '0');
    const calculatedBalance = totalDebits.minus(totalCredits);

    sendSuccess(
      res,
      {
        ...customer,
        currentBalance: calculatedBalance.toFixed(2),
        totalDebits: totalDebits.toFixed(2),
        totalCredits: totalCredits.toFixed(2),
      },
      'Customer profile retrieved'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Create new customer with automatic opening ledger posting
 */
export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      businessName,
      phone,
      alternatePhone,
      email,
      address,
      city = 'Gujranwala',
      taxNumber,
      creditLimit = 0,
      openingBalance = 0,
      customerType = 'WHOLESALER',
      notes,
    } = req.body;

    if (!name || !phone) {
      throw new AppError('Customer name and phone number are required', 400);
    }

    const code = req.body.code || `CUST-${Date.now().toString().slice(-6)}`;

    const existing = await prisma.customer.findUnique({ where: { code } });
    if (existing) {
      throw new AppError(`Customer with code '${code}' already exists`, 409);
    }

    const opBal = new Decimal(openingBalance || 0);

    const customer = await prisma.$transaction(async (tx) => {
      const cust = await tx.customer.create({
        data: {
          code,
          name,
          businessName,
          phone,
          alternatePhone,
          email,
          address,
          city,
          taxNumber,
          creditLimit: new Decimal(creditLimit),
          openingBalance: opBal,
          currentBalance: opBal,
          customerType,
          notes,
        },
      });

      if (opBal.greaterThan(0)) {
        await tx.customerLedger.create({
          data: {
            customerId: cust.id,
            date: new Date(),
            transactionType: 'OPENING_BALANCE',
            referenceNo: `OPN-${cust.code}`,
            description: 'Fiscal opening receivables balance',
            debit: opBal,
            credit: 0,
            runningBalance: opBal,
          },
        });
      }

      return cust;
    });

    sendSuccess(res, customer, 'Customer created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update Customer Profile
 */
export const updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, businessName, phone, alternatePhone, email, address, city, taxNumber, creditLimit, customerType, notes, isActive } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Customer not found', 404);
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(businessName !== undefined && { businessName }),
        ...(phone && { phone }),
        ...(alternatePhone !== undefined && { alternatePhone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(taxNumber !== undefined && { taxNumber }),
        ...(creditLimit !== undefined && { creditLimit: new Decimal(creditLimit) }),
        ...(customerType && { customerType }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    sendSuccess(res, updated, 'Customer profile updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Customer
 */
export const deleteCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Customer not found', 404);
    }

    await prisma.customerLedger.deleteMany({ where: { customerId: id } });
    await prisma.dailySalesCustomerAllocation.deleteMany({ where: { customerId: id } });
    await prisma.customer.delete({ where: { id } });

    sendSuccess(res, null, 'Customer deleted successfully');
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 2. SUPPLIERS MANAGEMENT
// =========================================================================

/**
 * Get all suppliers with dynamic transaction-calculated balances and search
 */
export const getSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, isArthi, isActive } = req.query;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (isArthi !== undefined) {
      where.isArthi = isArthi === 'true';
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { alternatePhone: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        supplierLedgers: {
          select: {
            debit: true,
            credit: true,
          },
        },
        _count: {
          select: {
            purchases: true,
            payments: true,
            supplierLedgers: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Compute exact balances from posted transactions (not hardcoded)
    const formatted = suppliers.map((s) => {
      let totalDebits = new Decimal(0);
      let totalCredits = new Decimal(0);

      for (const entry of s.supplierLedgers) {
        totalDebits = totalDebits.plus(new Decimal(entry.debit.toString()));
        totalCredits = totalCredits.plus(new Decimal(entry.credit.toString()));
      }

      // Supplier Balance (Payable) = Total Credits - Total Debits
      // Note: Opening balance is already posted as an OPENING_BALANCE ledger entry if > 0
      const calculatedBalance = totalCredits.minus(totalDebits);

      return {
        id: s.id,
        code: s.code,
        name: s.name,
        businessName: s.businessName,
        phone: s.phone,
        alternatePhone: s.alternatePhone,
        email: s.email,
        address: s.address,
        city: s.city,
        taxNumber: s.taxNumber,
        isArthi: s.isArthi,
        paymentTerms: s.paymentTerms || 'MANDI_CYCLE',
        openingBalance: s.openingBalance.toString(),
        totalDebits: totalDebits.toFixed(2),
        totalCredits: totalCredits.toFixed(2),
        currentBalance: calculatedBalance.toFixed(2),
        isActive: s.isActive,
        notes: s.notes,
        totalPurchasesCount: s._count.purchases,
        totalPaymentsCount: s._count.payments,
        totalTransactionsCount: s._count.supplierLedgers,
        createdAt: s.createdAt,
      };
    });

    sendSuccess(res, formatted, 'Suppliers retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Get single supplier profile and recent activity
 */
export const getSupplierById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        supplierLedgers: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: {
          select: { purchases: true, payments: true, supplierLedgers: true },
        },
      },
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    // Calculate full ledger balance from all transactions
    const aggregate = await prisma.supplierLedger.aggregate({
      where: { supplierId: id },
      _sum: { debit: true, credit: true },
    });

    const totalDebits = new Decimal(aggregate._sum.debit?.toString() || '0');
    const totalCredits = new Decimal(aggregate._sum.credit?.toString() || '0');
    const calculatedBalance = totalCredits.minus(totalDebits);

    sendSuccess(
      res,
      {
        ...supplier,
        currentBalance: calculatedBalance.toFixed(2),
        totalDebits: totalDebits.toFixed(2),
        totalCredits: totalCredits.toFixed(2),
      },
      'Supplier profile retrieved'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Create new supplier with automatic opening ledger posting
 */
export const createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      businessName,
      phone,
      alternatePhone,
      email,
      address,
      city = 'Gujranwala',
      taxNumber,
      isArthi = false,
      paymentTerms = 'MANDI_CYCLE',
      openingBalance = 0,
      notes,
    } = req.body;

    if (!name || !phone) {
      throw new AppError('Supplier name and phone number are required', 400);
    }

    const code = req.body.code || `SUPP-${Date.now().toString().slice(-6)}`;

    const existing = await prisma.supplier.findUnique({ where: { code } });
    if (existing) {
      throw new AppError(`Supplier with code '${code}' already exists`, 409);
    }

    const opBal = new Decimal(openingBalance || 0);

    const supplier = await prisma.$transaction(async (tx) => {
      const supp = await tx.supplier.create({
        data: {
          code,
          name,
          businessName,
          phone,
          alternatePhone,
          email,
          address,
          city,
          taxNumber,
          isArthi,
          paymentTerms,
          openingBalance: opBal,
          currentBalance: opBal,
          notes,
        },
      });

      if (opBal.greaterThan(0)) {
        await tx.supplierLedger.create({
          data: {
            supplierId: supp.id,
            date: new Date(),
            transactionType: 'OPENING_BALANCE',
            referenceNo: `OPN-${supp.code}`,
            description: 'Fiscal opening payables balance',
            debit: 0,
            credit: opBal,
            runningBalance: opBal,
          },
        });
      }

      return supp;
    });

    sendSuccess(res, supplier, 'Supplier created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update Supplier Profile
 */
export const updateSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, businessName, phone, alternatePhone, email, address, city, taxNumber, isArthi, paymentTerms, notes, isActive } = req.body;

    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Supplier not found', 404);
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(businessName !== undefined && { businessName }),
        ...(phone && { phone }),
        ...(alternatePhone !== undefined && { alternatePhone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(taxNumber !== undefined && { taxNumber }),
        ...(isArthi !== undefined && { isArthi }),
        ...(paymentTerms !== undefined && { paymentTerms }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    sendSuccess(res, updated, 'Supplier profile updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Supplier
 */
export const deleteSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Supplier not found', 404);
    }

    await prisma.supplierLedger.deleteMany({ where: { supplierId: id } });
    await prisma.purchase.deleteMany({ where: { supplierId: id } });
    await prisma.supplier.delete({ where: { id } });

    sendSuccess(res, null, 'Supplier deleted successfully');
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 3. COMPLETE KHATABOOK STATEMENTS (CALCULATED BALANCES & RUNNING TOTALS)
// =========================================================================

/**
 * Comprehensive Customer Statement of Account
 */
export const getCustomerStatement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const customer = await prisma.customer.findUnique({
      where: { id: id as string },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // 1. Calculate Opening Balance before startDate
    let openingBalance = new Decimal(0);
    if (startDate) {
      const priorAggregate = await prisma.customerLedger.aggregate({
        where: {
          customerId: id as string,
          date: { lt: new Date(startDate as string) },
        },
        _sum: { debit: true, credit: true },
      });
      const priorDebits = new Decimal(priorAggregate._sum.debit?.toString() || '0');
      const priorCredits = new Decimal(priorAggregate._sum.credit?.toString() || '0');
      openingBalance = priorDebits.minus(priorCredits);
    }

    // 2. Fetch statement transactions within date range
    const where: any = { customerId: id as string };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const ledgerEntries = await prisma.customerLedger.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // 3. Compute running balances chronologically
    let running = openingBalance;
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    const transactions = ledgerEntries.map((e) => {
      const d = new Decimal(e.debit.toString());
      const c = new Decimal(e.credit.toString());

      totalDebit = totalDebit.plus(d);
      totalCredit = totalCredit.plus(c);
      running = running.plus(d).minus(c);

      return {
        id: e.id,
        date: e.date,
        transactionType: e.transactionType,
        referenceNo: e.referenceNo,
        description: e.description,
        debit: d.toFixed(2),
        credit: c.toFixed(2),
        runningBalance: running.toFixed(2),
      };
    });

    const closingBalance = running;

    sendSuccess(
      res,
      {
        customer: {
          id: customer.id,
          code: customer.code,
          name: customer.name,
          businessName: customer.businessName,
          phone: customer.phone,
          alternatePhone: customer.alternatePhone,
          city: customer.city,
          address: customer.address,
          customerType: customer.customerType,
          creditLimit: customer.creditLimit.toString(),
          notes: customer.notes,
        },
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
        openingBalance: openingBalance.toFixed(2),
        totalDebit: totalDebit.toFixed(2),
        totalCredit: totalCredit.toFixed(2),
        closingBalance: closingBalance.toFixed(2),
        transactions,
      },
      'Customer statement of accounts generated'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Comprehensive Supplier Statement of Account
 */
export const getSupplierStatement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const supplier = await prisma.supplier.findUnique({
      where: { id: id as string },
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    // 1. Calculate Opening Balance before startDate
    let openingBalance = new Decimal(0);
    if (startDate) {
      const priorAggregate = await prisma.supplierLedger.aggregate({
        where: {
          supplierId: id as string,
          date: { lt: new Date(startDate as string) },
        },
        _sum: { debit: true, credit: true },
      });
      const priorDebits = new Decimal(priorAggregate._sum.debit?.toString() || '0');
      const priorCredits = new Decimal(priorAggregate._sum.credit?.toString() || '0');
      openingBalance = priorCredits.minus(priorDebits);
    }

    // 2. Fetch statement transactions within date range
    const where: any = { supplierId: id as string };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const ledgerEntries = await prisma.supplierLedger.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // 3. Compute running balances chronologically
    let running = openingBalance;
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    const transactions = ledgerEntries.map((e) => {
      const d = new Decimal(e.debit.toString());
      const c = new Decimal(e.credit.toString());

      totalDebit = totalDebit.plus(d);
      totalCredit = totalCredit.plus(c);
      running = running.plus(c).minus(d);

      return {
        id: e.id,
        date: e.date,
        transactionType: e.transactionType,
        referenceNo: e.referenceNo,
        description: e.description,
        debit: d.toFixed(2),
        credit: c.toFixed(2),
        runningBalance: running.toFixed(2),
      };
    });

    const closingBalance = running;

    sendSuccess(
      res,
      {
        supplier: {
          id: supplier.id,
          code: supplier.code,
          name: supplier.name,
          businessName: supplier.businessName,
          phone: supplier.phone,
          alternatePhone: supplier.alternatePhone,
          city: supplier.city,
          address: supplier.address,
          isArthi: supplier.isArthi,
          paymentTerms: supplier.paymentTerms,
          notes: supplier.notes,
        },
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
        openingBalance: openingBalance.toFixed(2),
        totalDebit: totalDebit.toFixed(2),
        totalCredit: totalCredit.toFixed(2),
        closingBalance: closingBalance.toFixed(2),
        transactions,
      },
      'Supplier statement of accounts generated'
    );
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 4. TRANSACTION POSTING (RECEIPTS, PAYMENTS & ADJUSTMENTS)
// =========================================================================

/**
 * Record Customer Cash / Bank Receipt & Post to Khatabook
 */
export const recordCustomerReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      amount,
      receiptDate = new Date().toISOString(),
      paymentMethod = 'CASH',
      cashAccountId,
      bankAccountId,
      chequeNumber,
      chequeDate,
      referenceNumber,
      notes,
    } = req.body;

    const numAmount = new Decimal(amount || 0);
    if (numAmount.lessThanOrEqualTo(0)) {
      throw new AppError('Receipt amount must be greater than zero', 400);
    }

    const receiptResult = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: id as string } });
      if (!customer) throw new AppError('Customer not found', 404);

      const receiptNumber = `RCP-${Date.now().toString().slice(-8)}`;

      // 1. Create Receipt record
      const receipt = await tx.receipt.create({
        data: {
          receiptNumber,
          customerId: id as string,
          receiptDate: new Date(receiptDate),
          amount: numAmount,
          paymentMethod: paymentMethod as any,
          cashAccountId: paymentMethod === 'CASH' ? cashAccountId : null,
          bankAccountId: paymentMethod === 'BANK' || paymentMethod === 'CHEQUE' ? bankAccountId : null,
          chequeNumber,
          chequeDate: chequeDate ? new Date(chequeDate) : null,
          referenceNumber,
          notes,
          createdById: (req as any).user?.id || null,
        },
      });

      // 2. Deposit into Cash Account or Bank Account
      if (paymentMethod === 'CASH' && cashAccountId) {
        const cashAcc = await tx.cashAccount.findUnique({ where: { id: cashAccountId } });
        if (cashAcc) {
          await tx.cashAccount.update({
            where: { id: cashAccountId },
            data: { balance: new Decimal(cashAcc.balance.toString()).plus(numAmount) },
          });
        }
      } else if ((paymentMethod === 'BANK' || paymentMethod === 'CHEQUE') && bankAccountId) {
        const bankAcc = await tx.bankAccount.findUnique({ where: { id: bankAccountId } });
        if (bankAcc) {
          await tx.bankAccount.update({
            where: { id: bankAccountId },
            data: { currentBalance: new Decimal(bankAcc.currentBalance.toString()).plus(numAmount) },
          });
        }
      }

      // 3. Post to Customer Ledger (CREDIT reduces receivable)
      const prevBal = new Decimal(customer.currentBalance.toString());
      const newBal = prevBal.minus(numAmount);

      await tx.customerLedger.create({
        data: {
          customerId: customer.id,
          date: new Date(receiptDate),
          transactionType: 'RECEIPT',
          referenceNo: receiptNumber,
          description: `Cash/Bank Receipt [${paymentMethod}] ${referenceNumber ? 'Ref: ' + referenceNumber : ''} ${notes ? '- ' + notes : ''}`,
          debit: 0,
          credit: numAmount,
          runningBalance: newBal,
        },
      });

      // 4. Update Customer Current Balance
      await tx.customer.update({
        where: { id: customer.id },
        data: { currentBalance: newBal },
      });

      return { receipt, newBalance: newBal.toFixed(2) };
    });

    sendSuccess(res, receiptResult, 'Receipt recorded and Khatabook credited successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Record Supplier Cash / Bank Payment & Post to Khatabook
 */
export const recordSupplierPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      amount,
      paymentDate = new Date().toISOString(),
      paymentMethod = 'CASH',
      cashAccountId,
      bankAccountId,
      chequeNumber,
      chequeDate,
      referenceNumber,
      notes,
    } = req.body;

    const numAmount = new Decimal(amount || 0);
    if (numAmount.lessThanOrEqualTo(0)) {
      throw new AppError('Payment amount must be greater than zero', 400);
    }

    const paymentResult = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({ where: { id: id as string } });
      if (!supplier) throw new AppError('Supplier not found', 404);

      const paymentNumber = `PAY-${Date.now().toString().slice(-8)}`;

      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          supplierId: id as string,
          paymentDate: new Date(paymentDate),
          amount: numAmount,
          paymentMethod: paymentMethod as any,
          cashAccountId: paymentMethod === 'CASH' ? cashAccountId : null,
          bankAccountId: paymentMethod === 'BANK' || paymentMethod === 'CHEQUE' ? bankAccountId : null,
          chequeNumber,
          chequeDate: chequeDate ? new Date(chequeDate) : null,
          referenceNumber,
          notes,
          createdById: (req as any).user?.id || null,
        },
      });

      // 2. Withdraw from Cash Account or Bank Account
      if (paymentMethod === 'CASH' && cashAccountId) {
        const cashAcc = await tx.cashAccount.findUnique({ where: { id: cashAccountId } });
        if (cashAcc) {
          await tx.cashAccount.update({
            where: { id: cashAccountId },
            data: { balance: new Decimal(cashAcc.balance.toString()).minus(numAmount) },
          });
        }
      } else if ((paymentMethod === 'BANK' || paymentMethod === 'CHEQUE') && bankAccountId) {
        const bankAcc = await tx.bankAccount.findUnique({ where: { id: bankAccountId } });
        if (bankAcc) {
          await tx.bankAccount.update({
            where: { id: bankAccountId },
            data: { currentBalance: new Decimal(bankAcc.currentBalance.toString()).minus(numAmount) },
          });
        }
      }

      // 3. Post to Supplier Ledger (DEBIT reduces payable)
      const prevBal = new Decimal(supplier.currentBalance.toString());
      const newBal = prevBal.minus(numAmount);

      await tx.supplierLedger.create({
        data: {
          supplierId: supplier.id,
          date: new Date(paymentDate),
          transactionType: 'PAYMENT',
          referenceNo: paymentNumber,
          description: `Supplier Payment [${paymentMethod}] ${referenceNumber ? 'Ref: ' + referenceNumber : ''} ${notes ? '- ' + notes : ''}`,
          debit: numAmount,
          credit: 0,
          runningBalance: newBal,
        },
      });

      // 4. Update Supplier Current Balance
      await tx.supplier.update({
        where: { id: supplier.id },
        data: { currentBalance: newBal },
      });

      return { payment, newBalance: newBal.toFixed(2) };
    });

    sendSuccess(res, paymentResult, 'Payment recorded and Khatabook debited successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Record Customer Adjustment (Debit or Credit Note)
 */
export const recordCustomerAdjustment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      type, // 'DEBIT' (charge/increase debt) or 'CREDIT' (discount/decrease debt)
      amount,
      date = new Date().toISOString(),
      reason,
      notes,
    } = req.body;

    const numAmount = new Decimal(amount || 0);
    if (numAmount.lessThanOrEqualTo(0)) {
      throw new AppError('Adjustment amount must be positive', 400);
    }
    if (type !== 'DEBIT' && type !== 'CREDIT') {
      throw new AppError('Adjustment type must be DEBIT or CREDIT', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: id as string } });
      if (!customer) throw new AppError('Customer not found', 404);

      const refNo = `ADJ-C-${Date.now().toString().slice(-8)}`;
      const prevBal = new Decimal(customer.currentBalance.toString());

      const debit = type === 'DEBIT' ? numAmount : new Decimal(0);
      const credit = type === 'CREDIT' ? numAmount : new Decimal(0);
      const newBal = type === 'DEBIT' ? prevBal.plus(numAmount) : prevBal.minus(numAmount);

      const ledger = await tx.customerLedger.create({
        data: {
          customerId: customer.id,
          date: new Date(date),
          transactionType: 'ADJUSTMENT',
          referenceNo: refNo,
          description: `Adjustment [${type}]: ${reason || 'Account reconciliation'} ${notes ? '- ' + notes : ''}`,
          debit,
          credit,
          runningBalance: newBal,
        },
      });

      await tx.customer.update({
        where: { id: customer.id },
        data: { currentBalance: newBal },
      });

      return { ledger, newBalance: newBal.toFixed(2) };
    });

    sendSuccess(res, result, 'Customer Khatabook adjustment posted successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Record Supplier Adjustment (Debit or Credit Note)
 */
export const recordSupplierAdjustment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      type, // 'DEBIT' (quality claim/rebate, reduces payable) or 'CREDIT' (charge/increases payable)
      amount,
      date = new Date().toISOString(),
      reason,
      notes,
    } = req.body;

    const numAmount = new Decimal(amount || 0);
    if (numAmount.lessThanOrEqualTo(0)) {
      throw new AppError('Adjustment amount must be positive', 400);
    }
    if (type !== 'DEBIT' && type !== 'CREDIT') {
      throw new AppError('Adjustment type must be DEBIT or CREDIT', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({ where: { id: id as string } });
      if (!supplier) throw new AppError('Supplier not found', 404);

      const refNo = `ADJ-S-${Date.now().toString().slice(-8)}`;
      const prevBal = new Decimal(supplier.currentBalance.toString());

      const debit = type === 'DEBIT' ? numAmount : new Decimal(0);
      const credit = type === 'CREDIT' ? numAmount : new Decimal(0);
      const newBal = type === 'CREDIT' ? prevBal.plus(numAmount) : prevBal.minus(numAmount);

      const ledger = await tx.supplierLedger.create({
        data: {
          supplierId: supplier.id,
          date: new Date(date),
          transactionType: 'ADJUSTMENT',
          referenceNo: refNo,
          description: `Adjustment [${type}]: ${reason || 'Account reconciliation'} ${notes ? '- ' + notes : ''}`,
          debit,
          credit,
          runningBalance: newBal,
        },
      });

      await tx.supplier.update({
        where: { id: supplier.id },
        data: { currentBalance: newBal },
      });

      return { ledger, newBalance: newBal.toFixed(2) };
    });

    sendSuccess(res, result, 'Supplier Khatabook adjustment posted successfully', 201);
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 5. AGGREGATE KHATABOOK SUMMARY (RECEIVABLES, PAYABLES & METRICS)
// =========================================================================

export const getKhatabookSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [customers, suppliers] = await Promise.all([
      prisma.customer.findMany({ select: { id: true, currentBalance: true, creditLimit: true, isActive: true } }),
      prisma.supplier.findMany({ select: { id: true, currentBalance: true, isArthi: true, isActive: true } }),
    ]);

    let totalReceivables = new Decimal(0);
    let overLimitCount = 0;
    for (const c of customers) {
      const bal = new Decimal(c.currentBalance.toString());
      if (bal.greaterThan(0)) totalReceivables = totalReceivables.plus(bal);
      if (new Decimal(c.creditLimit.toString()).greaterThan(0) && bal.greaterThan(new Decimal(c.creditLimit.toString()))) {
        overLimitCount++;
      }
    }

    let totalPayables = new Decimal(0);
    let arthisCount = 0;
    for (const s of suppliers) {
      const bal = new Decimal(s.currentBalance.toString());
      if (bal.greaterThan(0)) totalPayables = totalPayables.plus(bal);
      if (s.isArthi) arthisCount++;
    }

    const netWorthDiff = totalReceivables.minus(totalPayables);

    sendSuccess(
      res,
      {
        totalCustomers: customers.length,
        totalSuppliers: suppliers.length,
        totalReceivables: totalReceivables.toFixed(2),
        totalPayables: totalPayables.toFixed(2),
        netDifference: netWorthDiff.toFixed(2),
        overLimitCustomersCount: overLimitCount,
        mandiArthisCount: arthisCount,
      },
      'Khatabook summary metrics calculated'
    );
  } catch (err) {
    next(err);
  }
};
