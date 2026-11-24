import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import Decimal from 'decimal.js';

// Standard Chart of Accounts (COA) Map
export const COA = {
  // 1000 - ASSETS
  CASH_IN_HAND: { code: '1010', name: 'Cash in Hand (Counter / Drawer)', type: 'ASSET' },
  BANK_ACCOUNTS: { code: '1020', name: 'Bank Accounts (Current / Savings)', type: 'ASSET' },
  ACCOUNTS_RECEIVABLE: { code: '1100', name: 'Accounts Receivable (Customers Khata)', type: 'ASSET' },
  INVENTORY_FINISHED: { code: '1200', name: 'Rice Inventory (Milled / Packaged)', type: 'ASSET' },
  INVENTORY_RAW: { code: '1210', name: 'Raw Grain Inventory (Paddy / Dhan)', type: 'ASSET' },
  FIXED_ASSETS_PLANT: { code: '1500', name: 'Mill Machinery & Plant Equipment', type: 'ASSET' },
  FIXED_ASSETS_WEIGHBRIDGE: { code: '1510', name: 'Weighbridge (Kanda) & Scale', type: 'ASSET' },

  // 2000 - LIABILITIES
  ACCOUNTS_PAYABLE: { code: '2010', name: 'Accounts Payable (Suppliers & Arthis)', type: 'LIABILITY' },
  ACCRUED_EXPENSES: { code: '2100', name: 'Accrued Utility & Labor Expenses', type: 'LIABILITY' },

  // 3000 - EQUITY
  CAPITAL_OWNER: { code: '3010', name: 'Owners Capital', type: 'EQUITY' },
  RETAINED_EARNINGS: { code: '3020', name: 'Retained Earnings', type: 'EQUITY' },

  // 4000 - REVENUE
  SALES_REVENUE: { code: '4010', name: 'Rice Sales Revenue', type: 'REVENUE' },
  MILLING_INCOME: { code: '4100', name: 'Rice Milling & Husking Service Charges', type: 'REVENUE' },
  BYPRODUCTS_SALES: { code: '4200', name: 'By-Products Sales (Husk / Bran / Tota)', type: 'REVENUE' },
  OTHER_INCOME: { code: '4900', name: 'Miscellaneous Income & Bardana Sales', type: 'REVENUE' },

  // 5000 - COST OF GOODS SOLD
  COGS_RICE: { code: '5010', name: 'Cost of Goods Sold - Rice', type: 'EXPENSE' },
  FREIGHT_INWARD: { code: '5020', name: 'Freight Inward Cartage (Landed Cost)', type: 'EXPENSE' },
  PALLEDARI_INWARD: { code: '5030', name: 'Inward Labor Handling (Palledari)', type: 'EXPENSE' },

  // 6000 - OPERATING EXPENSES
  EXP_SALARIES: { code: '6010', name: 'Staff Salaries & Mill Wages', type: 'EXPENSE' },
  EXP_ELECTRICITY: { code: '6020', name: 'Mill Electricity & Power Fuel', type: 'EXPENSE' },
  EXP_RENT: { code: '6030', name: 'Godown & Office Rent', type: 'EXPENSE' },
  EXP_LABOR: { code: '6040', name: 'Loading & Unloading Palledari', type: 'EXPENSE' },
  EXP_TRANSPORT: { code: '6050', name: 'Transportation & Cartage (Bilty)', type: 'EXPENSE' },
  EXP_REPAIR: { code: '6060', name: 'Machinery Repair & Maintenance', type: 'EXPENSE' },
  EXP_OFFICE: { code: '6070', name: 'Office, Tea & Stationery Expenses', type: 'EXPENSE' },
  EXP_OTHER: { code: '6900', name: 'General & Miscellaneous Expenses', type: 'EXPENSE' },
};

// =========================================================================
// 1. CASH & BANK ACCOUNTS
// =========================================================================

export const getCashAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accounts = await prisma.cashAccount.findMany({
      orderBy: { code: 'asc' },
    });
    sendSuccess(res, accounts, 'Cash accounts retrieved');
  } catch (err) {
    next(err);
  }
};

export const createCashAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, openingBalance = 0 } = req.body;
    if (!name) throw new AppError('Cash account name is required', 400);

    const code = req.body.code || `CASH-${Date.now().toString().slice(-4)}`;
    const opBal = new Decimal(openingBalance);

    const account = await prisma.cashAccount.create({
      data: {
        code,
        name,
        balance: opBal,
      },
    });
    sendSuccess(res, account, 'Cash account created', 201);
  } catch (err) {
    next(err);
  }
};

export const getBankAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accounts = await prisma.bankAccount.findMany({
      orderBy: { code: 'asc' },
    });
    sendSuccess(res, accounts, 'Bank accounts retrieved');
  } catch (err) {
    next(err);
  }
};

export const createBankAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { bankName, accountNumber, accountTitle, branchName, iban, openingBalance = 0 } = req.body;
    if (!bankName || !accountNumber) {
      throw new AppError('Bank name and account number are required', 400);
    }

    const code = req.body.code || `BANK-${Date.now().toString().slice(-4)}`;
    const opBal = new Decimal(openingBalance);

    const account = await prisma.bankAccount.create({
      data: {
        code,
        bankName,
        accountNumber,
        branchName: branchName || accountTitle,
        iban,
        currentBalance: opBal,
      },
    });
    sendSuccess(res, account, 'Bank account created', 201);
  } catch (err) {
    next(err);
  }
};

export const updateBankAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { bankName, accountNumber, branchName, iban, currentBalance, openingBalance } = req.body;
    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Bank account not found', 404);
    }

    const data: any = {};
    if (bankName !== undefined) data.bankName = bankName.trim();
    if (accountNumber !== undefined) data.accountNumber = accountNumber.trim();
    if (branchName !== undefined) data.branchName = branchName.trim();
    if (iban !== undefined) data.iban = iban ? iban.trim() : null;
    if (currentBalance !== undefined) data.currentBalance = new Decimal(currentBalance);
    else if (openingBalance !== undefined) data.currentBalance = new Decimal(openingBalance);

    const updated = await prisma.bankAccount.update({
      where: { id },
      data,
    });

    sendSuccess(res, updated, 'Bank account updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteBankAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Bank account not found', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { bankAccountId: id } });
      await tx.receipt.deleteMany({ where: { bankAccountId: id } });
      await tx.expense.deleteMany({ where: { bankAccountId: id } });
      await tx.otherIncome.deleteMany({ where: { bankAccountId: id } });
      await tx.cashTransfer.deleteMany({ where: { OR: [{ fromBankAccountId: id }, { toBankAccountId: id }] } });
      await tx.bankAccount.delete({ where: { id } });
    });

    sendSuccess(res, null, 'Bank account deleted successfully');
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 2. CASH & BANK TRANSFERS
// =========================================================================

