import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import Decimal from 'decimal.js';
import { COA } from './accounting.controller';

export const getCommissionAgents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, isActive } = req.query;
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
        { mandiCity: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const agents = await prisma.commissionAgent.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const totalPayable = agents.reduce((acc, a) => acc.plus(new Decimal(a.currentBalance.toString())), new Decimal(0));

    sendSuccess(res, { agents, totalPayable: totalPayable.toFixed(2) }, 'Commission agents retrieved');
  } catch (err) {
    next(err);
  }
};

export const getCommissionAgentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const agent = await prisma.commissionAgent.findUnique({
      where: { id },
      include: {
        transactions: { orderBy: { transactionDate: 'desc' }, take: 50 },
        payments: { orderBy: { paymentDate: 'desc' }, take: 50 },
      },
    });

    if (!agent) throw new AppError('Commission agent not found', 404);

    sendSuccess(res, agent, 'Commission agent profile retrieved');
  } catch (err) {
    next(err);
  }
};

export const createCommissionAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      phone,
      mandiCity,
      commissionType = 'PERCENTAGE',
      defaultRate = 1.0,
      openingBalance = 0,
      notes,
    } = req.body;

    if (!name) throw new AppError('Agent / Broker name is required', 400);

    const code = req.body.code || `AGT-${Date.now().toString().slice(-4)}`;
    const opBal = new Decimal(openingBalance || 0);

    const agent = await prisma.commissionAgent.create({
      data: {
        code,
        name,
        phone,
        mandiCity,
        commissionType,
        defaultRate: new Decimal(defaultRate),
        currentBalance: opBal,
        notes,
      },
    });

    sendSuccess(res, agent, 'Commission agent profile created', 201);
  } catch (err) {
    next(err);
  }
};

export const getCommissionTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { agentId, startDate, endDate, status } = req.query;
    const where: any = {};
    if (agentId) where.agentId = agentId as string;
    if (status) where.status = status as any;
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate as string);
      if (endDate) where.transactionDate.lte = new Date(endDate as string);
    }

    const transactions = await prisma.commissionTransaction.findMany({
      where,
      include: { agent: true },
      orderBy: { transactionDate: 'desc' },
      take: 100,
    });

    sendSuccess(res, transactions, 'Commission transactions retrieved');
  } catch (err) {
    next(err);
  }
};

export const createCommissionTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      agentId,
      transactionDate = new Date().toISOString(),
      referenceType = 'SALE',
      referenceNo,
      baseAmount = 0,
      bagCount = 0,
      weightKg = 0,
      rateType,
      rateValue,
      notes,
    } = req.body;

    if (!agentId) throw new AppError('Commission agent is required', 400);
    if (!referenceNo) throw new AppError('Reference invoice/transaction number is required', 400);

    const result = await prisma.$transaction(async (tx) => {
      const agent = await tx.commissionAgent.findUnique({ where: { id: agentId } });
      if (!agent) throw new AppError('Commission agent not found', 404);

      const rType = rateType || agent.commissionType;
      const rVal = new Decimal(rateValue !== undefined ? rateValue : agent.defaultRate.toString());

      const numBase = new Decimal(baseAmount || 0);
      const numBags = Number(bagCount || 0);
      const numWeight = new Decimal(weightKg || 0);

      let commissionAmount = new Decimal(0);
      if (rType === 'PERCENTAGE') {
        commissionAmount = numBase.times(rVal).dividedBy(100);
      } else if (rType === 'PER_BAG') {
        commissionAmount = new Decimal(numBags).times(rVal);
      } else if (rType === 'PER_KG') {
        commissionAmount = numWeight.times(rVal);
      }

      if (commissionAmount.lessThanOrEqualTo(0)) {
        throw new AppError('Calculated commission amount must be greater than zero', 400);
      }

      const txNumber = `COMM-${Date.now().toString().slice(-8)}`;

      // 1. Create Commission Transaction
      const commTx = await tx.commissionTransaction.create({
        data: {
          transactionNumber: txNumber,
          agentId,
          transactionDate: new Date(transactionDate),
          referenceType,
          referenceNo,
          baseAmount: numBase,
          bagCount: numBags,
          weightKg: numWeight,
          rateType: rType,
          rateValue: rVal,
          commissionAmount,
          status: 'ACCRUED',
          notes,
        },
      });

      // 2. Increment Agent Balance Payable
      await tx.commissionAgent.update({
        where: { id: agentId },
        data: {
          currentBalance: { increment: commissionAmount },
        },
      });

      // 3. Post Double-Entry Journal Entry:
      // Dr. Operating Expense (Brokerage / Commission)
      // Cr. Accounts Payable / Accrued Brokerage
      await tx.journalEntry.create({
        data: {
          entryNumber: `JV-${txNumber}`,
          entryDate: new Date(transactionDate),
          voucherType: 'GENERAL',
          referenceNo: txNumber,
          narration: `Brokerage Accrual for ${agent.name} on ${referenceType} ${referenceNo}. Base: Rs ${numBase.toFixed(2)}, Rate: ${rVal} (${rType})`,
          totalDebit: commissionAmount,
          totalCredit: commissionAmount,
          status: 'POSTED',
          lines: {
            create: [
              {
                accountCode: '6050',
                accountName: 'Trading Brokerage & Commission Expense',
                accountType: 'EXPENSE',
                debit: commissionAmount,
                credit: 0,
                memo: `Commission on ${referenceNo} to ${agent.name}`,
              },
              {
                accountCode: COA.ACCOUNTS_PAYABLE.code,
                accountName: `Commission Payable - ${agent.name}`,
                accountType: 'LIABILITY',
                debit: 0,
                credit: commissionAmount,
                memo: `Accrued brokerage payable to ${agent.name}`,
              },
            ],
          },
        },
      });

      return commTx;
    });

    sendSuccess(res, result, 'Commission accrued and posted to ledger', 201);
  } catch (err) {
    next(err);
  }
};

