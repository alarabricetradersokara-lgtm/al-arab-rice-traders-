import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import Decimal from 'decimal.js';

export const getWarehouseTransfers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fromWarehouseId, toWarehouseId, status } = req.query;
    const where: any = {};
    if (fromWarehouseId) where.fromWarehouseId = fromWarehouseId as string;
    if (toWarehouseId) where.toWarehouseId = toWarehouseId as string;
    if (status) where.status = status as any;

    const transfers = await prisma.warehouseTransfer.findMany({
      where,
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: { include: { product: true } },
      },
      orderBy: { transferDate: 'desc' },
      take: 100,
    });

    sendSuccess(res, transfers, 'Warehouse transfers retrieved');
  } catch (err) {
    next(err);
  }
};

export const getWarehouseTransferById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const transfer = await prisma.warehouseTransfer.findUnique({
      where: { id },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: { include: { product: true } },
      },
    });

    if (!transfer) throw new AppError('Warehouse transfer not found', 404);

    sendSuccess(res, transfer, 'Warehouse transfer details retrieved');
  } catch (err) {
    next(err);
  }
};

export const createWarehouseTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      fromWarehouseId,
      toWarehouseId,
      transferDate = new Date().toISOString(),
      driverName,
      vehicleNumber,
      biltyNumber,
      notes,
      items = [],
    } = req.body;

    if (!fromWarehouseId || !toWarehouseId) {
      throw new AppError('Source and destination warehouses are required', 400);
    }
    if (fromWarehouseId === toWarehouseId) {
      throw new AppError('Source and destination warehouses cannot be the same', 400);
    }
    if (!items.length) {
      throw new AppError('At least one item is required for transfer', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const fromWh = await tx.warehouse.findUnique({ where: { id: fromWarehouseId } });
      const toWh = await tx.warehouse.findUnique({ where: { id: toWarehouseId } });
      if (!fromWh || !toWh) throw new AppError('Warehouse not found', 404);

      const trfNumber = `WTRF-${Date.now().toString().slice(-8)}`;

      let totalBags = 0;
      let totalWeightKg = new Decimal(0);
      const processedItems = [];

      for (const item of items) {
        const product = await tx.riceProduct.findUnique({ where: { id: item.productId } });
        if (!product) throw new AppError(`Product ID ${item.productId} not found`, 404);

        const sentBags = Number(item.sentBags || 0);
        const sentWeight = new Decimal(item.sentWeightKg || 0);

        if (sentWeight.lessThanOrEqualTo(0)) {
          throw new AppError(`Transfer weight for ${product.name} must be greater than zero`, 400);
        }

        const stock = await tx.stock.findUnique({
          where: { warehouseId_productId: { warehouseId: fromWarehouseId, productId: item.productId } },
        });

        if (!stock || new Decimal(stock.availableWeightKg.toString()).lessThan(sentWeight)) {
          throw new AppError(
            `Insufficient stock for '${product.name}' in source warehouse ${fromWh.name}. Available: ${stock?.availableWeightKg || 0} Kg. Requested: ${sentWeight} Kg.`,
            409
          );
        }

        // Deduct from source warehouse
        await tx.stock.update({
          where: { warehouseId_productId: { warehouseId: fromWarehouseId, productId: item.productId } },
          data: {
            currentBags: { decrement: sentBags },
            currentWeightKg: { decrement: sentWeight },
            availableBags: { decrement: sentBags },
            availableWeightKg: { decrement: sentWeight },
            lastMovementDate: new Date(),
          },
        });

        // Record stock movement (Outflow)
        await tx.stockMovement.create({
          data: {
            movementNumber: `MOV-TRF-OUT-${trfNumber}-${Math.floor(100 + Math.random() * 900)}`,
            movementType: 'ADJUSTMENT',
            warehouseId: fromWarehouseId,
            productId: item.productId,
            bagCountDelta: -sentBags,
            weightKgDelta: sentWeight.negated(),
            unitCostPerKg: new Decimal(product.costPricePerKg.toString()),
            totalCost: sentWeight.times(new Decimal(product.costPricePerKg.toString())),
            referenceType: 'WarehouseTransfer',
            referenceId: trfNumber,
            notes: `Dispatched to ${toWh.name} (Bilty: ${biltyNumber || 'N/A'}, Vehicle: ${vehicleNumber || 'N/A'})`,
            createdById: (req as any).user?.id || null,
          },
        });

        totalBags += sentBags;
        totalWeightKg = totalWeightKg.plus(sentWeight);

        processedItems.push({
          productId: item.productId,
          sentBags,
          sentWeightKg: sentWeight,
          receivedBags: 0,
          receivedWeightKg: new Decimal(0),
          shortageBags: 0,
          shortageWeightKg: new Decimal(0),
        });
      }

      // Create WarehouseTransfer record
      const transfer = await tx.warehouseTransfer.create({
        data: {
          transferNumber: trfNumber,
          transferDate: new Date(transferDate),
          fromWarehouseId,
          toWarehouseId,
          driverName,
          vehicleNumber,
          biltyNumber,
          status: 'IN_TRANSIT',
          totalBags,
          totalWeightKg,
          notes,
          items: { create: processedItems },
        },
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: { include: { product: true } },
        },
      });

      return transfer;
    });

    sendSuccess(res, result, 'Warehouse transfer initiated and stock dispatched', 201);
  } catch (err) {
    next(err);
  }
};