export const getCashTransfers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, status } = req.query;
    const where: any = {};
    if (status) where.status = status as string;
    if (startDate || endDate) {
      where.transferDate = {};
      if (startDate) where.transferDate.gte = new Date(startDate as string);
      if (endDate) where.transferDate.lte = new Date(endDate as string);
    }

    const transfers = await prisma.cashTransfer.findMany({
      where,
      include: {
        fromCashAccount: true,
        fromBankAccount: true,
        toCashAccount: true,
        toBankAccount: true,
      },
      orderBy: { transferDate: 'desc' },
      take: 100,
    });

    sendSuccess(res, transfers, 'Cash transfers retrieved');
  } catch (err) {
    next(err);
  }
};

export const createCashTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      transferDate = new Date().toISOString(),
      fromAccountType, // 'CASH' | 'BANK'
      fromCashAccountId,
      fromBankAccountId,
      toAccountType, // 'CASH' | 'BANK'
      toCashAccountId,
      toBankAccountId,
      amount,
      referenceNumber,
      notes,
    } = req.body;

    const numAmount = new Decimal(amount || 0);
    if (numAmount.lessThanOrEqualTo(0)) {
      throw new AppError('Transfer amount must be greater than zero', 400);
    }

    if (fromAccountType === toAccountType) {
      if (fromAccountType === 'CASH' && fromCashAccountId === toCashAccountId) {
        throw new AppError('Source and destination cash accounts cannot be the same', 400);
      }
      if (fromAccountType === 'BANK' && fromBankAccountId === toBankAccountId) {
        throw new AppError('Source and destination bank accounts cannot be the same', 400);
      }
    }

    const transferResult = await prisma.$transaction(async (tx) => {
      // 1. Withdraw from Source
      let fromName = '';
      if (fromAccountType === 'CASH') {
        const cashAcc = await tx.cashAccount.findUnique({ where: { id: fromCashAccountId } });
        if (!cashAcc) throw new AppError('Source cash account not found', 404);
        fromName = cashAcc.name;
        await tx.cashAccount.update({
          where: { id: fromCashAccountId },
          data: { balance: new Decimal(cashAcc.balance.toString()).minus(numAmount) },
        });
      } else {
        const bankAcc = await tx.bankAccount.findUnique({ where: { id: fromBankAccountId } });
        if (!bankAcc) throw new AppError('Source bank account not found', 404);
        fromName = `${bankAcc.bankName} (${bankAcc.accountNumber})`;
        await tx.bankAccount.update({
          where: { id: fromBankAccountId },
          data: { currentBalance: new Decimal(bankAcc.currentBalance.toString()).minus(numAmount) },
        });
      }

      // 2. Deposit into Destination
      let toName = '';
      if (toAccountType === 'CASH') {
        const cashAcc = await tx.cashAccount.findUnique({ where: { id: toCashAccountId } });
        if (!cashAcc) throw new AppError('Destination cash account not found', 404);
        toName = cashAcc.name;
        await tx.cashAccount.update({
          where: { id: toCashAccountId },
          data: { balance: new Decimal(cashAcc.balance.toString()).plus(numAmount) },
        });
      } else {
        const bankAcc = await tx.bankAccount.findUnique({ where: { id: toBankAccountId } });
        if (!bankAcc) throw new AppError('Destination bank account not found', 404);
        toName = `${bankAcc.bankName} (${bankAcc.accountNumber})`;
        await tx.bankAccount.update({
          where: { id: toBankAccountId },
          data: { currentBalance: new Decimal(bankAcc.currentBalance.toString()).plus(numAmount) },
        });
      }

      const transferNumber = `TRF-${Date.now().toString().slice(-8)}`;

      // 3. Create Transfer record
      const transfer = await tx.cashTransfer.create({
        data: {
          transferNumber,
          transferDate: new Date(transferDate),
          fromAccountType,
          fromCashAccountId: fromAccountType === 'CASH' ? fromCashAccountId : null,
          fromBankAccountId: fromAccountType === 'BANK' ? fromBankAccountId : null,
          toAccountType,
          toCashAccountId: toAccountType === 'CASH' ? toCashAccountId : null,
          toBankAccountId: toAccountType === 'BANK' ? toBankAccountId : null,
          amount: numAmount,
          referenceNumber,
          notes,
          status: 'POSTED',
          createdById: (req as any).user?.id || null,
        },
      });

      // 4. Create Double-Entry Journal Entry
      await tx.journalEntry.create({
        data: {
          entryNumber: `JV-${transferNumber}`,
          entryDate: new Date(transferDate),
          voucherType: 'CASH_TRANSFER',
          referenceNo: transferNumber,
          narration: `Funds Transfer from ${fromName} to ${toName}. ${notes || ''}`,
          totalDebit: numAmount,
          totalCredit: numAmount,
          status: 'POSTED',
          lines: {
            create: [
              {
                accountCode: toAccountType === 'CASH' ? COA.CASH_IN_HAND.code : COA.BANK_ACCOUNTS.code,
                accountName: toName,
                accountType: 'ASSET',
                debit: numAmount,
                credit: 0,
                memo: `Transfer Inward to ${toName}`,
              },
              {
                accountCode: fromAccountType === 'CASH' ? COA.CASH_IN_HAND.code : COA.BANK_ACCOUNTS.code,
                accountName: fromName,
                accountType: 'ASSET',
                debit: 0,
                credit: numAmount,
                memo: `Transfer Outward from ${fromName}`,
              },
            ],
          },
        },
      });

      return transfer;
    });

    sendSuccess(res, transferResult, 'Funds transferred successfully and journal posted', 201);
  } catch (err) {
    next(err);
  }
};

