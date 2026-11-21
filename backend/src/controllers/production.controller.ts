import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import Decimal from 'decimal.js';
import { COA } from './accounting.controller';

export const getProductionBatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { warehouseId, status, startDate, endDate } = req.query;
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId as string;
    if (status) where.status = status as any;
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate as string);
      if (endDate) where.startDate.lte = new Date(endDate as string);
    }

    const batches = await prisma.productionBatch.findMany({
      where,
      include: {
        warehouse: true,
        inputs: { include: { product: true } },
        outputs: { include: { product: true } },
      },
      orderBy: { startDate: 'desc' },
      take: 100,
    });

    sendSuccess(res, batches, 'Production batches retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getProductionBatchById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const batch = await prisma.productionBatch.findUnique({
      where: { id },
      include: {
        warehouse: true,
        inputs: { include: { product: true } },
        outputs: { include: { product: true } },
      },
    });

    if (!batch) {
      throw new AppError('Production batch not found', 404);
    }

    sendSuccess(res, batch, 'Production batch details retrieved');
  } catch (err) {
    next(err);
  }
};

export const createProductionBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      warehouseId,
      startDate = new Date().toISOString(),
      endDate,
      inputs = [],
      outputs = [],
      processingLaborCost = 0,
      electricityPowerCost = 0,
      otherMillingCost = 0,
      notes,
    } = req.body;

    if (!warehouseId) throw new AppError('Warehouse ID is required', 400);
    if (!inputs.length) {
      throw new AppError('At least one raw paddy / grain input is required for milling', 400);
    }
    if (!outputs.length) {
      throw new AppError('At least one finished milled output is required', 400);
    }

    const laborCost = new Decimal(processingLaborCost || 0);
    const powerCost = new Decimal(electricityPowerCost || 0);
    const otherCost = new Decimal(otherMillingCost || 0);
    const totalProcessingCost = laborCost.plus(powerCost).plus(otherCost);

    const batchResult = await prisma.$transaction(async (tx) => {
      const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouse) throw new AppError('Warehouse not found', 404);

      const batchNo = `MB-${Date.now().toString().slice(-8)}`;

      // 1. Process Raw Inputs and deduct stock
      let totalInputWeightKg = new Decimal(0);
      let totalInputCost = new Decimal(0);
      const processedInputs = [];

      for (const inp of inputs) {
        const product = await tx.riceProduct.findUnique({ where: { id: inp.productId } });
        if (!product) throw new AppError(`Input Product ID ${inp.productId} not found`, 404);

        const inputWeight = new Decimal(inp.weightKg || 0);
        if (inputWeight.lessThanOrEqualTo(0)) {
          throw new AppError(`Input weight for ${product.name} must be greater than zero`, 400);
        }

        const inputCostKg = new Decimal(inp.unitCostPerKg || product.costPricePerKg.toString());
        const lineTotalCost = inputWeight.times(inputCostKg);

        const stock = await tx.stock.findUnique({
          where: { warehouseId_productId: { warehouseId, productId: inp.productId } },
        });

        if (!stock || new Decimal(stock.availableWeightKg.toString()).lessThan(inputWeight)) {
          throw new AppError(
            `Insufficient raw grain '${product.name}' in warehouse. Available: ${stock?.availableWeightKg || 0} Kg. Required: ${inputWeight} Kg.`,
            409
          );
        }

        // Deduct stock
        await tx.stock.update({
          where: { warehouseId_productId: { warehouseId, productId: inp.productId } },
          data: {
            currentBags: { decrement: inp.bagCount || 0 },
            currentWeightKg: new Decimal(stock.currentWeightKg.toString()).minus(inputWeight),
            availableBags: { decrement: inp.bagCount || 0 },
            availableWeightKg: new Decimal(stock.availableWeightKg.toString()).minus(inputWeight),
            lastMovementDate: new Date(),
          },
        });

        // Stock movement
        await tx.stockMovement.create({
          data: {
            movementNumber: `MOV-IN-${batchNo}-${Math.floor(100 + Math.random() * 900)}`,
            movementType: 'PRODUCTION_INPUT',
            warehouseId,
            productId: inp.productId,
            bagCountDelta: -(inp.bagCount || 0),
            weightKgDelta: inputWeight.negated(),
            unitCostPerKg: inputCostKg,
            totalCost: lineTotalCost,
            referenceType: 'ProductionBatch',
            referenceId: batchNo,
            notes: `Consumed in Milling Batch ${batchNo}`,
            createdById: (req as any).user?.id || null,
          },
        });

        totalInputWeightKg = totalInputWeightKg.plus(inputWeight);
        totalInputCost = totalInputCost.plus(lineTotalCost);

        processedInputs.push({
          productId: inp.productId,
          bagCount: inp.bagCount || 0,
          weightKg: inputWeight,
          unitCostPerKg: inputCostKg,
          totalCost: lineTotalCost,
        });
      }

      // 2. Process Outputs and increment stock
      let totalOutputWeightKg = new Decimal(0);
      let totalOutputValuation = new Decimal(0);
      let headRiceWeightKg = new Decimal(0);
      let brokenRiceWeightKg = new Decimal(0);
      let branWeightKg = new Decimal(0);
      let huskWeightKg = new Decimal(0);
      let wastageWeightKg = new Decimal(0);
      const processedOutputs = [];

      for (const outp of outputs) {
        const product = await tx.riceProduct.findUnique({ where: { id: outp.productId } });
        if (!product) throw new AppError(`Output Product ID ${outp.productId} not found`, 404);

        const outputWeight = new Decimal(outp.weightKg || 0);
        if (outputWeight.lessThanOrEqualTo(0)) {
          throw new AppError(`Output weight for ${product.name} must be greater than zero`, 400);
        }

        const outputValuationKg = new Decimal(outp.unitCostPerKg || product.costPricePerKg.toString());
        const lineTotalValuation = outputWeight.times(outputValuationKg);

        // Accumulate specific byproduct weight
        const outType = outp.outputType || 'HEAD_RICE';
        if (outType === 'HEAD_RICE') headRiceWeightKg = headRiceWeightKg.plus(outputWeight);
        else if (outType === 'BROKEN_RICE') brokenRiceWeightKg = brokenRiceWeightKg.plus(outputWeight);
        else if (outType === 'BRAN') branWeightKg = branWeightKg.plus(outputWeight);
        else if (outType === 'HUSK') huskWeightKg = huskWeightKg.plus(outputWeight);
        else if (outType === 'WASTAGE') wastageWeightKg = wastageWeightKg.plus(outputWeight);

        // Upsert stock in warehouse
        await tx.stock.upsert({
          where: { warehouseId_productId: { warehouseId, productId: outp.productId } },
          update: {
            currentBags: { increment: outp.bagCount || 0 },
            currentWeightKg: { increment: outputWeight },
            availableBags: { increment: outp.bagCount || 0 },
            availableWeightKg: { increment: outputWeight },
            lastMovementDate: new Date(),
          },
          create: {
            warehouseId,
            productId: outp.productId,
            currentBags: outp.bagCount || 0,
            currentWeightKg: outputWeight,
            availableBags: outp.bagCount || 0,
            availableWeightKg: outputWeight,
            lastMovementDate: new Date(),
          },
        });

        // Stock movement
        await tx.stockMovement.create({
          data: {
            movementNumber: `MOV-OUT-${batchNo}-${Math.floor(100 + Math.random() * 900)}`,
            movementType: 'PRODUCTION_OUTPUT',
            warehouseId,
            productId: outp.productId,
            bagCountDelta: outp.bagCount || 0,
            weightKgDelta: outputWeight,
            unitCostPerKg: outputValuationKg,
            totalCost: lineTotalValuation,
            referenceType: 'ProductionBatch',
            referenceId: batchNo,
            notes: `Milled Output in Batch ${batchNo} (${outType})`,
            createdById: (req as any).user?.id || null,
          },
        });

        totalOutputWeightKg = totalOutputWeightKg.plus(outputWeight);
        totalOutputValuation = totalOutputValuation.plus(lineTotalValuation);

        processedOutputs.push({
          productId: outp.productId,
          outputType: outType,
          bagCount: outp.bagCount || 0,
          weightKg: outputWeight,
          unitCostPerKg: outputValuationKg,
          totalCost: lineTotalValuation,
        });
      }

      // 3. Calculate Yield Ratios & Profitability
      const overallYieldPct = totalInputWeightKg.isZero()
        ? new Decimal(0)
        : totalOutputWeightKg.dividedBy(totalInputWeightKg).times(100);

      const headRiceYieldPct = totalInputWeightKg.isZero()
        ? new Decimal(0)
        : headRiceWeightKg.dividedBy(totalInputWeightKg).times(100);

      const netBatchProfit = totalOutputValuation.minus(totalInputCost.plus(totalProcessingCost));

      // 4. Create Production Batch Record
      const batch = await tx.productionBatch.create({
        data: {
          batchNumber: batchNo,
          warehouseId,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : new Date(),
          status: 'COMPLETED',
          totalInputWeightKg,
          totalOutputWeightKg,
          yieldPercentage: overallYieldPct,
          totalInputCost,
          processingLaborCost: laborCost,
          electricityPowerCost: powerCost,
          otherMillingCost: otherCost,
          totalProcessingCost,
          totalOutputValuation,
          netBatchProfit,
          headRiceWeightKg,
          brokenRiceWeightKg,
          branWeightKg,
          huskWeightKg,
          wastageWeightKg,
          headRiceYieldPct,
          notes,
          createdById: (req as any).user?.id || null,
          inputs: { create: processedInputs },
          outputs: { create: processedOutputs },
        },
        include: {
          warehouse: true,
          inputs: { include: { product: true } },
          outputs: { include: { product: true } },
        },
      });

      // 5. Post Double-Entry General Ledger Journal Entry
      // Dr. Finished Rice & Byproduct Inventory (Output valuation)
      // Cr. Raw Grain Inventory (Input cost)
      // Cr. Accrued Milling Expenses (Processing costs)
      // Cr./Dr. Manufacturing Margin / Gain
      const jvDebit = totalOutputValuation;
      const jvCredit = totalInputCost.plus(totalProcessingCost);

      const jvLines: any[] = [
        {
          accountCode: COA.INVENTORY_FINISHED.code,
          accountName: COA.INVENTORY_FINISHED.name,
          accountType: 'ASSET',
          debit: totalOutputValuation,
          credit: 0,
          memo: `Batch ${batchNo} Finished Rice & Byproducts Output`,
        },
        {
          accountCode: COA.INVENTORY_RAW.code,
          accountName: COA.INVENTORY_RAW.name,
          accountType: 'ASSET',
          debit: 0,
          credit: totalInputCost,
          memo: `Batch ${batchNo} Raw Grain/Paddy Consumed`,
        },
      ];

      if (totalProcessingCost.greaterThan(0)) {
        jvLines.push({
          accountCode: COA.ACCRUED_EXPENSES.code,
          accountName: 'Accrued Milling Labor & Power Costs',
          accountType: 'LIABILITY',
          debit: 0,
          credit: totalProcessingCost,
          memo: `Batch ${batchNo} Palledari & Electricity Costs`,
        });
      }

      if (netBatchProfit.greaterThan(0)) {
        // Gain on milling
        jvLines.push({
          accountCode: COA.MILLING_INCOME.code,
          accountName: 'Milling Processing Value Addition (Gain)',
          accountType: 'REVENUE',
          debit: 0,
          credit: netBatchProfit,
          memo: `Batch ${batchNo} Net Milling Value Addition`,
        });
      } else if (netBatchProfit.lessThan(0)) {
        // Milling loss
        jvLines.push({
          accountCode: COA.COGS_RICE.code,
          accountName: 'Milling Yield Deficit / Processing Loss',
          accountType: 'EXPENSE',
          debit: netBatchProfit.abs(),
          credit: 0,
          memo: `Batch ${batchNo} Net Milling Loss`,
        });
      }

      const totalJVDr = jvLines.reduce((acc, l) => acc.plus(new Decimal(l.debit.toString())), new Decimal(0));
      const totalJVCr = jvLines.reduce((acc, l) => acc.plus(new Decimal(l.credit.toString())), new Decimal(0));

      await tx.journalEntry.create({
        data: {
          entryNumber: `JV-${batchNo}`,
          entryDate: new Date(startDate),
          voucherType: 'GENERAL',
          referenceNo: batchNo,
          narration: `Milling Batch ${batchNo}: Crushed ${totalInputWeightKg.toFixed(2)} Kg Paddy -> Output ${totalOutputWeightKg.toFixed(2)} Kg. Yield: ${overallYieldPct.toFixed(2)}%, Head Rice: ${headRiceYieldPct.toFixed(2)}%`,
          totalDebit: totalJVDr,
          totalCredit: totalJVCr,
          status: 'POSTED',
          lines: {
            create: jvLines,
          },
        },
      });

      return batch;
    });

    sendSuccess(res, batchResult, 'Milling batch completed, stock updated and journal posted', 201);
  } catch (err) {
    next(err);
  }
};