export const getCommissionPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { agentId, startDate, endDate } = req.query;
    const where: any = {};
    if (agentId) where.agentId = agentId as string;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate as string);
      if (endDate) where.paymentDate.lte = new Date(endDate as string);
    }

    const payments = await prisma.commissionPayment.findMany({
      where,
      include: { agent: true, cashAccount: true, bankAccount: true },
      orderBy: { paymentDate: 'desc' },
      take: 100,
    });

    sendSuccess(res, payments, 'Commission payments retrieved');
  } catch (err) {
    next(err);
  }
};

export const createCommissionPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      agentId,
      paymentDate = new Date().toISOString(),
      amount,
      paymentMethod = 'CASH',
      cashAccountId,
      bankAccountId,
      referenceNumber,
      notes,
    } = req.body;

    const numAmount = new Decimal(amount || 0);
    if (numAmount.lessThanOrEqualTo(0)) {
      throw new AppError('Payment amount must be greater than zero', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const agent = await tx.commissionAgent.findUnique({ where: { id: agentId } });
      if (!agent) throw new AppError('Commission agent not found', 404);

      // 1. Withdraw funds
      let accountName = '';
      if (paymentMethod === 'CASH') {
        if (!cashAccountId) throw new AppError('Cash account required for cash payment', 400);
        const cashAcc = await tx.cashAccount.findUnique({ where: { id: cashAccountId } });
        if (!cashAcc) throw new AppError('Cash account not found', 404);
        accountName = cashAcc.name;
        await tx.cashAccount.update({
          where: { id: cashAccountId },
          data: { balance: new Decimal(cashAcc.balance.toString()).minus(numAmount) },
        });
      } else {
        if (!bankAccountId) throw new AppError('Bank account required for bank payment', 400);
        const bankAcc = await tx.bankAccount.findUnique({ where: { id: bankAccountId } });
        if (!bankAcc) throw new AppError('Bank account not found', 404);
        accountName = `${bankAcc.bankName} (${bankAcc.accountNumber})`;
        await tx.bankAccount.update({
          where: { id: bankAccountId },
          data: { currentBalance: new Decimal(bankAcc.currentBalance.toString()).minus(numAmount) },
        });
      }

      // 2. Decrement Agent Balance Payable
      await tx.commissionAgent.update({
        where: { id: agentId },
        data: {
          currentBalance: { decrement: numAmount },
        },
      });

      const payNumber = `CPAY-${Date.now().toString().slice(-8)}`;

      // 3. Create Payment Record
      const payment = await tx.commissionPayment.create({
        data: {
          paymentNumber: payNumber,
          agentId,
          paymentDate: new Date(paymentDate),
          amount: numAmount,
          paymentMethod,
          cashAccountId: paymentMethod === 'CASH' ? cashAccountId : null,
          bankAccountId: paymentMethod === 'BANK' ? bankAccountId : null,
          referenceNumber,
          notes,
          status: 'POSTED',
        },
      });

      // 4. Post Double-Entry Journal:
      // Dr. Commission Payable (Broker liability reduced)
      // Cr. Cash/Bank (Funds deducted)
      await tx.journalEntry.create({
        data: {
          entryNumber: `JV-${payNumber}`,
          entryDate: new Date(paymentDate),
          voucherType: 'PAYMENT',
          referenceNo: payNumber,
          narration: `Commission Disbursement to ${agent.name} via ${paymentMethod} (${accountName}). Ref: ${referenceNumber || ''}`,
          totalDebit: numAmount,
          totalCredit: numAmount,
          status: 'POSTED',
          lines: {
            create: [
              {
                accountCode: COA.ACCOUNTS_PAYABLE.code,
                accountName: `Commission Payable - ${agent.name}`,
                accountType: 'LIABILITY',
                debit: numAmount,
                credit: 0,
                memo: `Payment to broker ${agent.name}`,
              },
              {
                accountCode: paymentMethod === 'CASH' ? COA.CASH_IN_HAND.code : COA.BANK_ACCOUNTS.code,
                accountName,
                accountType: 'ASSET',
                debit: 0,
                credit: numAmount,
                memo: `Disbursement via ${paymentMethod}`,
              },
            ],
          },
        },
      });

      return payment;
    });

    sendSuccess(res, result, 'Commission payment processed and posted', 201);
  } catch (err) {
    next(err);
  }
};