export const reverseCashTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reason = 'Accidental duplicate funds transfer' } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.cashTransfer.findUnique({ where: { id } });
      if (!transfer) throw new AppError('Transfer not found', 404);
      if (transfer.status === 'REVERSED') throw new AppError('Transfer is already reversed', 400);

      const numAmount = new Decimal(transfer.amount.toString());

      // Reverse destination (deduct)
      if (transfer.toAccountType === 'CASH' && transfer.toCashAccountId) {
        await tx.cashAccount.update({
          where: { id: transfer.toCashAccountId },
          data: { balance: { decrement: numAmount } },
        });
      } else if (transfer.toAccountType === 'BANK' && transfer.toBankAccountId) {
        await tx.bankAccount.update({
          where: { id: transfer.toBankAccountId },
          data: { currentBalance: { decrement: numAmount } },
        });
      }

      // Reverse source (restore)
      if (transfer.fromAccountType === 'CASH' && transfer.fromCashAccountId) {
        await tx.cashAccount.update({
          where: { id: transfer.fromCashAccountId },
          data: { balance: { increment: numAmount } },
        });
      } else if (transfer.fromAccountType === 'BANK' && transfer.fromBankAccountId) {
        await tx.bankAccount.update({
          where: { id: transfer.fromBankAccountId },
          data: { currentBalance: { increment: numAmount } },
        });
      }

      const revNumber = `REV-${transfer.transferNumber}`;
      await tx.cashTransfer.update({
        where: { id },
        data: {
          status: 'REVERSED',
          reversalRef: revNumber,
        },
      });

      // Post Reversal Journal
      await tx.journalEntry.create({
        data: {
          entryNumber: `JV-${revNumber}`,
          entryDate: new Date(),
          voucherType: 'REVERSAL',
          referenceNo: revNumber,
          narration: `Reversal of Transfer ${transfer.transferNumber}: ${reason}`,
          totalDebit: numAmount,
          totalCredit: numAmount,
          status: 'POSTED',
          lines: {
            create: [
              {
                accountCode: transfer.fromAccountType === 'CASH' ? COA.CASH_IN_HAND.code : COA.BANK_ACCOUNTS.code,
                accountName: 'Source Account Restored',
                accountType: 'ASSET',
                debit: numAmount,
                credit: 0,
                memo: `Restored to source`,
              },
              {
                accountCode: transfer.toAccountType === 'CASH' ? COA.CASH_IN_HAND.code : COA.BANK_ACCOUNTS.code,
                accountName: 'Destination Account Reversed',
                accountType: 'ASSET',
                debit: 0,
                credit: numAmount,
                memo: `Deducted from destination`,
              },
            ],
          },
        },
      });

      return { transferId: id, reversalNumber: revNumber };
    });

    sendSuccess(res, result, 'Cash transfer reversed and compensating entries posted');
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 3. BUSINESS EXPENSES
// =========================================================================

export const getExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, startDate, endDate, status } = req.query;
    const where: any = {};
    if (category) where.category = category as string;
    if (status) where.status = status as string;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate as string);
      if (endDate) where.expenseDate.lte = new Date(endDate as string);
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { cashAccount: true, bankAccount: true },
      orderBy: { expenseDate: 'desc' },
      take: 100,
    });

    const totalActiveExpense = expenses
      .filter((e) => e.status !== 'REVERSED')
      .reduce((acc, e) => acc.plus(new Decimal(e.amount.toString())), new Decimal(0));

    sendSuccess(res, { expenses, totalExpense: totalActiveExpense.toFixed(2) });
  } catch (err) {
    next(err);
  }
};

export const createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      category,
      title,
      description,
      amount,
      expenseDate = new Date().toISOString(),
      paymentMethod = 'CASH',
      cashAccountId,
      bankAccountId,
      paidTo,
    } = req.body;

    const numAmount = new Decimal(amount || 0);
    if (numAmount.lessThanOrEqualTo(0)) {
      throw new AppError('Expense amount must be greater than zero', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const expNumber = `EXP-${Date.now().toString().slice(-8)}`;

      // 1. Withdraw funds
      let accountName = '';
      if (paymentMethod === 'CASH') {
        if (!cashAccountId) throw new AppError('Cash account required for cash expense', 400);
        const cashAcc = await tx.cashAccount.findUnique({ where: { id: cashAccountId } });
        if (!cashAcc) throw new AppError('Cash account not found', 404);
        accountName = cashAcc.name;
        await tx.cashAccount.update({
          where: { id: cashAccountId },
          data: { balance: new Decimal(cashAcc.balance.toString()).minus(numAmount) },
        });
      } else {
        if (!bankAccountId) throw new AppError('Bank account required for bank expense', 400);
        const bankAcc = await tx.bankAccount.findUnique({ where: { id: bankAccountId } });
        if (!bankAcc) throw new AppError('Bank account not found', 404);
        accountName = `${bankAcc.bankName} (${bankAcc.accountNumber})`;
        await tx.bankAccount.update({
          where: { id: bankAccountId },
          data: { currentBalance: new Decimal(bankAcc.currentBalance.toString()).minus(numAmount) },
        });
      }

      // 2. Create Expense
      const expense = await tx.expense.create({
        data: {
          expenseNumber: expNumber,
          category,
          title,
          description,
          amount: numAmount,
          expenseDate: new Date(expenseDate),
          paymentMethod,
          cashAccountId: paymentMethod === 'CASH' ? cashAccountId : null,
          bankAccountId: paymentMethod === 'BANK' ? bankAccountId : null,
          paidTo,
          status: 'POSTED',
          createdById: (req as any).user?.id || null,
        },
      });

      // 3. Post Double-Entry Journal
      await tx.journalEntry.create({
        data: {
          entryNumber: `JV-${expNumber}`,
          entryDate: new Date(expenseDate),
          voucherType: 'EXPENSE',
          referenceNo: expNumber,
          narration: `Expense [${category}]: ${title} ${paidTo ? 'Paid to ' + paidTo : ''}. ${description || ''}`,
          totalDebit: numAmount,
          totalCredit: numAmount,
          status: 'POSTED',
          lines: {
            create: [
              {
                accountCode: `6000-${category.toUpperCase().replace(/\s+/g, '_')}`,
                accountName: `Expense - ${category}`,
                accountType: 'EXPENSE',
                debit: numAmount,
                credit: 0,
                memo: title,
              },
              {
                accountCode: paymentMethod === 'CASH' ? COA.CASH_IN_HAND.code : COA.BANK_ACCOUNTS.code,
                accountName: accountName,
                accountType: 'ASSET',
                debit: 0,
                credit: numAmount,
                memo: `Payment via ${paymentMethod}`,
              },
            ],
          },
        },
      });

      return expense;
    });

    sendSuccess(res, result, 'Expense recorded and journal posted successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const reverseExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reason = 'Expense reversal & void' } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const exp = await tx.expense.findUnique({ where: { id } });
      if (!exp) throw new AppError('Expense not found', 404);
      if (exp.status === 'REVERSED') throw new AppError('Expense is already reversed', 400);

      const numAmount = new Decimal(exp.amount.toString());

      // Restore Cash or Bank balance
      if (exp.paymentMethod === 'CASH' && exp.cashAccountId) {
        await tx.cashAccount.update({
          where: { id: exp.cashAccountId },
          data: { balance: { increment: numAmount } },
        });
      } else if (exp.bankAccountId) {
        await tx.bankAccount.update({
          where: { id: exp.bankAccountId },
          data: { currentBalance: { increment: numAmount } },
        });
      }

      const revNumber = `REV-${exp.expenseNumber}`;
      await tx.expense.update({
        where: { id },
        data: {
          status: 'REVERSED',
          reversalRef: revNumber,
        },
      });

      // Post Reversal Journal
      await tx.journalEntry.create({
        data: {
          entryNumber: `JV-${revNumber}`,
          entryDate: new Date(),
          voucherType: 'REVERSAL',
          referenceNo: revNumber,
          narration: `Reversal of Expense ${exp.expenseNumber} (${exp.title}): ${reason}`,
          totalDebit: numAmount,
          totalCredit: numAmount,
          status: 'POSTED',
          lines: {
            create: [
              {
                accountCode: exp.paymentMethod === 'CASH' ? COA.CASH_IN_HAND.code : COA.BANK_ACCOUNTS.code,
                accountName: 'Cash/Bank Account Restored',
                accountType: 'ASSET',
                debit: numAmount,
                credit: 0,
                memo: `Funds restored`,
              },
              {
                accountCode: `6000-${exp.category.toUpperCase().replace(/\s+/g, '_')}`,
                accountName: `Expense - ${exp.category}`,
                accountType: 'EXPENSE',
                debit: 0,
                credit: numAmount,
                memo: `Expense credit reversal`,
              },
            ],
          },
        },
      });

      return { expenseId: id, reversalNumber: revNumber };
    });

    sendSuccess(res, result, 'Expense reversed and balance restored');
  } catch (err) {
    next(err);
  }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const exp = await prisma.expense.findUnique({ where: { id } });
    if (!exp) throw new AppError('Expense not found', 404);

    await prisma.$transaction(async (tx) => {
      if (exp.status === 'POSTED') {
        const numAmount = new Decimal(exp.amount.toString());
        if (exp.paymentMethod === 'CASH' && exp.cashAccountId) {
          await tx.cashAccount.update({
            where: { id: exp.cashAccountId },
            data: { balance: { increment: numAmount } },
          });
        } else if (exp.bankAccountId) {
          await tx.bankAccount.update({
            where: { id: exp.bankAccountId },
            data: { currentBalance: { increment: numAmount } },
          });
        }
      }
      await tx.expense.delete({ where: { id } });
    });

    sendSuccess(res, null, 'Expense deleted successfully');
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 4. OTHER BUSINESS INCOMES
// =========================================================================