export const receiveWarehouseTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { receivedItems = [], notes } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.warehouseTransfer.findUnique({
        where: { id },
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: { include: { product: true } },
        },
      });

      if (!transfer) throw new AppError('Warehouse transfer not found', 404);
      if (transfer.status === 'RECEIVED') {
        throw new AppError('This transfer has already been received and confirmed', 400);
      }

      let totalTransitLossWeight = new Decimal(0);
      let totalTransitLossBags = 0;

      for (const item of transfer.items) {
        const receivedData = receivedItems.find((r: any) => r.itemId === item.id || r.productId === item.productId);

        const sentBags = item.sentBags;
        const sentWeight = new Decimal(item.sentWeightKg.toString());

        const recBags = receivedData?.receivedBags !== undefined ? Number(receivedData.receivedBags) : sentBags;
        const recWeight = receivedData?.receivedWeightKg !== undefined ? new Decimal(receivedData.receivedWeightKg) : sentWeight;

        const shortageBags = Math.max(0, sentBags - recBags);
        const shortageWeight = Decimal.max(0, sentWeight.minus(recWeight));

        totalTransitLossBags += shortageBags;
        totalTransitLossWeight = totalTransitLossWeight.plus(shortageWeight);

        // Update transfer item
        await tx.warehouseTransferItem.update({
          where: { id: item.id },
          data: {
            receivedBags: recBags,
            receivedWeightKg: recWeight,
            shortageBags,
            shortageWeightKg: shortageWeight,
          },
        });

        // Deposit into destination warehouse
        await tx.stock.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: transfer.toWarehouseId,
              productId: item.productId,
            },
          },
          update: {
            currentBags: { increment: recBags },
            currentWeightKg: { increment: recWeight },
            availableBags: { increment: recBags },
            availableWeightKg: { increment: recWeight },
            lastMovementDate: new Date(),
          },
          create: {
            warehouseId: transfer.toWarehouseId,
            productId: item.productId,
            currentBags: recBags,
            currentWeightKg: recWeight,
            availableBags: recBags,
            availableWeightKg: recWeight,
            lastMovementDate: new Date(),
          },
        });

        // Record stock movement (Inflow into destination)
        await tx.stockMovement.create({
          data: {
            movementNumber: `MOV-TRF-IN-${transfer.transferNumber}-${Math.floor(100 + Math.random() * 900)}`,
            movementType: 'ADJUSTMENT',
            warehouseId: transfer.toWarehouseId,
            productId: item.productId,
            bagCountDelta: recBags,
            weightKgDelta: recWeight,
            unitCostPerKg: new Decimal(item.product.costPricePerKg.toString()),
            totalCost: recWeight.times(new Decimal(item.product.costPricePerKg.toString())),
            referenceType: 'WarehouseTransfer',
            referenceId: transfer.transferNumber,
            notes: `Received from ${transfer.fromWarehouse.name}. Shortage: ${shortageWeight.toFixed(2)} Kg`,
            createdById: (req as any).user?.id || null,
          },
        });

        // If transit loss exists, record wastage audit
        if (shortageWeight.greaterThan(0)) {
          await tx.stockMovement.create({
            data: {
              movementNumber: `MOV-TRF-LOSS-${transfer.transferNumber}-${Math.floor(100 + Math.random() * 900)}`,
              movementType: 'WASTAGE',
              warehouseId: transfer.toWarehouseId,
              productId: item.productId,
              bagCountDelta: -shortageBags,
              weightKgDelta: shortageWeight.negated(),
              unitCostPerKg: new Decimal(item.product.costPricePerKg.toString()),
              totalCost: shortageWeight.times(new Decimal(item.product.costPricePerKg.toString())),
              referenceType: 'WarehouseTransferLoss',
              referenceId: transfer.transferNumber,
              notes: `In-Transit Shrinkage / Spillage on transfer ${transfer.transferNumber}`,
              createdById: (req as any).user?.id || null,
            },
          });
        }
      }

      // Mark transfer RECEIVED
      const updatedTransfer = await tx.warehouseTransfer.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          transitLossBags: totalTransitLossBags,
          transitLossWeightKg: totalTransitLossWeight,
          receivedAt: new Date(),
          receivedById: (req as any).user?.id || null,
          notes: notes ? `${transfer.notes || ''} | Received: ${notes}` : transfer.notes,
        },
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: { include: { product: true } },
        },
      });

      return updatedTransfer;
    });

    sendSuccess(res, result, 'Warehouse transfer received and stock reconciled at destination');
  } catch (err) {
    next(err);
  }
};

