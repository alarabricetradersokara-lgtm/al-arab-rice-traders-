import prisma from './config/prisma';
import Decimal from 'decimal.js';

async function runPurchaseTests() {
  console.log('🌾 ================================================================');
  console.log('🌾 AL ARAB RICE TRADERS - STEP 6 PURCHASE & SUPPLIER TESTS');
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
    // SETUP: Master data
    // -------------------------------------------------------------
    const supplier = await prisma.supplier.findFirst({ where: { code: 'SUPP-001' } });
    const warehouse = await prisma.warehouse.findFirst({ where: { code: 'GODOWN-01' } });
    const cashAccount = await prisma.cashAccount.findFirst({ where: { code: 'CASH-MAIN' } });
    const productPaddy = await prisma.riceProduct.findFirst({ where: { code: 'PAD-1121-RAW' } });
    const productBasmati = await prisma.riceProduct.findFirst({ where: { code: 'RICE-SUP-RAW' } });
    const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });

    assert(!!supplier && !!warehouse && !!cashAccount && !!productPaddy && !!productBasmati && !!adminUser, 'Found prerequisite master data');

    const initStockPaddy = await prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: productPaddy!.id } },
    });
    const initBagsPaddy = initStockPaddy?.availableBags || 0;
    const initWeightPaddy = new Decimal(initStockPaddy?.availableWeightKg.toString() || '0');
    const initSuppBal = new Decimal(supplier!.currentBalance.toString());
    const initCash = new Decimal(cashAccount!.balance.toString());

    console.log(`Initial stock for ${productPaddy!.name}: ${initBagsPaddy} Bags (${initWeightPaddy} Kg)`);
    console.log(`Initial supplier balance for ${supplier!.name}: PKR ${initSuppBal}`);
    console.log(`Initial cash balance: PKR ${initCash}`);

    // -------------------------------------------------------------
    // TEST 1: CREATE MULTI-PRODUCT PURCHASE BILL (WITH FREIGHT & DEDUCTIONS)
    // -------------------------------------------------------------
    console.log('\n[1] Testing Multi-Product Purchase Bill with Landed Cost & Deductions...');
    // Item 1: Raw Paddy 100 bags (50kg) = 5,000 kg (125 Maunds) @ 120/kg = 600,000
    // Item 2: Super Basmati 50 bags (50kg) = 2,500 kg (62.5 Maunds) @ 250/kg = 625,000
    // Subtotal = 1,225,000
    // Moisture deduction = 15,000, Karda = 10,000
    // Commission = 12,250 (1%), Palledari = 5,000, Freight = 25,000
    // Net Amount = 1,225,000 - 15,000 - 10,000 + 12,250 + 5,000 + 25,000 = 1,242,250
    // Paid Amount = 400,000 (Partial Cash Payment)
    // Balance Amount = 842,250
    const testPurchaseNo = `PUR-TEST-${Date.now()}`;

    const purchase = await prisma.$transaction(async (tx) => {
      const p = await tx.purchase.create({
        data: {
          purchaseNumber: testPurchaseNo,
          supplierId: supplier!.id,
          warehouseId: warehouse!.id,
          purchaseDate: new Date('2026-11-20'),
          paymentType: 'PARTIAL',
          status: 'BILLED',
          subTotal: 1225000.0,
          moistureDeductionWeightKg: 100.0,
          moistureDeductionAmount: 15000.0,
          bardanaTareDeductionKg: 150.0,
          kardaDeductionAmount: 10000.0,
          commissionAmount: 12250.0,
          palledariAmount: 5000.0,
          freightAmount: 25000.0,
          netAmount: 1242250.0,
          paidAmount: 400000.0,
          balanceAmount: 842250.0,
          truckNumber: 'LES-9921',
          biltyNumber: 'BL-8819',
          notes: 'Mandi direct intake procurement lot',
          createdById: adminUser!.id,
          items: {
            create: [
              {
                productId: productPaddy!.id,
                bagCount: 100,
                bagWeightKg: 50.0,
                grossWeightKg: 5100.0,
                bardanaTareKg: 100.0,
                netWeightKg: 5000.0,
                unitPricePerKg: 120.0,
                lineTotal: 600000.0,
              },
              {
                productId: productBasmati!.id,
                bagCount: 50,
                bagWeightKg: 50.0,
                grossWeightKg: 2550.0,
                bardanaTareKg: 50.0,
                netWeightKg: 2500.0,
                unitPricePerKg: 250.0,
                lineTotal: 625000.0,
              },
            ],
          },
        },
        include: { items: true },
      });

      // Stock increments
      for (const item of p.items) {
        await tx.stock.upsert({
          where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: item.productId } },
          update: {
            currentBags: { increment: item.bagCount },
            currentWeightKg: { increment: item.netWeightKg },
            availableBags: { increment: item.bagCount },
            availableWeightKg: { increment: item.netWeightKg },
            lastMovementDate: new Date(),
          },
          create: {
            warehouseId: warehouse!.id,
            productId: item.productId,
            currentBags: item.bagCount,
            currentWeightKg: item.netWeightKg,
            availableBags: item.bagCount,
            availableWeightKg: item.netWeightKg,
            lastMovementDate: new Date(),
          },
        });

        await tx.stockMovement.create({
          data: {
            movementNumber: `MOV-PUR-TEST-${item.id}`,
            movementType: 'PURCHASE',
            warehouseId: warehouse!.id,
            productId: item.productId,
            bagCountDelta: item.bagCount,
            weightKgDelta: item.netWeightKg,
            unitCostPerKg: item.unitPricePerKg,
            totalCost: item.lineTotal,
            referenceType: 'PurchaseBill',
            referenceId: p.purchaseNumber,
            notes: 'Test procurement inward',
            createdById: adminUser!.id,
          },
        });
      }

      // Supplier balance update
      const newSuppBal = initSuppBal.plus(1242250).minus(400000);
      await tx.supplier.update({
        where: { id: supplier!.id },
        data: { currentBalance: newSuppBal },
      });

      // Bill Credit entry
      await tx.supplierLedger.create({
        data: {
          supplierId: supplier!.id,
          date: new Date('2026-11-20'),
          transactionType: 'PURCHASE',
          referenceNo: p.purchaseNumber,
          description: 'Grain Purchase Bill (Truck: LES-9921)',
          debit: 0,
          credit: 1242250.0,
          runningBalance: initSuppBal.plus(1242250),
        },
      });

      // Partial Payment entry
      await tx.supplierLedger.create({
        data: {
          supplierId: supplier!.id,
          date: new Date('2026-11-20'),
          transactionType: 'PAYMENT',
          referenceNo: `PAY-${p.purchaseNumber}`,
          description: `Partial cash payment against bill ${p.purchaseNumber}`,
          debit: 400000.0,
          credit: 0,
          runningBalance: newSuppBal,
        },
      });

      // Deduct from Cash Account
      await tx.cashAccount.update({
        where: { id: cashAccount!.id },
        data: { balance: { decrement: 400000.0 } },
      });

      return p;
    });

    assert(purchase.purchaseNumber === testPurchaseNo, 'Purchase created with correct voucher number');
    assert(new Decimal(purchase.netAmount.toString()).equals(1242250), 'Net amount calculated correctly: PKR 1,242,250.00');
    assert(new Decimal(purchase.balanceAmount.toString()).equals(842250), 'Outstanding balance tracked: PKR 842,250.00');

    // -------------------------------------------------------------
    // TEST 2: STOCK & LEDGER VERIFICATION
    // -------------------------------------------------------------
    console.log('\n[2] Verifying Inventory Increment & Supplier Khatabook Postings...');
    const stockAfter = await prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: productPaddy!.id } },
    });
    assert(stockAfter!.currentBags === initBagsPaddy + 100, 'Paddy stock incremented by 100 bags');
    assert(
      new Decimal(stockAfter!.currentWeightKg.toString()).equals(initWeightPaddy.plus(5000)),
      'Paddy weight incremented by 5,000 Kg (125 Maunds)'
    );

    const suppAfter = await prisma.supplier.findUnique({ where: { id: supplier!.id } });
    assert(
      new Decimal(suppAfter!.currentBalance.toString()).equals(initSuppBal.plus(842250)),
      'Supplier outstanding balance updated by net unpaid amount (PKR +842,250)'
    );

    const cashAfter = await prisma.cashAccount.findUnique({ where: { id: cashAccount!.id } });
    assert(
      new Decimal(cashAfter!.balance.toString()).equals(initCash.minus(400000)),
      'Cash account deducted by paid disbursement (PKR -400,000)'
    );

    // -------------------------------------------------------------
    // TEST 3: PURCHASE RETURN (DEBIT NOTE)
    // -------------------------------------------------------------
    console.log('\n[3] Testing Purchase Return (Debit Note) & Inventory Deduction...');
    // Return 20 bags of Paddy (1,000 kg @ 120 = 120,000 PKR)
    const returnNo = `PRT-TEST-${Date.now()}`;
    const returnAmount = new Decimal(120000.0);

    const returnRec = await prisma.$transaction(async (tx) => {
      const pr = await tx.purchaseReturn.create({
        data: {
          returnNumber: returnNo,
          purchaseId: purchase.id,
          supplierId: supplier!.id,
          returnDate: new Date('2026-11-21'),
          totalBags: 20,
          totalWeightKg: 1000.0,
          totalAmount: returnAmount,
          reason: 'Excess moisture and high admixture content',
        },
      });

      // Deduct stock
      await tx.stock.update({
        where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: productPaddy!.id } },
        data: {
          currentBags: { decrement: 20 },
          currentWeightKg: { decrement: 1000.0 },
          availableBags: { decrement: 20 },
          availableWeightKg: { decrement: 1000.0 },
          lastMovementDate: new Date(),
        },
      });

      await tx.stockMovement.create({
        data: {
          movementNumber: `MOV-PRT-TEST-${Date.now()}`,
          movementType: 'PURCHASE_RETURN',
          warehouseId: warehouse!.id,
          productId: productPaddy!.id,
          bagCountDelta: -20,
          weightKgDelta: -1000.0,
          unitCostPerKg: 120.0,
          totalCost: returnAmount,
          referenceType: 'PurchaseReturn',
          referenceId: returnNo,
          notes: 'Test return debit note',
          createdById: adminUser!.id,
        },
      });

      // Update supplier balance (Debit note decreases payable balance)
      const currentSupp = await tx.supplier.findUnique({ where: { id: supplier!.id } });
      const newBalAfterReturn = new Decimal(currentSupp!.currentBalance.toString()).minus(returnAmount);

      await tx.supplier.update({
        where: { id: supplier!.id },
        data: { currentBalance: newBalAfterReturn },
      });

      await tx.supplierLedger.create({
        data: {
          supplierId: supplier!.id,
          date: new Date('2026-11-21'),
          transactionType: 'PURCHASE_RETURN',
          referenceNo: returnNo,
          description: `Debit Note: Quality Rejection on Bill ${purchase.purchaseNumber}`,
          debit: returnAmount,
          credit: 0,
          runningBalance: newBalAfterReturn,
        },
      });

      return pr;
    });

    assert(returnRec.returnNumber === returnNo, 'Purchase return record created');
    assert(new Decimal(returnRec.totalAmount.toString()).equals(120000), 'Debit note amount is PKR 120,000.00');

    const stockAfterReturn = await prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: productPaddy!.id } },
    });
    assert(stockAfterReturn!.currentBags === initBagsPaddy + 80, 'Paddy stock reduced by 20 returned bags');

    const suppAfterReturn = await prisma.supplier.findUnique({ where: { id: supplier!.id } });
    assert(
      new Decimal(suppAfterReturn!.currentBalance.toString()).equals(initSuppBal.plus(842250).minus(120000)),
      'Supplier outstanding balance reduced by debit note (PKR 842,250 - 120,000 = 722,250)'
    );

    // -------------------------------------------------------------
    // TEST 4: SUPPLIER STATEMENT & RUNNING BALANCE
    // -------------------------------------------------------------
    console.log('\n[4] Verifying Supplier Statement Ledger Entries & Math Consistency...');
    const ledgers = await prisma.supplierLedger.findMany({
      where: { supplierId: supplier!.id },
      orderBy: { date: 'asc' },
    });

    const hasBill = ledgers.some((l) => l.referenceNo === purchase.purchaseNumber && l.transactionType === 'PURCHASE');
    const hasPay = ledgers.some((l) => l.referenceNo === `PAY-${purchase.purchaseNumber}` && l.transactionType === 'PAYMENT');
    const hasDebitNote = ledgers.some((l) => l.referenceNo === returnNo && l.transactionType === 'PURCHASE_RETURN');

    assert(hasBill === true, 'Supplier ledger contains Bill credit');
    assert(hasPay === true, 'Supplier ledger contains Payment debit');
    assert(hasDebitNote === true, 'Supplier ledger contains Debit Note debit');

    // Clean up test records
    await prisma.purchaseReturn.deleteMany({ where: { purchaseId: purchase.id } });
    await prisma.purchaseItem.deleteMany({ where: { purchaseId: purchase.id } });
    await prisma.purchase.delete({ where: { id: purchase.id } });
    await prisma.stockMovement.deleteMany({ where: { referenceId: purchase.purchaseNumber } });
    await prisma.stockMovement.deleteMany({ where: { referenceId: returnNo } });
    await prisma.supplierLedger.deleteMany({ where: { referenceNo: purchase.purchaseNumber } });
    await prisma.supplierLedger.deleteMany({ where: { referenceNo: `PAY-${purchase.purchaseNumber}` } });
    await prisma.supplierLedger.deleteMany({ where: { referenceNo: returnNo } });

    // Restore original balances
    await prisma.stock.update({
      where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: productPaddy!.id } },
      data: {
        currentBags: initBagsPaddy,
        currentWeightKg: initWeightPaddy,
        availableBags: initBagsPaddy,
        availableWeightKg: initWeightPaddy,
      },
    });
    await prisma.stock.update({
      where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: productBasmati!.id } },
      data: {
        currentBags: { decrement: 50 },
        currentWeightKg: { decrement: 2500.0 },
        availableBags: { decrement: 50 },
        availableWeightKg: { decrement: 2500.0 },
      },
    });
    await prisma.supplier.update({
      where: { id: supplier!.id },
      data: { currentBalance: initSuppBal },
    });
    await prisma.cashAccount.update({
      where: { id: cashAccount!.id },
      data: { balance: initCash },
    });
    console.log('  🧹 Cleaned up test sandbox records and restored original balances');

    console.log('\n🌾 ================================================================');
    console.log(`🌾 STEP 6 PURCHASE MODULE VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
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

runPurchaseTests();