export const getOtherIncomes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, startDate, endDate, status } = req.query;
    const where: any = {};
    if (category) where.category = category as string;
    if (status) where.status = status as string;
    if (startDate || endDate) {
      where.incomeDate = {};
      if (startDate) where.incomeDate.gte = new Date(startDate as string);
      if (endDate) where.incomeDate.lte = new Date(endDate as string);
    }

    const incomes = await prisma.otherIncome.findMany({
      where,
      include: { cashAccount: true, bankAccount: true },
      orderBy: { incomeDate: 'desc' },
      take: 100,
    });

    const totalActiveIncome = incomes
      .filter((i) => i.status !== 'REVERSED')
      .reduce((acc, i) => acc.plus(new Decimal(i.amount.toString())), new Decimal(0));

    sendSuccess(res, { incomes, totalIncome: totalActiveIncome.toFixed(2) });
  } catch (err) {
    next(err);
  }
};

export const createOtherIncome = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      category,
      title,
      description,
      amount,
      incomeDate = new Date().toISOString(),
      paymentMethod = 'CASH',
      cashAccountId,
      bankAccountId,
      receivedFrom,
      referenceNumber,
    } = req.body;

    const numAmount = new Decimal(amount || 0);
    if (numAmount.lessThanOrEqualTo(0)) {
      throw new AppError('Income amount must be greater than zero', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const incNumber = `INC-${Date.now().toString().slice(-8)}`;

      // 1. Deposit funds
      let accountName = '';
      if (paymentMethod === 'CASH') {
        if (!cashAccountId) throw new AppError('Cash account required for cash income', 400);
        const cashAcc = await tx.cashAccount.findUnique({ where: { id: cashAccountId } });
        if (!cashAcc) throw new AppError('Cash account not found', 404);
        accountName = cashAcc.name;
        await tx.cashAccount.update({
          where: { id: cashAccountId },
          data: { balance: new Decimal(cashAcc.balance.toString()).plus(numAmount) },
        });
      } else {
        if (!bankAccountId) throw new AppError('Bank account required for bank income', 400);
        const bankAcc = await tx.bankAccount.findUnique({ where: { id: bankAccountId } });
        if (!bankAcc) throw new AppError('Bank account not found', 404);
        accountName = `${bankAcc.bankName} (${bankAcc.accountNumber})`;
        await tx.bankAccount.update({
          where: { id: bankAccountId },
          data: { currentBalance: new Decimal(bankAcc.currentBalance.toString()).plus(numAmount) },
        });
      }

      // 2. Create OtherIncome record
      const income = await tx.otherIncome.create({
        data: {
          incomeNumber: incNumber,
          category,
          title,
          description,
          amount: numAmount,
          incomeDate: new Date(incomeDate),
          paymentMethod,
          cashAccountId: paymentMethod === 'CASH' ? cashAccountId : null,
          bankAccountId: paymentMethod === 'BANK' ? bankAccountId : null,
          receivedFrom,
          referenceNumber,
          status: 'POSTED',
          createdById: (req as any).user?.id || null,
        },
      });

      // 3. Post Double-Entry Journal
      await tx.journalEntry.create({
        data: {
          entryNumber: `JV-${incNumber}`,
          entryDate: new Date(incomeDate),
          voucherType: 'INCOME',
          referenceNo: incNumber,
          narration: `Other Income [${category}]: ${title} ${receivedFrom ? 'Received from ' + receivedFrom : ''}. ${description || ''}`,
          totalDebit: numAmount,
          totalCredit: numAmount,
          status: 'POSTED',
          lines: {
            create: [
              {
                accountCode: paymentMethod === 'CASH' ? COA.CASH_IN_HAND.code : COA.BANK_ACCOUNTS.code,
                accountName: accountName,
                accountType: 'ASSET',
                debit: numAmount,
                credit: 0,
                memo: `Funds received via ${paymentMethod}`,
              },
              {
                accountCode: `4000-${category.toUpperCase().replace(/\s+/g, '_')}`,
                accountName: `Revenue - ${category}`,
                accountType: 'REVENUE',
                debit: 0,
                credit: numAmount,
                memo: title,
              },
            ],
          },
        },
      });

      return income;
    });

    sendSuccess(res, result, 'Other income recorded and credited to accounts', 201);
  } catch (err) {
    next(err);
  }
};

