import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import { RiceCalculator } from '../utils/calc';
import Decimal from 'decimal.js';

// ==================== PRODUCT REGISTRY ====================

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId, variety, search } = req.query;
    const where: any = { isActive: true };

    if (categoryId) where.categoryId = categoryId as string;
    if (variety) where.variety = variety as any;
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.riceProduct.findMany({
      where,
      include: {
        category: true,
        stocks: {
          include: { warehouse: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = products.map((p) => {
      const totalBags = p.stocks.reduce((acc, s) => acc + s.currentBags, 0);
      const totalWeightKg = p.stocks.reduce(
        (acc, s) => acc.plus(new Decimal(s.currentWeightKg.toString())),
        new Decimal(0)
      );
      const isLowStock = totalWeightKg.lessThanOrEqualTo(new Decimal(p.reorderLevelKg.toString()));
      const isOutOfStock = totalWeightKg.isZero();

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        variety: p.variety,
        grade: p.grade,
        baseUnit: p.baseUnit,
        defaultBagWeightKg: p.defaultBagWeightKg,
        supportsMaund: p.supportsMaund,
        maundWeightKg: p.maundWeightKg,
        costPricePerKg: p.costPricePerKg,
        salePricePerKg: p.salePricePerKg,
        reorderLevelKg: p.reorderLevelKg,
        category: { id: p.category.id, name: p.category.name, code: p.category.code },
        totalBags,
        totalWeightKg: totalWeightKg.toFixed(2),
        totalMaunds: totalWeightKg.dividedBy(40).toFixed(2),
        isLowStock,
        isOutOfStock,
        stocks: p.stocks.map((s) => ({
          warehouseId: s.warehouse.id,
          warehouseName: s.warehouse.name,
          currentBags: s.currentBags,
          currentWeightKg: s.currentWeightKg,
          availableBags: s.availableBags,
          availableWeightKg: s.availableWeightKg,
        })),
      };
    });

    sendSuccess(res, formatted, 'Products retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      code,
      name,
      categoryId,
      variety,
      grade = 'RAW_WHITE',
      baseUnit = 'KG',
      defaultBagWeightKg = 50.0,
      supportsMaund = true,
      maundWeightKg = 40.0,
      costPricePerKg = 0,
      salePricePerKg = 0,
      reorderLevelKg = 1000.0,
      initialWarehouseId,
      initialBags,
      initialWeightKg,
    } = req.body;

    const existing = await prisma.riceProduct.findUnique({ where: { code } });
    if (existing) {
      throw new AppError(`A rice product with SKU/code '${code}' already exists.`, 409);
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.riceProduct.create({
        data: {
          code,
          name,
          categoryId,
          variety,
          grade,
          baseUnit,
          defaultBagWeightKg,
          supportsMaund,
          maundWeightKg,
          costPricePerKg,
          salePricePerKg,
          reorderLevelKg,
        },
      });

      // Optional opening stock on creation
      if (initialWarehouseId && (initialBags || initialWeightKg)) {
        const bags = parseInt(initialBags || '0', 10);
        const weight = new Decimal(initialWeightKg || (bags * defaultBagWeightKg));
        const costRate = new Decimal(costPricePerKg);
        const totalValuation = weight.times(costRate);

        await tx.stock.create({
          data: {
            warehouseId: initialWarehouseId,
            productId: product.id,
            currentBags: bags,
            currentWeightKg: weight,
            availableBags: bags,
            availableWeightKg: weight,
            lastMovementDate: new Date(),
          },
        });

        await tx.stockMovement.create({
          data: {
            movementNumber: `OPN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            movementType: 'OPENING_STOCK',
            warehouseId: initialWarehouseId,
            productId: product.id,
            bagCountDelta: bags,
            weightKgDelta: weight,
            unitCostPerKg: costRate,
            totalCost: totalValuation,
            referenceType: 'InitialOpeningStock',
            referenceId: `OPN-${product.code}`,
            notes: `Initial opening balance on product creation`,
            createdById: (req as any).user?.id || null,
          },
        });
      }

      return product;
    });

    sendSuccess(res, result, 'Rice product registered successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ==================== OPENING STOCK ENTRY ====================

export const createOpeningStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { warehouseId, productId, bagCount, weightKg, unitCostPerKg, notes } = req.body;

    if (!warehouseId || !productId) {
      throw new AppError('Warehouse and Rice Product are required for opening stock', 400);
    }

    const bags = parseInt(bagCount || '0', 10);
    const weight = new Decimal(weightKg);
    const costRate = new Decimal(unitCostPerKg);

    if (weight.lessThanOrEqualTo(0)) {
      throw new AppError('Opening stock weight must be greater than zero', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.riceProduct.findUnique({ where: { id: productId } });
      if (!product) throw new AppError('Product not found', 404);

      const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouse) throw new AppError('Warehouse not found', 404);

      const totalValuation = weight.times(costRate);

      const stock = await tx.stock.upsert({
        where: { warehouseId_productId: { warehouseId, productId } },
        update: {
          currentBags: { increment: bags },
          currentWeightKg: { increment: weight },
          availableBags: { increment: bags },
          availableWeightKg: { increment: weight },
          lastMovementDate: new Date(),
        },
        create: {
          warehouseId,
          productId,
          currentBags: bags,
          currentWeightKg: weight,
          availableBags: bags,
          availableWeightKg: weight,
          lastMovementDate: new Date(),
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          movementNumber: `MOV-OPN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          movementType: 'OPENING_STOCK',
          warehouseId,
          productId,
          bagCountDelta: bags,
          weightKgDelta: weight,
          unitCostPerKg: costRate,
          totalCost: totalValuation,
          referenceType: 'OpeningStockEntry',
          referenceId: `OPN-${product.code}-${Date.now()}`,
          notes: notes || `Opening stock recorded for ${product.name} in ${warehouse.name}`,
          createdById: (req as any).user?.id || null,
        },
      });

      return { stock, movement, totalValuation: totalValuation.toFixed(2) };
    });

    sendSuccess(res, result, 'Opening stock recorded and movement posted', 201);
  } catch (err) {
    next(err);
  }
};

// ==================== WASTAGE & DAMAGE ====================

export const recordWastage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { warehouseId, productId, bagCount, weightKg, reason } = req.body;

    const bags = parseInt(bagCount || '0', 10);
    const weight = new Decimal(weightKg);

    if (weight.lessThanOrEqualTo(0)) {
      throw new AppError('Wastage weight must be greater than zero', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const stock = await tx.stock.findUnique({
        where: { warehouseId_productId: { warehouseId, productId } },
        include: { product: true },
      });

      if (!stock || new Decimal(stock.availableWeightKg.toString()).lessThan(weight)) {
        throw new AppError(
          `Insufficient stock to record wastage. Available: ${stock?.availableWeightKg || 0} Kg. Requested wastage: ${weight} Kg.`,
          409
        );
      }

      const costRate = new Decimal(stock.product.costPricePerKg.toString());
      const totalLoss = weight.times(costRate);

      const updatedStock = await tx.stock.update({
        where: { id: stock.id },
        data: {
          currentBags: { decrement: bags },
          currentWeightKg: new Decimal(stock.currentWeightKg.toString()).minus(weight),
          availableBags: { decrement: bags },
          availableWeightKg: new Decimal(stock.availableWeightKg.toString()).minus(weight),
          lastMovementDate: new Date(),
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          movementNumber: `MOV-WST-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          movementType: 'WASTAGE',
          warehouseId,
          productId,
          bagCountDelta: -bags,
          weightKgDelta: weight.negated(),
          unitCostPerKg: costRate,
          totalCost: totalLoss,
          referenceType: 'WastageLoss',
          referenceId: `WST-${Date.now()}`,
          notes: reason || 'Moisture evaporation or bag spillage damage',
          createdById: (req as any).user?.id || null,
        },
      });

      return { updatedStock, movement, totalLoss: totalLoss.toFixed(2) };
    });

    sendSuccess(res, result, 'Wastage recorded and inventory deducted', 201);
  } catch (err) {
    next(err);
  }
};

// ==================== STOCK OVERVIEW & MATRIX ====================

export const getStockOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { warehouseId, categoryId, lowStockOnly } = req.query;

    const whereClause: any = {};
    if (warehouseId && typeof warehouseId === 'string') {
      whereClause.warehouseId = warehouseId;
    }
    if (categoryId && typeof categoryId === 'string') {
      whereClause.product = { categoryId };
    }

    const stocks = await prisma.stock.findMany({
      where: whereClause,
      include: {
        warehouse: true,
        product: {
          include: { category: true },
        },
      },
      orderBy: [{ warehouse: { name: 'asc' } }, { product: { name: 'asc' } }],
    });

    const formatted = stocks
      .map((s) => {
        const val = RiceCalculator.multiply(s.currentWeightKg, s.product.costPricePerKg);
        const weight = new Decimal(s.currentWeightKg.toString());
        const isLowStock = weight.lessThanOrEqualTo(new Decimal(s.product.reorderLevelKg.toString()));
        const isOutOfStock = weight.isZero();

        return {
          id: s.id,
          warehouse: { id: s.warehouse.id, name: s.warehouse.name, code: s.warehouse.code },
          product: {
            id: s.product.id,
            name: s.product.name,
            code: s.product.code,
            variety: s.product.variety,
            grade: s.product.grade,
            category: s.product.category.name,
            defaultBagWeightKg: s.product.defaultBagWeightKg,
            costPricePerKg: s.product.costPricePerKg,
            salePricePerKg: s.product.salePricePerKg,
            reorderLevelKg: s.product.reorderLevelKg,
          },
          currentBags: s.currentBags,
          currentWeightKg: s.currentWeightKg,
          availableBags: s.availableBags,
          availableWeightKg: s.availableWeightKg,
          maunds: weight.dividedBy(40).toFixed(2),
          valuationAmount: val.toFixed(2),
          isLowStock,
          isOutOfStock,
          lastMovementDate: s.lastMovementDate,
        };
      })
      .filter((s) => (lowStockOnly === 'true' ? s.isLowStock : true));

    const totalBags = formatted.reduce((acc, curr) => acc + curr.currentBags, 0);
    const totalWeightKg = formatted.reduce(
      (acc, curr) => acc.plus(new Decimal(curr.currentWeightKg.toString())),
      new Decimal(0)
    );
    const totalValuation = formatted.reduce(
      (acc, curr) => acc.plus(new Decimal(curr.valuationAmount)),
      new Decimal(0)
    );

    sendSuccess(
      res,
      {
        stocks: formatted,
        summary: {
          totalBags,
          totalWeightKg: totalWeightKg.toFixed(2),
          totalMaunds: totalWeightKg.dividedBy(40).toFixed(2),
          totalMetricTons: totalWeightKg.dividedBy(1000).toFixed(3),
          totalValuation: totalValuation.toFixed(2),
          totalVarieties: formatted.length,
          lowStockCount: formatted.filter((f) => f.isLowStock).length,
        },
      },
      'Stock overview retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

// ==================== STOCK MOVEMENTS & LEDGER ====================

export const getStockMovements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { warehouseId, productId, movementType, limit = '50', page = '1' } = req.query;

    const take = parseInt(limit as string, 10);
    const skip = (parseInt(page as string, 10) - 1) * take;

    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId as string;
    if (productId) where.productId = productId as string;
    if (movementType) where.movementType = movementType as any;

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          warehouse: true,
          product: true,
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    sendSuccess(
      res,
      movements,
      'Stock movements retrieved successfully',
      200,
      {
        page: parseInt(page as string, 10),
        limit: take,
        totalCount: total,
        totalPages: Math.ceil(total / take),
      }
    );
  } catch (err) {
    next(err);
  }
};

// ==================== PHYSICAL AUDIT ADJUSTMENT ====================

export const adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { warehouseId, productId, actualBags, actualWeightKg, reason } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const stock = await tx.stock.findUnique({
        where: {
          warehouseId_productId: { warehouseId, productId },
        },
        include: { product: true },
      });

      if (!stock) {
        throw new AppError('Stock record for this product and warehouse does not exist', 404);
      }

      const bagDelta = actualBags - stock.currentBags;
      const weightDelta = RiceCalculator.subtract(actualWeightKg, stock.currentWeightKg);

      const movement = await tx.stockMovement.create({
        data: {
          movementNumber: `ADJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          movementType: 'ADJUSTMENT',
          warehouseId,
          productId,
          bagCountDelta: bagDelta,
          weightKgDelta: weightDelta.toFixed(4),
          unitCostPerKg: stock.product.costPricePerKg,
          totalCost: weightDelta.abs().times(new Decimal(stock.product.costPricePerKg.toString())).toFixed(4),
          referenceType: 'PhysicalAuditAdjustment',
          referenceId: `AUDIT-${Date.now()}`,
          notes: reason,
          createdById: (req as any).user?.id || null,
        },
      });

      const updatedStock = await tx.stock.update({
        where: { id: stock.id },
        data: {
          currentBags: actualBags,
          currentWeightKg: actualWeightKg,
          availableBags: actualBags,
          availableWeightKg: actualWeightKg,
          lastMovementDate: new Date(),
        },
      });

      return { movement, updatedStock };
    });

    sendSuccess(res, result, 'Stock audit adjustment recorded successfully');
  } catch (err) {
    next(err);
  }
};