export const getAgentStatement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { startDate, endDate } = req.query;

    const agent = await prisma.commissionAgent.findUnique({ where: { id } });
    if (!agent) throw new AppError('Commission agent not found', 404);

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const [transactions, payments] = await Promise.all([
      prisma.commissionTransaction.findMany({
        where: {
          agentId: id,
          status: 'ACCRUED',
          ...(startDate || endDate ? { transactionDate: dateFilter } : {}),
        },
      }),
      prisma.commissionPayment.findMany({
        where: {
          agentId: id,
          status: 'POSTED',
          ...(startDate || endDate ? { paymentDate: dateFilter } : {}),
        },
      }),
    ]);

    const statementLines: any[] = [];

    // Commission transactions = Credit (Payable to agent increases)
    for (const t of transactions) {
      statementLines.push({
        date: t.transactionDate,
        type: 'COMMISSION_ACCRUED',
        ref: t.transactionNumber,
        description: `Brokerage on ${t.referenceType} ${t.referenceNo} (${t.rateValue} ${t.rateType})`,
        debit: new Decimal(0),
        credit: new Decimal(t.commissionAmount.toString()),
      });
    }

    // Payments = Debit (Payable to agent decreases)
    for (const p of payments) {
      statementLines.push({
        date: p.paymentDate,
        type: 'COMMISSION_PAYMENT',
        ref: p.paymentNumber,
        description: `Payment via ${p.paymentMethod} ${p.referenceNumber ? 'Ref: ' + p.referenceNumber : ''}`,
        debit: new Decimal(p.amount.toString()),
        credit: new Decimal(0),
      });
    }

    statementLines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = new Decimal(0);
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    const formatted = statementLines.map((l) => {
      totalDebit = totalDebit.plus(l.debit);
      totalCredit = totalCredit.plus(l.credit);
      running = running.plus(l.credit).minus(l.debit);

      return {
        date: l.date,
        type: l.type,
        ref: l.ref,
        description: l.description,
        debit: l.debit.toFixed(2),
        credit: l.credit.toFixed(2),
        runningBalance: running.toFixed(2),
      };
    });

    sendSuccess(res, {
      agent: {
        id: agent.id,
        code: agent.code,
        name: agent.name,
        phone: agent.phone,
        mandiCity: agent.mandiCity,
        commissionType: agent.commissionType,
        defaultRate: agent.defaultRate.toString(),
        currentBalance: agent.currentBalance.toString(),
      },
      totalAccruedCommission: totalCredit.toFixed(2),
      totalPaidCommission: totalDebit.toFixed(2),
      closingBalancePayable: running.toFixed(2),
      statement: formatted,
    });
  } catch (err) {
    next(err);
  }
};