export const reconcileWarehouseStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      warehouseId,
      productId,
      physicalBags,
      physicalWeightKg,
      reason = 'Physical Godown Audit Count',
    } = req.body;

    if (!warehouseId || !productId) {
      throw new AppError('Warehouse ID and Product ID are required for stock audit', 400);
    }

    const pBags = Number(physicalBags);
    const pWeight = new Decimal(physicalWeightKg);

    const result = await prisma.$transaction(async (tx) => {
      const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId } });
      const product = await tx.riceProduct.findUnique({ where: { id: productId } });
      if (!warehouse || !product) throw new AppError('Warehouse or Product not found', 404);

      const stock = await tx.stock.findUnique({
        where: { warehouseId_productId: { warehouseId, productId } },
      });

      const currentBags = stock?.currentBags || 0;
      const currentWeight = new Decimal(stock?.currentWeightKg.toString() || 0);

      const bagVariance = pBags - currentBags;
      const weightVariance = pWeight.minus(currentWeight);

      // Upsert stock to match physical count
      const updatedStock = await tx.stock.upsert({
        where: { warehouseId_productId: { warehouseId, productId } },
        update: {
          currentBags: pBags,
          currentWeightKg: pWeight,
          availableBags: pBags,
          availableWeightKg: pWeight,
          lastMovementDate: new Date(),
        },
        create: {
          warehouseId,
          productId,
          currentBags: pBags,
          currentWeightKg: pWeight,
          availableBags: pBags,
          availableWeightKg: pWeight,
          lastMovementDate: new Date(),
        },
      });

      // Post Stock Movement (Adjustment)
      const costPerKg = new Decimal(product.costPricePerKg.toString());
      await tx.stockMovement.create({
        data: {
          movementNumber: `MOV-ADJ-${Date.now().toString().slice(-8)}`,
          movementType: 'ADJUSTMENT',
          warehouseId,
          productId,
          bagCountDelta: bagVariance,
          weightKgDelta: weightVariance,
          unitCostPerKg: costPerKg,
          totalCost: weightVariance.abs().times(costPerKg),
          referenceType: 'StockReconciliation',
          referenceId: `AUDIT-${warehouse.code}`,
          notes: `Stock count reconciliation in ${warehouse.name}: System had ${currentWeight.toFixed(2)} Kg, Physical counted ${pWeight.toFixed(2)} Kg. Variance: ${weightVariance.toFixed(2)} Kg. Reason: ${reason}`,
          createdById: (req as any).user?.id || null,
        },
      });

      return {
        stock: updatedStock,
        variance: {
          bagVariance,
          weightVarianceKg: weightVariance.toFixed(2),
          valuationVariancePkr: weightVariance.times(costPerKg).toFixed(2),
        },
      };
    });

    sendSuccess(res, result, 'Stock reconciliation adjustment posted successfully');
  } catch (err) {
    next(err);
  }
};
