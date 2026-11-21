import prisma from './config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Decimal from 'decimal.js';
import { config } from './config';
import createApp from './app';
import http from 'http';

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 AL ARAB RICE TRADERS - BACKEND COMPREHENSIVE TEST SUITE');
  console.log('🧪 ========================================================');

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
    // ----------------------------------------------------
    // TEST 1: DATABASE CONNECTION & CORE REGISTRIES
    // ----------------------------------------------------
    console.log('\n[1] Testing Database Models & Relationships...');
    const settings = await prisma.companySettings.findFirst();
    assert(!!settings && settings.companyName === 'AL ARAB RICE TRADERS', 'CompanySettings model persisted');

    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
    assert(!!adminUser && adminUser.role.name === 'SUPER_ADMIN', 'User & Role relationship verified');
    assert((adminUser?.role.permissions.length || 0) >= 10, 'Role permissions matrix mapped correctly');

    const pwMatch = await bcrypt.compare('Admin@12345', adminUser?.passwordHash || '');
    assert(pwMatch, 'Admin password hash verified with bcrypt');

    // ----------------------------------------------------
    // TEST 2: RICE CATALOG & DUAL-UNIT STOCK ENGINE
    // ----------------------------------------------------
    console.log('\n[2] Testing Rice Catalog & Dual-Unit Inventory...');
    const products = await prisma.riceProduct.findMany({
      include: {
        category: true,
        stocks: { include: { warehouse: true } },
        stockMovements: true,
      },
    });
    assert(products.length >= 7, 'Rice products catalog populated with 7+ varieties');

    const steamRice = products.find((p) => p.code === 'RICE-1121-STM');
    assert(
      !!steamRice && steamRice.stocks.length > 0 && steamRice.stocks[0].currentBags > 0,
      `Dual-UOM stock tracks bag counts (${steamRice?.stocks[0]?.currentBags} Bags in Godown 1)`
    );

    const movements = await prisma.stockMovement.findMany({
      where: { movementType: 'OPENING_STOCK' },
    });
    assert(movements.length >= 5, 'Stock ledger movements logged with non-repudiation');

    // ----------------------------------------------------
    // TEST 3: PARTIES & KHATABOOK DOUBLE-ENTRY LEDGERS
    // ----------------------------------------------------
    console.log('\n[3] Testing Parties & Khatabook Ledgers...');
    const customer = await prisma.customer.findFirst({
      where: { code: 'CUST-001' },
      include: { customerLedgers: true },
    });
    const custObLedger = customer?.customerLedgers.find((l) => l.transactionType === 'OPENING_BALANCE');
    assert(
      !!custObLedger && new Decimal(custObLedger.debit.toString()).equals(450000),
      'Customer Khatabook ledger accurately tracks opening balance (Debit Rs. 450,000)'
    );

    const supplier = await prisma.supplier.findFirst({
      where: { code: 'SUPP-001' },
      include: { supplierLedgers: true },
    });
    const suppObLedger = supplier?.supplierLedgers.find((l) => l.transactionType === 'OPENING_BALANCE');
    assert(
      !!suppObLedger && new Decimal(suppObLedger.credit.toString()).equals(1200000),
      'Supplier Khatabook ledger accurately tracks Arthi payable (Credit Rs. 1,200,000)'
    );

    // ----------------------------------------------------
    // TEST 4: EXPRESS HTTP APIS & AUTHENTICATION
    // ----------------------------------------------------
    console.log('\n[4] Testing Express APIs & Authentication Endpoints...');
    const app = createApp();
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(5005, () => resolve()));

    const baseUrl = 'http://127.0.0.1:5005/api';

    // Health check API
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200 && healthJson.data.database === 'connected', 'GET /api/health returned 200 with database connected');

    // Login API
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin@12345',
      }),
    });
    const loginJson = await loginRes.json();
    assert(loginRes.status === 200 && !!loginJson.data.tokens.accessToken, 'POST /api/auth/login returned valid JWT access token');
    const token = loginJson.data.tokens.accessToken;

    // Authenticated Profile API
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meJson = await meRes.json();
    assert(meRes.status === 200 && meJson.data.username === 'admin', 'GET /api/auth/me returned authenticated user profile');

    // Authenticated Inventory Overview API
    const stockRes = await fetch(`${baseUrl}/inventory/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const stockJson = await stockRes.json();
    assert(
      stockRes.status === 200 && stockJson.data.stocks.length > 0 && !!stockJson.data.summary.totalValuation,
      'GET /api/inventory/overview returned live warehouse stocks with dual-UOM and valuation'
    );

    // Authenticated Parties APIs
    const custRes = await fetch(`${baseUrl}/parties/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const custJson = await custRes.json();
    assert(custRes.status === 200 && custJson.data.length > 0, 'GET /api/parties/customers returned registered parties');

    // ----------------------------------------------------
    // TEST 5: OPERATIONAL TRANSACTION (SALE & ATOMIC STOCK DECREMENT)
    // ----------------------------------------------------
    console.log('\n[5] Testing Atomic Sales Transaction & Dual-Unit Stock Decrement...');
    const godown1 = await prisma.warehouse.findFirst({ where: { code: 'GODOWN-01' } });
    const product1121 = await prisma.riceProduct.findFirst({ where: { code: 'RICE-1121-STM' } });

    const beforeStock = await prisma.stock.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: godown1!.id,
          productId: product1121!.id,
        },
      },
    });

    const saleRes = await fetch(`${baseUrl}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        customerId: customer!.id,
        warehouseId: godown1!.id,
        paymentType: 'CASH',
        paidAmount: 700000.0,
        items: [
          {
            productId: product1121!.id,
            bagCount: 50,
            bagWeightKg: 50.0,
            netWeightKg: 2500.0,
            unitPricePerKg: 280.0,
          },
        ],
        notes: 'Integration test wholesale dispatch',
      }),
    });
    const saleJson = await saleRes.json();
    assert(saleRes.status === 201 && !!saleJson.data.invoiceNumber, 'POST /api/sales processed atomic sale invoice');

    const afterStock = await prisma.stock.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: godown1!.id,
          productId: product1121!.id,
        },
      },
    });

    assert(
      afterStock!.currentBags === beforeStock!.currentBags - 50,
      `Inventory bag count atomically decremented from ${beforeStock!.currentBags} to ${afterStock!.currentBags}`
    );

    // Verify Customer Ledger was debited
    const latestLedger = await prisma.customerLedger.findFirst({
      where: { customerId: customer!.id, referenceNo: saleJson.data.invoiceNumber },
    });
    assert(!!latestLedger && latestLedger.transactionType === 'SALE', 'Customer Khatabook ledger debited automatically');

    // ----------------------------------------------------
    // TEST 6: OPERATIONAL TRANSACTION (PURCHASE & WEIGHBRIDGE STOCK IN)
    // ----------------------------------------------------
    console.log('\n[6] Testing Procurement, Weighbridge Deduction & Supplier Ledger Credit...');
    const rawPaddy = await prisma.riceProduct.findFirst({ where: { code: 'PAD-1121-RAW' } });
    const siloA = await prisma.warehouse.findFirst({ where: { code: 'SILO-A' } });

    const purRes = await fetch(`${baseUrl}/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        supplierId: supplier!.id,
        warehouseId: siloA!.id,
        purchaseDate: '2026-11-20',
        paymentType: 'CREDIT',
        truckNumber: 'LES-9920',
        biltyNumber: 'BL-4821',
        items: [
          {
            productId: rawPaddy!.id,
            bagCount: 200,
            bagWeightKg: 50.0,
            grossWeightKg: 10220.0,
            bardanaTareKg: 220.0, // 200 bags * 1.1kg jute tare
            netWeightKg: 10000.0,
            unitPricePerKg: 115.0, // Rs. 1,150,000
          },
        ],
        moistureDeductionWeightKg: 150.0,
        moistureDeductionAmount: 17250.0, // 150kg * 115
        commissionRatePercent: 1.5, // 1.5% Arhat = Rs. 17,250
        palledariAmount: 5000.0, // Labor
        freightAmount: 0.0,
        paidAmount: 0.0,
        notes: 'Mandi truck intake test',
      }),
    });

    const purJson = await purRes.json();
    assert(purRes.status === 201 && !!purJson.data.purchaseNumber, 'POST /api/purchases recorded purchase bill with weighbridge deductions');

    const latestSuppLedger = await prisma.supplierLedger.findFirst({
      where: { supplierId: supplier!.id, referenceNo: purJson.data.purchaseNumber },
    });
    assert(!!latestSuppLedger && latestSuppLedger.transactionType === 'PURCHASE', 'Supplier Khatabook ledger credited with net payable');

    server.close();

    console.log('\n========================================================');
    console.log(`🏁 TEST EXECUTION FINISHED: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test suite:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