// ==================== ALERTS & REPORTS ====================

export const getStockAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stocks = await prisma.stock.findMany({
      include: { product: { include: { category: true } }, warehouse: true },
    });

    const lowStock = [];
    const outOfStock = [];

    for (const s of stocks) {
      const weight = new Decimal(s.currentWeightKg.toString());
      const reorder = new Decimal(s.product.reorderLevelKg.toString());

      if (weight.isZero() || s.currentBags === 0) {
        outOfStock.push({
          productId: s.product.id,
          productName: s.product.name,
          variety: s.product.variety,
          warehouseName: s.warehouse.name,
          currentBags: s.currentBags,
          currentWeightKg: s.currentWeightKg,
          reorderLevelKg: s.product.reorderLevelKg,
        });
      } else if (weight.lessThanOrEqualTo(reorder)) {
        lowStock.push({
          productId: s.product.id,
          productName: s.product.name,
          variety: s.product.variety,
          warehouseName: s.warehouse.name,
          currentBags: s.currentBags,
          currentWeightKg: s.currentWeightKg,
          reorderLevelKg: s.product.reorderLevelKg,
          deficitKg: reorder.minus(weight).toFixed(2),
        });
      }
    }

    sendSuccess(res, {
      lowStock,
      outOfStock,
      totalAlerts: lowStock.length + outOfStock.length,
    });
  } catch (err) {
    next(err);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await prisma.riceCategory.findMany({
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
};

export const getWarehouses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, warehouses);
  } catch (err) {
    next(err);
  }
};