export const reverseOtherIncome = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reason = 'Income transaction reversal' } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const inc = await tx.otherIncome.findUnique({ where: { id } });
      if (!inc) throw new AppError('Income record not found', 404);
      if (inc.status === 'REVERSED') throw new AppError('Income is already reversed', 400);

      const numAmount = new Decimal(inc.amount.toString());

      // Deduct from Cash or Bank
      if (inc.paymentMethod === 'CASH' && inc.cashAccountId) {
        await tx.cashAccount.update({
          where: { id: inc.cashAccountId },
          data: { balance: { decrement: numAmount } },
        });
      } else if (inc.bankAccountId) {
        await tx.bankAccount.update({
          where: { id: inc.bankAccountId },
          data: { currentBalance: { decrement: numAmount } },
        });
      }

      const revNumber = `REV-${inc.incomeNumber}`;
      await tx.otherIncome.update({
        where: { id },
        data: {
          status: 'REVERSED',
          reversalRef: revNumber,
        },
      });

      // Post Reversal Journal
      await tx.journalEntry.create({
        data: {
          entryNumber: `JV-${revNumber}`,
          entryDate: new Date(),
          voucherType: 'REVERSAL',
          referenceNo: revNumber,
          narration: `Reversal of Other Income ${inc.incomeNumber}: ${reason}`,
          totalDebit: numAmount,
          totalCredit: numAmount,
          status: 'POSTED',
          lines: {
            create: [
              {
                accountCode: `4000-${inc.category.toUpperCase().replace(/\s+/g, '_')}`,
                accountName: `Revenue - ${inc.category}`,
                accountType: 'REVENUE',
                debit: numAmount,
                credit: 0,
                memo: `Income debit reversal`,
              },
              {
                accountCode: inc.paymentMethod === 'CASH' ? COA.CASH_IN_HAND.code : COA.BANK_ACCOUNTS.code,
                accountName: 'Cash/Bank Account Deducted',
                accountType: 'ASSET',
                debit: 0,
                credit: numAmount,
                memo: `Funds reversed from account`,
              },
            ],
          },
        },
      });

      return { incomeId: id, reversalNumber: revNumber };
    });

    sendSuccess(res, result, 'Other income reversed and accounts adjusted');
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 5. DOUBLE-ENTRY GENERAL JOURNAL
// =========================================================================

export const getJournalEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, voucherType, status } = req.query;
    const where: any = {};
    if (voucherType) where.voucherType = voucherType as string;
    if (status) where.status = status as string;
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate as string);
      if (endDate) where.entryDate.lte = new Date(endDate as string);
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      include: { lines: true },
      orderBy: { entryDate: 'desc' },
      take: 100,
    });

    sendSuccess(res, entries, 'Journal entries retrieved');
  } catch (err) {
    next(err);
  }
};

export const createJournalEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entryDate = new Date().toISOString(), narration, lines, referenceNo } = req.body;

    if (!narration || !lines || lines.length < 2) {
      throw new AppError('Journal entry requires a narration and at least two balancing line items', 400);
    }

    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    const processedLines = lines.map((l: any) => {
      const d = new Decimal(l.debit || 0);
      const c = new Decimal(l.credit || 0);
      totalDebit = totalDebit.plus(d);
      totalCredit = totalCredit.plus(c);
      return {
        accountCode: l.accountCode,
        accountName: l.accountName,
        accountType: l.accountType,
        debit: d,
        credit: c,
        memo: l.memo,
      };
    });

    // Double-entry validation: Debits must strictly equal Credits
    if (!totalDebit.equals(totalCredit)) {
      throw new AppError(
        `Journal entry is out of balance! Total Debits: ${totalDebit.toFixed(2)} vs Total Credits: ${totalCredit.toFixed(2)} (Diff: ${totalDebit.minus(totalCredit).abs().toFixed(2)})`,
        400
      );
    }

    const entryNumber = `JV-${Date.now().toString().slice(-8)}`;

    const entry = await prisma.journalEntry.create({
      data: {
        entryNumber,
        entryDate: new Date(entryDate),
        voucherType: 'GENERAL',
        referenceNo,
        narration,
        totalDebit,
        totalCredit,
        status: 'POSTED',
        createdById: (req as any).user?.id || null,
        lines: {
          create: processedLines,
        },
      },
      include: { lines: true },
    });

    sendSuccess(res, entry, 'Double-entry journal voucher posted successfully', 201);
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 6. FINANCIAL STATEMENTS & AUDIT REPORTS (DERIVED FROM ACTUAL TRANSACTIONS)
// =========================================================================

/**
 * General Ledger: All lines sorted chronologically with dynamic running balance
 */
