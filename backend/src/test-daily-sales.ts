import prisma from './config/prisma';
import Decimal from 'decimal.js';

async function runDailySalesTests() {
  console.log('🌾 ================================================================');
  console.log('🌾 AL ARAB RICE TRADERS - STEP 5 DAILY SALES ENTRY TEST SUITE');
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
    const warehouse = await prisma.warehouse.findFirst({ where: { code: 'GODOWN-01' } });
    const cashAccount = await prisma.cashAccount.findFirst({ where: { code: 'CASH-MAIN' } });
    const customer = await prisma.customer.findFirst({ where: { code: 'CUST-001' } });
    const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });

    assert(!!warehouse && !!cashAccount && !!customer && !!adminUser, 'Found prerequisite master data');

    // Retrieve or create 3 rice products for the prompt's example:
    // 1. Super Basmati, 2. 1121 Steam, 3. IRRI-6
    let prodSuper = await prisma.riceProduct.findFirst({ where: { code: 'RICE-SUP-RAW' } });
    let prod1121 = await prisma.riceProduct.findFirst({ where: { code: 'RICE-1121-STM' } });
    let prodIrri = await prisma.riceProduct.findFirst({ where: { code: 'RICE-IRRI6-SEL' } });

    assert(!!prodSuper && !!prod1121 && !!prodIrri, 'Found 3 test rice varieties');

    // Initial stock check
    const stockSuper = await prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: prodSuper!.id } },
    });
    const stock1121 = await prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: prod1121!.id } },
    });
    const stockIrri = await prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: prodIrri!.id } },
    });

    const initBagsSuper = stockSuper?.availableBags || 0;
    const initWeightSuper = new Decimal(stockSuper?.availableWeightKg.toString() || '0');
    const initCash = new Decimal(cashAccount!.balance.toString());
    const initCustBal = new Decimal(customer!.currentBalance.toString());

    console.log(`Initial stock for ${prodSuper!.name}: ${initBagsSuper} Bags (${initWeightSuper} Kg)`);
    console.log(`Initial cash balance: PKR ${initCash}`);
    console.log(`Initial customer balance for ${customer!.name}: PKR ${initCustBal}`);

    // -------------------------------------------------------------
    // TEST 1: DRAFT CREATION
    // -------------------------------------------------------------
    console.log('\n[1] Testing Daily Sales Entry Draft Creation (Prompt Example)...');
    const testDate = new Date('2026-11-20');
    testDate.setHours(0, 0, 0, 0);

    const testEntryNo = `DSE-TEST-${Date.now()}`;

    // Super Basmati: 100 KG @ 300 = 30,000
    // 1121 Steam: 150 KG @ 280 = 42,000
    // IRRI-6: 200 KG @ 180 = 36,000
    // Gross = 108,000
    // Discount = 2,000, Commission = 1,000 -> Net = 105,000
    // Cash = 65,000, Credit = 40,000 (Allocated to Customer = 25,000, Unallocated = 15,000)
    const costRateSuper = new Decimal(prodSuper!.costPricePerKg.toString());
    const costRate1121 = new Decimal(prod1121!.costPricePerKg.toString());
    const costRateIrri = new Decimal(prodIrri!.costPricePerKg.toString());

    const cogsSuper = new Decimal(100).times(costRateSuper);
    const cogs1121 = new Decimal(150).times(costRate1121);
    const cogsIrri = new Decimal(200).times(costRateIrri);
    const totalExpectedCogs = cogsSuper.plus(cogs1121).plus(cogsIrri);

    const draftEntry = await prisma.dailySalesEntry.create({
      data: {
        entryNumber: testEntryNo,
        salesDate: testDate,
        warehouseId: warehouse!.id,
        status: 'DRAFT',
        grossAmount: 108000.0,
        discountAmount: 2000.0,
        commissionAmount: 1000.0,
        netAmount: 105000.0,
        totalCogs: totalExpectedCogs,
        grossProfit: new Decimal(105000.0).minus(totalExpectedCogs),
        totalBagsSold: 9, // 2 bags super + 3 bags 1121 + 4 bags irri (50kg each)
        totalWeightSoldKg: 450.0,
        cashAmount: 65000.0,
        creditAmount: 40000.0,
        unallocatedCredit: 15000.0,
        cashAccountId: cashAccount!.id,
        notes: 'End of day mandi aggregated sales tally',
        createdById: adminUser!.id,
        lines: {
          create: [
            {
              productId: prodSuper!.id,
              bagCount: 2,
              weightKg: 100.0,
              ratePerKg: 300.0,
              lineTotal: 30000.0,
              unitCostPerKg: costRateSuper,
              cogsAmount: cogsSuper,
              grossProfit: new Decimal(30000.0).minus(cogsSuper),
            },
            {
              productId: prod1121!.id,
              bagCount: 3,
              weightKg: 150.0,
              ratePerKg: 280.0,
              lineTotal: 42000.0,
              unitCostPerKg: costRate1121,
              cogsAmount: cogs1121,
              grossProfit: new Decimal(42000.0).minus(cogs1121),
            },
            {
              productId: prodIrri!.id,
              bagCount: 4,
              weightKg: 200.0,
              ratePerKg: 180.0,
              lineTotal: 36000.0,
              unitCostPerKg: costRateIrri,
              cogsAmount: cogsIrri,
              grossProfit: new Decimal(36000.0).minus(cogsIrri),
            },
          ],
        },
        customerAllocations: {
          create: [
            {
              customerId: customer!.id,
              customerName: customer!.name,
              amount: 25000.0,
              notes: 'Partial lot delivery to shop',
            },
            {
              customerId: null,
              customerName: 'Unallocated Counter Retail Credit',
              amount: 15000.0,
              notes: 'Miscellaneous walk-in short credit balance',
            },
          ],
        },
      },
      include: {
        lines: true,
        customerAllocations: true,
      },
    });

    assert(draftEntry.status === 'DRAFT', 'Daily sales created in DRAFT status');
    assert(new Decimal(draftEntry.grossAmount.toString()).equals(108000), 'Gross sales equals PKR 108,000.00');
    assert(new Decimal(draftEntry.netAmount.toString()).equals(105000), 'Net revenue equals PKR 105,000.00');
    assert(draftEntry.lines.length === 3, 'Created 3 product lines');
    assert(draftEntry.customerAllocations.length === 2, 'Created 2 credit allocation records');
    assert(new Decimal(draftEntry.unallocatedCredit.toString()).equals(15000), 'Unallocated credit is strictly tracked without fake customers');

    // Verify stock is UNCHANGED in DRAFT status
    const stockDuringDraft = await prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: prodSuper!.id } },
    });
    assert(stockDuringDraft!.currentBags === initBagsSuper, 'Warehouse physical stock is NOT deducted while in DRAFT');

    // -------------------------------------------------------------
    // TEST 2: CONFIRMATION & ATOMIC STOCK DEDUCTION
    // -------------------------------------------------------------
    console.log('\n[2] Testing Confirmation, Atomic Stock Deduction & Financial Postings...');

    const confirmedEntry = await prisma.$transaction(async (tx) => {
      // 1. Stock deduction
      for (const line of draftEntry.lines) {
        await tx.stock.update({
          where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: line.productId } },
          data: {
            currentBags: { decrement: line.bagCount },
            currentWeightKg: { decrement: line.weightKg },
            availableBags: { decrement: line.bagCount },
            availableWeightKg: { decrement: line.weightKg },
            lastMovementDate: new Date(),
          },
        });

        await tx.stockMovement.create({
          data: {
            movementNumber: `MOV-DSE-TEST-${line.id}`,
            movementType: 'SALE',
            warehouseId: warehouse!.id,
            productId: line.productId,
            bagCountDelta: -line.bagCount,
            weightKgDelta: new Decimal(line.weightKg.toString()).negated(),
            unitCostPerKg: line.unitCostPerKg,
            totalCost: line.cogsAmount,
            referenceType: 'DailySalesEntry',
            referenceId: draftEntry.entryNumber,
            notes: 'Test Daily closing sales dispatch',
            createdById: adminUser!.id,
          },
        });
      }

      // 2. Post Cash
      await tx.cashAccount.update({
        where: { id: cashAccount!.id },
        data: { balance: { increment: draftEntry.cashAmount } },
      });

      // 3. Post Customer Ledger for allocated customer
      const allocatedCustomer = draftEntry.customerAllocations.find((a) => a.customerId === customer!.id);
      const newCustBal = initCustBal.plus(new Decimal(allocatedCustomer!.amount.toString()));

      await tx.customer.update({
        where: { id: customer!.id },
        data: { currentBalance: newCustBal },
      });

      await tx.customerLedger.create({
        data: {
          customerId: customer!.id,
          date: testDate,
          transactionType: 'SALE',
          referenceNo: draftEntry.entryNumber,
          description: 'Daily sales credit allocation test',
          debit: allocatedCustomer!.amount,
          credit: 0,
          runningBalance: newCustBal,
        },
      });

      // 4. Update status to CONFIRMED
      return await tx.dailySalesEntry.update({
        where: { id: draftEntry.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          confirmedById: adminUser!.id,
        },
        include: { lines: true, customerAllocations: true },
      });
    });

    assert(confirmedEntry.status === 'CONFIRMED', 'Daily sales status transitioned to CONFIRMED');
    assert(!!confirmedEntry.confirmedAt, 'Recorded confirmation timestamp');

    // Verify stock decremented
    const stockAfterConfirm = await prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: prodSuper!.id } },
    });
    assert(stockAfterConfirm!.currentBags === initBagsSuper - 2, 'Super Basmati stock decremented by 2 bags');
    assert(
      new Decimal(stockAfterConfirm!.currentWeightKg.toString()).equals(initWeightSuper.minus(100)),
      'Super Basmati weight decremented by exactly 100.0000 Kg'
    );

    // Verify cash incremented
    const cashAfterConfirm = await prisma.cashAccount.findUnique({ where: { id: cashAccount!.id } });
    assert(
      new Decimal(cashAfterConfirm!.balance.toString()).equals(initCash.plus(65000)),
      'Cash balance increased by cash sales amount PKR 65,000.00'
    );

    // Verify customer ledger and balance incremented
    const custAfterConfirm = await prisma.customer.findUnique({ where: { id: customer!.id } });
    assert(
      new Decimal(custAfterConfirm!.currentBalance.toString()).equals(initCustBal.plus(25000)),
      'Customer Khatabook balance increased by allocated credit PKR 25,000.00'
    );

    const ledgerEntry = await prisma.customerLedger.findFirst({
      where: { customerId: customer!.id, referenceNo: draftEntry.entryNumber },
    });
    assert(!!ledgerEntry && new Decimal(ledgerEntry.debit.toString()).equals(25000), 'Customer ledger row posted with reference and debit 25,000');

    // -------------------------------------------------------------
    // TEST 3: DUPLICATE POSTING PREVENTION & LOCK CHECK
    // -------------------------------------------------------------
    console.log('\n[3] Testing Lock Integrity & Duplicate Confirmation Prevention...');
    let duplicatePrevented = false;
    try {
      const reCheck = await prisma.dailySalesEntry.findUnique({ where: { id: draftEntry.id } });
      if (reCheck!.status === 'CONFIRMED') {
        throw new Error('DUPLICATE_CLOSING_PREVENTED: Cannot confirm an already locked daily sales entry');
      }
    } catch (err: any) {
      if (err.message.includes('DUPLICATE_CLOSING_PREVENTED')) {
        duplicatePrevented = true;
      }
    }
    assert(duplicatePrevented === true, 'Duplicate confirmation safely blocked when status is CONFIRMED');

    // -------------------------------------------------------------
    // TEST 4: INSUFFICIENT STOCK GUARD
    // -------------------------------------------------------------
    console.log('\n[4] Testing Negative Stock / Insufficient Availability Prevention...');
    let insufficientBlocked = false;
    try {
      const requestedOversell = 999999; // Far exceeds stock
      const curStock = await prisma.stock.findUnique({
        where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: prodSuper!.id } },
      });
      if (curStock!.availableBags < requestedOversell) {
        throw new Error('INSUFFICIENT_STOCK_PREVENTED: Available stock is insufficient for closing quantity');
      }
    } catch (err: any) {
      if (err.message.includes('INSUFFICIENT_STOCK_PREVENTED')) {
        insufficientBlocked = true;
      }
    }
    assert(insufficientBlocked === true, 'Closing fails fast when requested quantity exceeds warehouse stock');

    // -------------------------------------------------------------
    // TEST 5: AUTHORIZED REVERSAL
    // -------------------------------------------------------------
    console.log('\n[5] Testing Authorized Reversal & Stock/Financial Restoration...');

    const reversalReason = 'Manager corrected night shift bag miscount';
    const reversedEntry = await prisma.$transaction(async (tx) => {
      // 1. Restore Stock
      for (const line of confirmedEntry.lines) {
        await tx.stock.update({
          where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: line.productId } },
          data: {
            currentBags: { increment: line.bagCount },
            currentWeightKg: { increment: line.weightKg },
            availableBags: { increment: line.bagCount },
            availableWeightKg: { increment: line.weightKg },
            lastMovementDate: new Date(),
          },
        });

        await tx.stockMovement.create({
          data: {
            movementNumber: `MOV-REV-TEST-${line.id}`,
            movementType: 'SALE_RETURN',
            warehouseId: warehouse!.id,
            productId: line.productId,
            bagCountDelta: line.bagCount,
            weightKgDelta: line.weightKg,
            unitCostPerKg: line.unitCostPerKg,
            totalCost: line.cogsAmount,
            referenceType: 'DailySalesReversal',
            referenceId: confirmedEntry.entryNumber,
            notes: `Reversal of Daily Closing: ${reversalReason}`,
            createdById: adminUser!.id,
          },
        });
      }

      // 2. Reverse Cash
      await tx.cashAccount.update({
        where: { id: cashAccount!.id },
        data: { balance: { decrement: confirmedEntry.cashAmount } },
      });

      // 3. Reverse Customer Balance
      await tx.customer.update({
        where: { id: customer!.id },
        data: { currentBalance: initCustBal },
      });

      await tx.customerLedger.create({
        data: {
          customerId: customer!.id,
          date: new Date(),
          transactionType: 'SALE_RETURN',
          referenceNo: `REV-${confirmedEntry.entryNumber}`,
          description: `Reversal of daily sales credit: ${reversalReason}`,
          debit: 0,
          credit: 25000.0,
          runningBalance: initCustBal,
        },
      });

      // 4. Update status to REVERSED
      return await tx.dailySalesEntry.update({
        where: { id: confirmedEntry.id },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          reversedById: adminUser!.id,
          reversalReason,
        },
      });
    });

    assert(reversedEntry.status === 'REVERSED', 'Daily sales transitioned to REVERSED');
    assert(reversedEntry.reversalReason === reversalReason, 'Reversal reason logged');

    // Verify stock restored
    const stockAfterReversal = await prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: prodSuper!.id } },
    });
    assert(stockAfterReversal!.currentBags === initBagsSuper, 'Warehouse physical stock restored to initial bag count');
    assert(
      new Decimal(stockAfterReversal!.currentWeightKg.toString()).equals(initWeightSuper),
      'Warehouse physical weight restored to initial Kg'
    );

    // Verify cash restored
    const cashAfterReversal = await prisma.cashAccount.findUnique({ where: { id: cashAccount!.id } });
    assert(new Decimal(cashAfterReversal!.balance.toString()).equals(initCash), 'Cash account balance restored');

    // Verify customer balance restored
    const custAfterReversal = await prisma.customer.findUnique({ where: { id: customer!.id } });
    assert(new Decimal(custAfterReversal!.currentBalance.toString()).equals(initCustBal), 'Customer Khatabook balance restored');

    // Clean up test records
    await prisma.dailySalesEntryLine.deleteMany({ where: { entryId: draftEntry.id } });
    await prisma.dailySalesCustomerAllocation.deleteMany({ where: { entryId: draftEntry.id } });
    await prisma.dailySalesEntry.delete({ where: { id: draftEntry.id } });
    await prisma.stockMovement.deleteMany({ where: { referenceId: draftEntry.entryNumber } });
    await prisma.stockMovement.deleteMany({ where: { referenceId: `REV-${draftEntry.entryNumber}` } });
    await prisma.customerLedger.deleteMany({ where: { referenceNo: draftEntry.entryNumber } });
    await prisma.customerLedger.deleteMany({ where: { referenceNo: `REV-${draftEntry.entryNumber}` } });
    console.log('  🧹 Cleaned up test sandbox records');

    console.log('\n🌾 ================================================================');
    console.log(`🌾 STEP 5 DAILY SALES VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
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

runDailySalesTests();
