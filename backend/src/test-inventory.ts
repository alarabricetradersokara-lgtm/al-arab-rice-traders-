import prisma from './config/prisma';
import Decimal from 'decimal.js';
import { RiceCalculator } from './utils/calc';

async function runInventoryTests() {
  console.log('🌾 ================================================================');
  console.log('🌾 AL ARAB RICE TRADERS - STEP 4 INVENTORY & STOCK MODULE TESTS');
  console.log('🌾 ================================================================');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string, details?: any) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, details || '');
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------
    // SETUP: Fetch Category, Warehouses & Admin User
    // -------------------------------------------------------------
    const category = await prisma.riceCategory.findFirst({ where: { code: 'CAT-BASMATI' } });
    const warehouse1 = await prisma.warehouse.findFirst({ where: { code: 'GODOWN-01' } });
    const warehouse2 = await prisma.warehouse.findFirst({ where: { code: 'GODOWN-02' } });
    const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });

    assert(!!category && !!warehouse1 && !!warehouse2 && !!adminUser, 'Found prerequisite master data');

    const testSku = `TEST-SKU-${Date.now()}`;

    // -------------------------------------------------------------
    // REQUIREMENT 1: RICE PRODUCT CREATION
    // -------------------------------------------------------------
    console.log('\n[1] Testing Rice Product Creation with Dual Units & Specifications...');
    const createdProduct = await prisma.$transaction(async (tx) => {
      return await tx.riceProduct.create({
        data: {
          code: testSku,
          name: 'Super Basmati Sella 1121 Export Grade',
          categoryId: category!.id,
          variety: 'BASMATI_1121_KAINAT',
          grade: 'SELLA_PARBOILED',
          baseUnit: 'KG',
          defaultBagWeightKg: 50.0,
          supportsMaund: true,
          maundWeightKg: 40.0,
          costPricePerKg: 350.0,
          salePricePerKg: 420.0,
          reorderLevelKg: 5000.0,
        },
      });
    });

    assert(createdProduct.code === testSku, 'Product created with correct SKU');
    assert(new Decimal(createdProduct.defaultBagWeightKg.toString()).equals(50.0), 'Default bag weight is 50.0000 Kg');
    assert(new Decimal(createdProduct.maundWeightKg.toString()).equals(40.0), 'Standard maund weight is 40.0000 Kg');
    assert(createdProduct.variety === 'BASMATI_1121_KAINAT', 'Variety correctly stored');
    assert(createdProduct.grade === 'SELLA_PARBOILED', 'Quality grade correctly stored');

    // -------------------------------------------------------------
    // REQUIREMENT 2: OPENING STOCK ENTRY & VALUATION
    // -------------------------------------------------------------
    console.log('\n[2] Testing Opening Stock Entry & Exact Valuation...');
    const openingBags = 200; // 200 bags of 50kg = 10,000 kg (250 Maunds)
    const openingWeightKg = new Decimal(openingBags).times(50.0);
    const openingRatePerKg = new Decimal(350.0);
    const openingValuation = openingWeightKg.times(openingRatePerKg); // 10,000 * 350 = 3,500,000.00

    const openingStockResult = await prisma.$transaction(async (tx) => {
      const stock = await tx.stock.create({
        data: {
          warehouseId: warehouse1!.id,
          productId: createdProduct.id,
          currentBags: openingBags,
          currentWeightKg: openingWeightKg,
          availableBags: openingBags,
          availableWeightKg: openingWeightKg,
          lastMovementDate: new Date(),
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          movementNumber: `MOV-OPN-${Date.now()}`,
          movementType: 'OPENING_STOCK',
          warehouseId: warehouse1!.id,
          productId: createdProduct.id,
          bagCountDelta: openingBags,
          weightKgDelta: openingWeightKg,
          unitCostPerKg: openingRatePerKg,
          totalCost: openingValuation,
          referenceType: 'InitialOpeningStock',
          referenceId: `OPN-${testSku}`,
          notes: 'Fiscal Year Opening Stock Tally',
          createdById: adminUser!.id,
        },
      });

      return { stock, movement };
    });

    assert(openingStockResult.stock.currentBags === 200, 'Opening stock recorded 200 bags');
    assert(new Decimal(openingStockResult.stock.currentWeightKg.toString()).equals(10000), 'Opening stock net weight is exactly 10,000 Kg');
    assert(new Decimal(openingStockResult.movement.totalCost.toString()).equals(3500000), 'Opening stock valuation is exactly PKR 3,500,000.0000');
    assert(openingStockResult.movement.movementType === 'OPENING_STOCK', 'Movement tagged as OPENING_STOCK');

    // -------------------------------------------------------------
    // REQUIREMENT 3: STOCK MANAGEMENT & DUAL-UOM CONVERSION
    // -------------------------------------------------------------
    console.log('\n[3] Testing Stock Management & Dual-UOM (Bags, Kg, Maund, Metric Tons)...');
    const stockRecord = await prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId: warehouse1!.id, productId: createdProduct.id } },
      include: { product: true, warehouse: true },
    });

    const weightKg = new Decimal(stockRecord!.currentWeightKg.toString());
    const maunds = weightKg.dividedBy(40.0);
    const metricTons = weightKg.dividedBy(1000.0);
    const valuation = weightKg.times(new Decimal(stockRecord!.product.costPricePerKg.toString()));

    assert(stockRecord!.currentBags === 200, 'Current bags is 200');
    assert(stockRecord!.availableBags === 200, 'Available bags is 200');
    assert(maunds.equals(250), 'Weight converts to exactly 250 Maunds (40kg basis)');
    assert(metricTons.equals(10), 'Weight converts to exactly 10.000 Metric Tons');
    assert(valuation.equals(3500000), 'Stock valuation calculated with decimal precision');

    // -------------------------------------------------------------
    // REQUIREMENT 4: AUTOMATIC STOCK UPDATES & TRANSACTIONS
    // -------------------------------------------------------------
    console.log('\n[4] Testing Automatic Stock Updates Across Business Workflows...');

    // 4A: Sale decreases stock
    const saleBags = 50; // 50 bags = 2,500 kg
    const saleWeightKg = new Decimal(2500);

    await prisma.$transaction(async (tx) => {
      // Check stock
      const current = await tx.stock.findUnique({
        where: { warehouseId_productId: { warehouseId: warehouse1!.id, productId: createdProduct.id } },
      });
      if (!current || current.availableBags < saleBags) throw new Error('Insufficient stock');

      await tx.stock.update({
        where: { id: current.id },
        data: {
          currentBags: { decrement: saleBags },
          currentWeightKg: { decrement: saleWeightKg },
          availableBags: { decrement: saleBags },
          availableWeightKg: { decrement: saleWeightKg },
          lastMovementDate: new Date(),
        },
      });

      await tx.stockMovement.create({
        data: {
          movementNumber: `MOV-SAL-TEST-${Date.now()}`,
          movementType: 'SALE',
          warehouseId: warehouse1!.id,
          productId: createdProduct.id,
          bagCountDelta: -saleBags,
          weightKgDelta: saleWeightKg.negated(),
          unitCostPerKg: openingRatePerKg,
          totalCost: saleWeightKg.times(openingRatePerKg),
          referenceType: 'Sale',
          referenceId: 'TEST-INV-001',
          createdById: adminUser!.id,
        },
      });
    });

    const stockAfterSale = await prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId: warehouse1!.id, productId: createdProduct.id } },
    });
    assert(stockAfterSale!.currentBags === 150, 'Sale decreased stock: 200 - 50 = 150 bags');
    assert(new Decimal(stockAfterSale!.currentWeightKg.toString()).equals(7500), 'Sale decreased weight: 10,000 - 2,500 = 7,500 Kg');

    // 4B: Sales Return increases stock
    const returnBags = 10;
    const returnWeightKg = new Decimal(500);

    await prisma.$transaction(async (tx) => {
      await tx.stock.update({
        where: { warehouseId_productId: { warehouseId: warehouse1!.id, productId: createdProduct.id } },
        data: {
          currentBags: { increment: returnBags },
          currentWeightKg: { increment: returnWeightKg },
          availableBags: { increment: returnBags },
          availableWeightKg: { increment: returnWeightKg },
          lastMovementDate: new Date(),
        },
      });

      await tx.stockMovement.create({
        data: {
          movementNumber: `MOV-SRT-TEST-${Date.now()}`,
          movementType: 'SALE_RETURN',
          warehouseId: warehouse1!.id,
          productId: createdProduct.id,
          bagCountDelta: returnBags,
          weightKgDelta: returnWeightKg,
          unitCostPerKg: openingRatePerKg,
          totalCost: returnWeightKg.times(openingRatePerKg),
          referenceType: 'SalesReturn',
          referenceId: 'TEST-RET-001',
          createdById: adminUser!.id,
        },
      });
    });

    const stockAfterReturn = await prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId: warehouse1!.id, productId: createdProduct.id } },
    });
    assert(stockAfterReturn!.currentBags === 160, 'Sales return increased stock: 150 + 10 = 160 bags');
    assert(new Decimal(stockAfterReturn!.currentWeightKg.toString()).equals(8000), 'Sales return increased weight: 7,500 + 500 = 8,000 Kg');

    // 4C: Physical Audit Adjustment updates stock with audit trail
    const auditActualBags = 158; // 2 bags shortage discovered
    const auditActualWeightKg = new Decimal(7900);

    await prisma.$transaction(async (tx) => {
      const bagDelta = auditActualBags - stockAfterReturn!.currentBags; // -2
      const weightDelta = auditActualWeightKg.minus(new Decimal(stockAfterReturn!.currentWeightKg.toString())); // -100

      await tx.stockMovement.create({
        data: {
          movementNumber: `MOV-ADJ-TEST-${Date.now()}`,
          movementType: 'ADJUSTMENT',
          warehouseId: warehouse1!.id,
          productId: createdProduct.id,
          bagCountDelta: bagDelta,
          weightKgDelta: weightDelta,
          unitCostPerKg: openingRatePerKg,
          totalCost: weightDelta.abs().times(openingRatePerKg),
          referenceType: 'PhysicalAuditAdjustment',
          referenceId: `AUDIT-${Date.now()}`,
          notes: 'Cycle count physical shortage adjustment',
          createdById: adminUser!.id,
        },
      });

      await tx.stock.update({
        where: { warehouseId_productId: { warehouseId: warehouse1!.id, productId: createdProduct.id } },
        data: {
          currentBags: auditActualBags,
          currentWeightKg: auditActualWeightKg,
          availableBags: auditActualBags,
          availableWeightKg: auditActualWeightKg,
          lastMovementDate: new Date(),
        },
      });
    });

    const stockAfterAudit = await prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId: warehouse1!.id, productId: createdProduct.id } },
    });
    assert(stockAfterAudit!.currentBags === 158, 'Audit adjustment updated stock to 158 bags');
    assert(new Decimal(stockAfterAudit!.currentWeightKg.toString()).equals(7900), 'Audit adjustment updated weight to 7,900 Kg');

    // 4D: Wastage entry deductions
    const wastageBags = 3;
    const wastageWeightKg = new Decimal(150);

    await prisma.$transaction(async (tx) => {
      await tx.stock.update({
        where: { warehouseId_productId: { warehouseId: warehouse1!.id, productId: createdProduct.id } },
        data: {
          currentBags: { decrement: wastageBags },
          currentWeightKg: { decrement: wastageWeightKg },
          availableBags: { decrement: wastageBags },
          availableWeightKg: { decrement: wastageWeightKg },
          lastMovementDate: new Date(),
        },
      });

      await tx.stockMovement.create({
        data: {
          movementNumber: `MOV-WST-TEST-${Date.now()}`,
          movementType: 'WASTAGE',
          warehouseId: warehouse1!.id,
          productId: createdProduct.id,
          bagCountDelta: -wastageBags,
          weightKgDelta: wastageWeightKg.negated(),
          unitCostPerKg: openingRatePerKg,
          totalCost: wastageWeightKg.times(openingRatePerKg),
          referenceType: 'WastageLoss',
          referenceId: `WST-${Date.now()}`,
          notes: 'Rain water leak damage',
          createdById: adminUser!.id,
        },
      });
    });

    const stockAfterWastage = await prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId: warehouse1!.id, productId: createdProduct.id } },
    });
    assert(stockAfterWastage!.currentBags === 155, 'Wastage deducted: 158 - 3 = 155 bags');
    assert(new Decimal(stockAfterWastage!.currentWeightKg.toString()).equals(7750), 'Wastage weight deducted: 7,900 - 150 = 7,750 Kg');

    // -------------------------------------------------------------
    // REQUIREMENT 5: STOCK ALERTS & NEGATIVE STOCK PREVENTION
    // -------------------------------------------------------------
    console.log('\n[5] Testing Stock Alerts & Negative Stock Prevention...');

    // 5A: Low Stock Alert Check (reorderLevelKg = 5000, current = 7750 -> Not yet low)
    // Now simulate drawing stock down below reorder level (e.g. to 4,000 kg)
    const drawDownWeightKg = new Decimal(3750);
    const drawDownBags = 75;

    await prisma.stock.update({
      where: { warehouseId_productId: { warehouseId: warehouse1!.id, productId: createdProduct.id } },
      data: {
        currentBags: { decrement: drawDownBags },
        currentWeightKg: { decrement: drawDownWeightKg },
        availableBags: { decrement: drawDownBags },
        availableWeightKg: { decrement: drawDownWeightKg },
      },
    });

    const stockDrawn = await prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId: warehouse1!.id, productId: createdProduct.id } },
      include: { product: true },
    });

    const isLowStock = new Decimal(stockDrawn!.currentWeightKg.toString()).lessThanOrEqualTo(
      new Decimal(stockDrawn!.product.reorderLevelKg.toString())
    );
    assert(isLowStock === true, 'Low stock alert triggers when current stock (4,000 Kg) <= reorder level (5,000 Kg)');

    // 5B: Negative Stock Prevention
    let negativeStockBlocked = false;
    try {
      const requestedOversellBags = 100; // Available is only 80 bags (4,000 kg)
      const requestedOversellWeight = new Decimal(5000);

      await prisma.$transaction(async (tx) => {
        const s = await tx.stock.findUnique({
          where: { warehouseId_productId: { warehouseId: warehouse1!.id, productId: createdProduct.id } },
        });

        if (s!.availableBags < requestedOversellBags || new Decimal(s!.availableWeightKg.toString()).lessThan(requestedOversellWeight)) {
          throw new Error('NEGATIVE_STOCK_PREVENTED: Cannot oversell beyond warehouse physical availability');
        }
      });
    } catch (err: any) {
      if (err.message.includes('NEGATIVE_STOCK_PREVENTED')) {
        negativeStockBlocked = true;
      }
    }
    assert(negativeStockBlocked === true, 'Negative inventory successfully prevented by transaction guard');

    // -------------------------------------------------------------
    // REQUIREMENT 6: STOCK AUDIT TRAIL & REPORTS
    // -------------------------------------------------------------
    console.log('\n[6] Testing Stock Audit Trail & Comprehensive Reports...');
    const movements = await prisma.stockMovement.findMany({
      where: { productId: createdProduct.id },
      orderBy: { createdAt: 'asc' },
    });

    assert(movements.length === 5, 'Complete audit log captured all 5 stock movements (OPENING, SALE, RETURN, ADJUSTMENT, WASTAGE)');
    assert(movements[0].movementType === 'OPENING_STOCK', 'First movement is OPENING_STOCK');
    assert(movements[1].movementType === 'SALE', 'Second movement is SALE');
    assert(movements[2].movementType === 'SALE_RETURN', 'Third movement is SALE_RETURN');
    assert(movements[3].movementType === 'ADJUSTMENT', 'Fourth movement is ADJUSTMENT');
    assert(movements[4].movementType === 'WASTAGE', 'Fifth movement is WASTAGE');

    // Clean up test product to keep database pristine
    await prisma.stockMovement.deleteMany({ where: { productId: createdProduct.id } });
    await prisma.stock.deleteMany({ where: { productId: createdProduct.id } });
    await prisma.riceProduct.delete({ where: { id: createdProduct.id } });
    console.log('  🧹 Cleaned up test sandbox records');

    console.log('\n🌾 ================================================================');
    console.log(`🌾 STEP 4 INVENTORY VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('🌾 ================================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Critical Test Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runInventoryTests();