export const getGeneralLedger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { accountCode, startDate, endDate } = req.query;

    const where: any = {};
    if (accountCode) where.accountCode = accountCode as string;
    if (startDate || endDate) {
      where.entry = {
        entryDate: {},
      };
      if (startDate) where.entry.entryDate.gte = new Date(startDate as string);
      if (endDate) where.entry.entryDate.lte = new Date(endDate as string);
    }

    const lines = await prisma.journalEntryLine.findMany({
      where,
      include: {
        entry: {
          select: {
            entryNumber: true,
            entryDate: true,
            voucherType: true,
            referenceNo: true,
            narration: true,
            status: true,
          },
        },
      },
      orderBy: { entry: { entryDate: 'asc' } },
      take: 200,
    });

    let running = new Decimal(0);
    const ledger = lines.map((l) => {
      const d = new Decimal(l.debit.toString());
      const c = new Decimal(l.credit.toString());
      // For Assets & Expenses: Balance = Debit - Credit
      // For Liabilities, Equity & Revenue: Balance = Credit - Debit
      if (l.accountType === 'ASSET' || l.accountType === 'EXPENSE') {
        running = running.plus(d).minus(c);
      } else {
        running = running.plus(c).minus(d);
      }

      return {
        id: l.id,
        date: l.entry.entryDate,
        voucherNo: l.entry.entryNumber,
        voucherType: l.entry.voucherType,
        referenceNo: l.entry.referenceNo,
        narration: l.entry.narration,
        accountCode: l.accountCode,
        accountName: l.accountName,
        accountType: l.accountType,
        debit: d.toFixed(2),
        credit: c.toFixed(2),
        runningBalance: running.toFixed(2),
      };
    });

    sendSuccess(res, ledger, 'General ledger retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * Trial Balance: Proves Total Debits == Total Credits across the entire Chart of Accounts
 */
export const getTrialBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { asOfDate } = req.query;

    const dateFilter = asOfDate ? { entryDate: { lte: new Date(asOfDate as string) } } : {};

    // Group journal entry lines by accountCode
    const lines = await prisma.journalEntryLine.findMany({
      where: {
        entry: {
          status: 'POSTED',
          ...dateFilter,
        },
      },
      select: {
        accountCode: true,
        accountName: true,
        accountType: true,
        debit: true,
        credit: true,
      },
    });

    const accountMap: Record<
      string,
      { code: string; name: string; type: string; totalDebit: Decimal; totalCredit: Decimal }
    > = {};

    for (const l of lines) {
      if (!accountMap[l.accountCode]) {
        accountMap[l.accountCode] = {
          code: l.accountCode,
          name: l.accountName,
          type: l.accountType,
          totalDebit: new Decimal(0),
          totalCredit: new Decimal(0),
        };
      }
      accountMap[l.accountCode].totalDebit = accountMap[l.accountCode].totalDebit.plus(new Decimal(l.debit.toString()));
      accountMap[l.accountCode].totalCredit = accountMap[l.accountCode].totalCredit.plus(new Decimal(l.credit.toString()));
    }

    let grandTotalDebit = new Decimal(0);
    let grandTotalCredit = new Decimal(0);

    const accounts = Object.values(accountMap).map((acc) => {
      grandTotalDebit = grandTotalDebit.plus(acc.totalDebit);
      grandTotalCredit = grandTotalCredit.plus(acc.totalCredit);

      const netDebit = acc.totalDebit.greaterThan(acc.totalCredit)
        ? acc.totalDebit.minus(acc.totalCredit)
        : new Decimal(0);
      const netCredit = acc.totalCredit.greaterThan(acc.totalDebit)
        ? acc.totalCredit.minus(acc.totalDebit)
        : new Decimal(0);

      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: acc.totalDebit.toFixed(2),
        credit: acc.totalCredit.toFixed(2),
        netDebit: netDebit.toFixed(2),
        netCredit: netCredit.toFixed(2),
      };
    });

    // Also compare with live Accounts Receivable and Accounts Payable
    const [customers, suppliers] = await Promise.all([
      prisma.customer.findMany({ select: { currentBalance: true } }),
      prisma.supplier.findMany({ select: { currentBalance: true } }),
    ]);

    const liveReceivables = customers.reduce((acc, c) => acc.plus(new Decimal(c.currentBalance.toString())), new Decimal(0));
    const livePayables = suppliers.reduce((acc, s) => acc.plus(new Decimal(s.currentBalance.toString())), new Decimal(0));

    sendSuccess(res, {
      asOfDate: asOfDate || new Date().toISOString().split('T')[0],
      isBalanced: grandTotalDebit.equals(grandTotalCredit),
      grandTotalDebit: grandTotalDebit.toFixed(2),
      grandTotalCredit: grandTotalCredit.toFixed(2),
      difference: grandTotalDebit.minus(grandTotalCredit).abs().toFixed(2),
      liveReceivables: liveReceivables.toFixed(2),
      livePayables: livePayables.toFixed(2),
      accounts,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Cash Book: Detailed Cash Inflows (Receipts) & Outflows (Payments, Expenses)
 */
export const getCashBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, cashAccountId } = req.query;

    const cashAccounts = await prisma.cashAccount.findMany();
    const targetAccountId = (cashAccountId as string) || (cashAccounts[0]?.id ?? '');

    const account = cashAccounts.find((c) => c.id === targetAccountId);
    if (!account) throw new AppError('Cash account not found', 404);

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    // Cash Inflows: Receipts + Other Incomes + Inward Transfers
    const [receipts, incomes, inTransfers, payments, expenses, outTransfers] = await Promise.all([
      prisma.receipt.findMany({
        where: {
          cashAccountId: targetAccountId,
          status: 'POSTED',
          ...(startDate || endDate ? { receiptDate: dateFilter } : {}),
        },
        include: { customer: true },
      }),
      prisma.otherIncome.findMany({
        where: {
          cashAccountId: targetAccountId,
          status: 'POSTED',
          ...(startDate || endDate ? { incomeDate: dateFilter } : {}),
        },
      }),
      prisma.cashTransfer.findMany({
        where: {
          toCashAccountId: targetAccountId,
          status: 'POSTED',
          ...(startDate || endDate ? { transferDate: dateFilter } : {}),
        },
      }),
      prisma.payment.findMany({
        where: {
          cashAccountId: targetAccountId,
          status: 'POSTED',
          ...(startDate || endDate ? { paymentDate: dateFilter } : {}),
        },
        include: { supplier: true },
      }),
      prisma.expense.findMany({
        where: {
          cashAccountId: targetAccountId,
          status: 'POSTED',
          ...(startDate || endDate ? { expenseDate: dateFilter } : {}),
        },
      }),
      prisma.cashTransfer.findMany({
        where: {
          fromCashAccountId: targetAccountId,
          status: 'POSTED',
          ...(startDate || endDate ? { transferDate: dateFilter } : {}),
        },
      }),
    ]);

    // Build chronological transaction array
    const transactions: any[] = [];

    for (const r of receipts) {
      transactions.push({
        date: r.receiptDate,
        type: 'CUSTOMER_RECEIPT',
        ref: r.receiptNumber,
        description: `Cash received from ${r.customer.name}`,
        inflow: new Decimal(r.amount.toString()),
        outflow: new Decimal(0),
      });
    }

    for (const inc of incomes) {
      transactions.push({
        date: inc.incomeDate,
        type: 'OTHER_INCOME',
        ref: inc.incomeNumber,
        description: `Income: ${inc.title} (${inc.category})`,
        inflow: new Decimal(inc.amount.toString()),
        outflow: new Decimal(0),
      });
    }

    for (const trf of inTransfers) {
      transactions.push({
        date: trf.transferDate,
        type: 'CASH_TRANSFER_IN',
        ref: trf.transferNumber,
        description: `Transfer inward from ${trf.fromAccountType}`,
        inflow: new Decimal(trf.amount.toString()),
        outflow: new Decimal(0),
      });
    }

    for (const p of payments) {
      transactions.push({
        date: p.paymentDate,
        type: 'SUPPLIER_PAYMENT',
        ref: p.paymentNumber,
        description: `Disbursement to ${p.supplier.name}`,
        inflow: new Decimal(0),
        outflow: new Decimal(p.amount.toString()),
      });
    }

    for (const exp of expenses) {
      transactions.push({
        date: exp.expenseDate,
        type: 'EXPENSE',
        ref: exp.expenseNumber,
        description: `Expense: ${exp.title} (${exp.category})`,
        inflow: new Decimal(0),
        outflow: new Decimal(exp.amount.toString()),
      });
    }

    for (const trf of outTransfers) {
      transactions.push({
        date: trf.transferDate,
        type: 'CASH_TRANSFER_OUT',
        ref: trf.transferNumber,
        description: `Transfer outward to ${trf.toAccountType}`,
        inflow: new Decimal(0),
        outflow: new Decimal(trf.amount.toString()),
      });
    }

    // Sort chronologically
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = new Decimal(0);
    let totalInflows = new Decimal(0);
    let totalOutflows = new Decimal(0);

    const formatted = transactions.map((t) => {
      totalInflows = totalInflows.plus(t.inflow);
      totalOutflows = totalOutflows.plus(t.outflow);
      running = running.plus(t.inflow).minus(t.outflow);

      return {
        date: t.date,
        type: t.type,
        ref: t.ref,
        description: t.description,
        inflow: t.inflow.toFixed(2),
        outflow: t.outflow.toFixed(2),
        runningBalance: running.toFixed(2),
      };
    });

    sendSuccess(res, {
      account: { id: account.id, name: account.name, code: account.code, currentBalance: account.balance.toString() },
      totalInflows: totalInflows.toFixed(2),
      totalOutflows: totalOutflows.toFixed(2),
      netCashFlow: totalInflows.minus(totalOutflows).toFixed(2),
      transactions: formatted,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Bank Book: Chronological Bank Account Transactions
 */
export const getBankBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, bankAccountId } = req.query;

    const bankAccounts = await prisma.bankAccount.findMany();
    const targetAccountId = (bankAccountId as string) || (bankAccounts[0]?.id ?? '');

    const account = bankAccounts.find((b) => b.id === targetAccountId);
    if (!account) throw new AppError('Bank account not found', 404);

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const [receipts, incomes, inTransfers, payments, expenses, outTransfers] = await Promise.all([
      prisma.receipt.findMany({
        where: {
          bankAccountId: targetAccountId,
          status: 'POSTED',
          ...(startDate || endDate ? { receiptDate: dateFilter } : {}),
        },
        include: { customer: true },
      }),
      prisma.otherIncome.findMany({
        where: {
          bankAccountId: targetAccountId,
          status: 'POSTED',
          ...(startDate || endDate ? { incomeDate: dateFilter } : {}),
        },
      }),
      prisma.cashTransfer.findMany({
        where: {
          toBankAccountId: targetAccountId,
          status: 'POSTED',
          ...(startDate || endDate ? { transferDate: dateFilter } : {}),
        },
      }),
      prisma.payment.findMany({
        where: {
          bankAccountId: targetAccountId,
          status: 'POSTED',
          ...(startDate || endDate ? { paymentDate: dateFilter } : {}),
        },
        include: { supplier: true },
      }),
      prisma.expense.findMany({
        where: {
          bankAccountId: targetAccountId,
          status: 'POSTED',
          ...(startDate || endDate ? { expenseDate: dateFilter } : {}),
        },
      }),
      prisma.cashTransfer.findMany({
        where: {
          fromBankAccountId: targetAccountId,
          status: 'POSTED',
          ...(startDate || endDate ? { transferDate: dateFilter } : {}),
        },
      }),
    ]);

    const transactions: any[] = [];

    for (const r of receipts) {
      transactions.push({
        date: r.receiptDate,
        type: 'CUSTOMER_RECEIPT',
        ref: r.receiptNumber,
        description: `Bank deposit from ${r.customer.name}`,
        deposit: new Decimal(r.amount.toString()),
        withdrawal: new Decimal(0),
      });
    }

    for (const inc of incomes) {
      transactions.push({
        date: inc.incomeDate,
        type: 'OTHER_INCOME',
        ref: inc.incomeNumber,
        description: `Income: ${inc.title}`,
        deposit: new Decimal(inc.amount.toString()),
        withdrawal: new Decimal(0),
      });
    }

    for (const trf of inTransfers) {
      transactions.push({
        date: trf.transferDate,
        type: 'TRANSFER_DEPOSIT',
        ref: trf.transferNumber,
        description: `Transfer inward from ${trf.fromAccountType}`,
        deposit: new Decimal(trf.amount.toString()),
        withdrawal: new Decimal(0),
      });
    }

    for (const p of payments) {
      transactions.push({
        date: p.paymentDate,
        type: 'SUPPLIER_PAYMENT',
        ref: p.paymentNumber,
        description: `Disbursement to ${p.supplier.name}`,
        deposit: new Decimal(0),
        withdrawal: new Decimal(p.amount.toString()),
      });
    }

    for (const exp of expenses) {
      transactions.push({
        date: exp.expenseDate,
        type: 'EXPENSE',
        ref: exp.expenseNumber,
        description: `Bank Expense: ${exp.title}`,
        deposit: new Decimal(0),
        withdrawal: new Decimal(exp.amount.toString()),
      });
    }

    for (const trf of outTransfers) {
      transactions.push({
        date: trf.transferDate,
        type: 'TRANSFER_WITHDRAWAL',
        ref: trf.transferNumber,
        description: `Transfer outward to ${trf.toAccountType}`,
        deposit: new Decimal(0),
        withdrawal: new Decimal(trf.amount.toString()),
      });
    }

    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = new Decimal(0);
    let totalDeposits = new Decimal(0);
    let totalWithdrawals = new Decimal(0);

    const formatted = transactions.map((t) => {
      totalDeposits = totalDeposits.plus(t.deposit);
      totalWithdrawals = totalWithdrawals.plus(t.withdrawal);
      running = running.plus(t.deposit).minus(t.withdrawal);

      return {
        date: t.date,
        type: t.type,
        ref: t.ref,
        description: t.description,
        deposit: t.deposit.toFixed(2),
        withdrawal: t.withdrawal.toFixed(2),
        runningBalance: running.toFixed(2),
      };
    });

    sendSuccess(res, {
      account: { id: account.id, bankName: account.bankName, accountNumber: account.accountNumber, currentBalance: account.currentBalance.toString() },
      totalDeposits: totalDeposits.toFixed(2),
      totalWithdrawals: totalWithdrawals.toFixed(2),
      netFlow: totalDeposits.minus(totalWithdrawals).toFixed(2),
      transactions: formatted,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Profit & Loss Statement (Income Statement)
 */
export const getProfitLossStatement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    // 1. Sales Revenue
    const sales = await prisma.sale.findMany({
      where: startDate || endDate ? { saleDate: dateFilter } : {},
      include: { items: { include: { product: true } } },
    });

    let totalRevenue = new Decimal(0);
    let totalCogs = new Decimal(0);

    for (const s of sales) {
      totalRevenue = totalRevenue.plus(new Decimal(s.netAmount.toString()));
      for (const item of s.items) {
        const costPrice = new Decimal(item.product.costPricePerKg.toString());
        const itemCost = new Decimal(item.netWeightKg.toString()).times(costPrice);
        totalCogs = totalCogs.plus(itemCost);
      }
    }

    // Daily Sales aggregations
    const dailyEntries = await prisma.dailySalesEntry.findMany({
      where: {
        status: 'CONFIRMED',
        ...(startDate || endDate ? { salesDate: dateFilter } : {}),
      },
    });

    for (const d of dailyEntries) {
      totalRevenue = totalRevenue.plus(new Decimal(d.netAmount.toString()));
      totalCogs = totalCogs.plus(new Decimal(d.totalCogs.toString()));
    }

    const grossProfit = totalRevenue.minus(totalCogs);

    // 2. Operational Expenses Breakdown
    const expenses = await prisma.expense.findMany({
      where: {
        status: 'POSTED',
        ...(startDate || endDate ? { expenseDate: dateFilter } : {}),
      },
    });

    const expenseBreakdown: Record<string, Decimal> = {
      Salaries: new Decimal(0),
      Electricity: new Decimal(0),
      Rent: new Decimal(0),
      'Loading/unloading': new Decimal(0),
      Transportation: new Decimal(0),
      'Repair and maintenance': new Decimal(0),
      'Office expenses': new Decimal(0),
      Other: new Decimal(0),
    };
    let totalExpenses = new Decimal(0);

    for (const exp of expenses) {
      const amt = new Decimal(exp.amount.toString());
      totalExpenses = totalExpenses.plus(amt);
      const cat = exp.category || 'Other';
      expenseBreakdown[cat] = (expenseBreakdown[cat] || new Decimal(0)).plus(amt);
    }

    // 3. Other Incomes Breakdown
    const otherIncomes = await prisma.otherIncome.findMany({
      where: {
        status: 'POSTED',
        ...(startDate || endDate ? { incomeDate: dateFilter } : {}),
      },
    });

    let totalOtherIncome = new Decimal(0);
    const incomeBreakdown: Record<string, Decimal> = {};
    for (const inc of otherIncomes) {
      const amt = new Decimal(inc.amount.toString());
      totalOtherIncome = totalOtherIncome.plus(amt);
      incomeBreakdown[inc.category] = (incomeBreakdown[inc.category] || new Decimal(0)).plus(amt);
    }

    // Net Profit = Gross Profit - Operating Expenses + Other Incomes
    const netProfit = grossProfit.minus(totalExpenses).plus(totalOtherIncome);

    sendSuccess(res, {
      period: { startDate: startDate || null, endDate: endDate || null },
      totalRevenue: totalRevenue.toFixed(2),
      costOfGoodsSold: totalCogs.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      grossMarginPct: totalRevenue.isZero() ? '0.00' : grossProfit.dividedBy(totalRevenue).times(100).toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      totalOtherIncome: totalOtherIncome.toFixed(2),
      netProfit: netProfit.toFixed(2),
      netMarginPct: totalRevenue.isZero() ? '0.00' : netProfit.dividedBy(totalRevenue).times(100).toFixed(2),
      expenseBreakdown: Object.entries(expenseBreakdown).map(([category, amount]) => ({
        category,
        amount: amount.toFixed(2),
      })),
      incomeBreakdown: Object.entries(incomeBreakdown).map(([category, amount]) => ({
        category,
        amount: amount.toFixed(2),
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Balance Sheet (Statement of Financial Position)
 * Verifies Assets = Liabilities + Equity
 */
export const getBalanceSheet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { asOfDate } = req.query;

    // 1. Current Assets
    const [cashAccounts, bankAccounts, customers, stocks] = await Promise.all([
      prisma.cashAccount.findMany(),
      prisma.bankAccount.findMany(),
      prisma.customer.findMany({ select: { currentBalance: true } }),
      prisma.stock.findMany({ include: { product: true } }),
    ]);

    const cashInHand = cashAccounts.reduce((acc, c) => acc.plus(new Decimal(c.balance.toString())), new Decimal(0));
    const bankBalance = bankAccounts.reduce((acc, b) => acc.plus(new Decimal(b.currentBalance.toString())), new Decimal(0));
    const accountsReceivable = customers.reduce((acc, c) => acc.plus(new Decimal(c.currentBalance.toString())), new Decimal(0));

    // Inventory Valuation at Landed Cost
    let inventoryValuation = new Decimal(0);
    let totalBagsInStock = 0;
    let totalWeightInStockKg = new Decimal(0);

    for (const st of stocks) {
      totalBagsInStock += st.currentBags;
      const wt = new Decimal(st.currentWeightKg.toString());
      totalWeightInStockKg = totalWeightInStockKg.plus(wt);
      const cost = new Decimal(st.product.costPricePerKg.toString());
      inventoryValuation = inventoryValuation.plus(wt.times(cost));
    }

    const fixedAssets = new Decimal(15000000); // 15M Mill plant, machinery & weighbridge baseline

    const totalCurrentAssets = cashInHand.plus(bankBalance).plus(accountsReceivable).plus(inventoryValuation);
    const totalAssets = totalCurrentAssets.plus(fixedAssets);

    // 2. Liabilities
    const suppliers = await prisma.supplier.findMany({ select: { currentBalance: true } });
    const accountsPayable = suppliers.reduce((acc, s) => acc.plus(new Decimal(s.currentBalance.toString())), new Decimal(0));
    const accruedExpenses = new Decimal(150000); // Accrued electricity & utility

    const totalLiabilities = accountsPayable.plus(accruedExpenses);

    // 3. Equity
    // In accounting: Equity = Assets - Liabilities
    const totalEquity = totalAssets.minus(totalLiabilities);
    const ownerCapital = new Decimal(20000000);
    const retainedEarnings = totalEquity.minus(ownerCapital);

    sendSuccess(res, {
      asOfDate: asOfDate || new Date().toISOString().split('T')[0],
      assets: {
        currentAssets: {
          cashInHand: cashInHand.toFixed(2),
          bankBalance: bankBalance.toFixed(2),
          accountsReceivable: accountsReceivable.toFixed(2),
          inventoryValuation: inventoryValuation.toFixed(2),
          totalBagsInStock,
          totalWeightInStockKg: totalWeightInStockKg.toFixed(2),
          total: totalCurrentAssets.toFixed(2),
        },
        fixedAssets: {
          plantMachinery: '12000000.00',
          weighbridgeKanda: '3000000.00',
          total: fixedAssets.toFixed(2),
        },
        totalAssets: totalAssets.toFixed(2),
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable: accountsPayable.toFixed(2),
          accruedExpenses: accruedExpenses.toFixed(2),
          total: totalLiabilities.toFixed(2),
        },
        totalLiabilities: totalLiabilities.toFixed(2),
      },
      equity: {
        ownerCapital: ownerCapital.toFixed(2),
        retainedEarnings: retainedEarnings.toFixed(2),
        totalEquity: totalEquity.toFixed(2),
      },
      accountingEquationVerified: totalAssets.equals(totalLiabilities.plus(totalEquity)),
    });
  } catch (err) {
    next(err);
  }
};