export const getMillingYieldAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const batches = await prisma.productionBatch.findMany({
      where: { status: 'COMPLETED' },
      select: {
        totalInputWeightKg: true,
        totalOutputWeightKg: true,
        headRiceWeightKg: true,
        brokenRiceWeightKg: true,
        branWeightKg: true,
        huskWeightKg: true,
        wastageWeightKg: true,
        totalInputCost: true,
        totalProcessingCost: true,
        totalOutputValuation: true,
        netBatchProfit: true,
        yieldPercentage: true,
        headRiceYieldPct: true,
      },
    });

    let totalCrushedKg = new Decimal(0);
    let totalOutputKg = new Decimal(0);
    let totalHeadRiceKg = new Decimal(0);
    let totalBrokenKg = new Decimal(0);
    let totalBranKg = new Decimal(0);
    let totalHuskKg = new Decimal(0);
    let totalWastageKg = new Decimal(0);
    let totalNetProfit = new Decimal(0);

    for (const b of batches) {
      totalCrushedKg = totalCrushedKg.plus(new Decimal(b.totalInputWeightKg.toString()));
      totalOutputKg = totalOutputKg.plus(new Decimal(b.totalOutputWeightKg.toString()));
      totalHeadRiceKg = totalHeadRiceKg.plus(new Decimal(b.headRiceWeightKg.toString()));
      totalBrokenKg = totalBrokenKg.plus(new Decimal(b.brokenRiceWeightKg.toString()));
      totalBranKg = totalBranKg.plus(new Decimal(b.branWeightKg.toString()));
      totalHuskKg = totalHuskKg.plus(new Decimal(b.huskWeightKg.toString()));
      totalWastageKg = totalWastageKg.plus(new Decimal(b.wastageWeightKg.toString()));
      totalNetProfit = totalNetProfit.plus(new Decimal(b.netBatchProfit.toString()));
    }

    const avgOverallYield = totalCrushedKg.isZero()
      ? '0.00'
      : totalOutputKg.dividedBy(totalCrushedKg).times(100).toFixed(2);

    const avgHeadRiceYield = totalCrushedKg.isZero()
      ? '0.00'
      : totalHeadRiceKg.dividedBy(totalCrushedKg).times(100).toFixed(2);

    sendSuccess(res, {
      totalBatches: batches.length,
      totalCrushedKg: totalCrushedKg.toFixed(2),
      totalCrushedMaunds: totalCrushedKg.dividedBy(40).toFixed(2),
      totalOutputKg: totalOutputKg.toFixed(2),
      totalHeadRiceKg: totalHeadRiceKg.toFixed(2),
      totalBrokenKg: totalBrokenKg.toFixed(2),
      totalBranKg: totalBranKg.toFixed(2),
      totalHuskKg: totalHuskKg.toFixed(2),
      totalWastageKg: totalWastageKg.toFixed(2),
      avgOverallYieldPct: avgOverallYield,
      avgHeadRiceYieldPct: avgHeadRiceYield,
      cumulativeNetMillingProfit: totalNetProfit.toFixed(2),
    });
  } catch (err) {
    next(err);
  }
};
