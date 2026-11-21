import Decimal from 'decimal.js';

const API_BASE = 'http://localhost:5000/api';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    console.log(`\x1b[32m✔ [PASS]\x1b[0m ${name}`);
    results.push({ name, passed: true });
  } else {
    console.error(`\x1b[31m✘ [FAIL]\x1b[0m ${name}${details ? ': ' + details : ''}`);
    results.push({ name, passed: false, details });
  }
}

async function runTests() {
  console.log('\n==================================================================');
  console.log(' AL ARAB RICE TRADERS - STEP 9 ADVANCED ENTERPRISE TEST SUITE ');
  console.log('==================================================================\n');

  try {
    // 1. Authenticate
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@12345' }),
    });
    const loginData = (await loginRes.json()) as any;
    const token = loginData.data?.tokens?.accessToken;
    assert(!!token, '1. Admin Authentication Successful');

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 2. Fetch Master Warehouses & Products
    const [whRes, prodRes] = await Promise.all([
      fetch(`${API_BASE}/inventory/warehouses`, { headers: authHeaders }),
      fetch(`${API_BASE}/inventory/products`, { headers: authHeaders }),
    ]);
    const warehouses = ((await whRes.json()) as any).data || [];
    const products = ((await prodRes.json()) as any).data || [];

    assert(warehouses.length >= 2, '2. At least two warehouses available for transfer tests');
    assert(products.length >= 2, '3. Rice products catalog available for milling & export');

    const wh1 = warehouses[0];
    const wh2 = warehouses[1];
    const rawPaddyProd = products[0];
    const finishedRiceProd = products[1] || products[0];

    // Ensure raw paddy stock exists in wh1 for milling test
    await fetch(`${API_BASE}/inventory/adjustments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        warehouseId: wh1.id,
        productId: rawPaddyProd.id,
        type: 'SURPLUS',
        quantityBags: 100,
        weightKg: 5000,
        reason: 'Raw paddy test batch baseline allocation',
      }),
    });

    // =========================================================================
    // SECTION A: RICE MILLING & PRODUCTION BATCH
    // =========================================================================
    console.log('\n--- [A] Testing Rice Milling & Production Batch ---');

    const inputWeight = 3000; // 3000 Kg raw paddy
    const headRiceWeight = 1800; // 60% recovery
    const brokenRiceWeight = 450; // 15% broken
    const branWeight = 300; // 10% bran
    const huskWeight = 300; // 10% husk
    const wastageWeight = 150; // 5% dust/moisture loss

    const millingRes = await fetch(`${API_BASE}/production/batches`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        warehouseId: wh1.id,
        startDate: new Date().toISOString(),
        notes: 'Commercial Milling Run #01 - Super Basmati Paddy',
        processingLaborCost: 15000,
        electricityPowerCost: 20000,
        otherMillingCost: 5000,
        inputs: [
          {
            productId: rawPaddyProd.id,
            bagCount: 60,
            weightKg: inputWeight,
            unitCostPerKg: 120, // Rs 120/Kg
          },
        ],
        outputs: [
          {
            productId: finishedRiceProd.id,
            outputType: 'HEAD_RICE',
            bagCount: 36,
            weightKg: headRiceWeight,
            unitCostPerKg: 240, // Rs 240/Kg
          },
          {
            productId: finishedRiceProd.id,
            outputType: 'BROKEN_RICE',
            bagCount: 9,
            weightKg: brokenRiceWeight,
            unitCostPerKg: 130, // Rs 130/Kg
          },
          {
            productId: finishedRiceProd.id,
            outputType: 'BRAN',
            bagCount: 6,
            weightKg: branWeight,
            unitCostPerKg: 65, // Rs 65/Kg
          },
          {
            productId: finishedRiceProd.id,
            outputType: 'HUSK',
            bagCount: 6,
            weightKg: huskWeight,
            unitCostPerKg: 20, // Rs 20/Kg
          },
          {
            productId: finishedRiceProd.id,
            outputType: 'WASTAGE',
            bagCount: 0,
            weightKg: wastageWeight,
            unitCostPerKg: 0,
          },
        ],
      }),
    });

    const millingData = ((await millingRes.json()) as any).data;
    assert(millingRes.status === 201 && !!millingData?.id, '4. Milling Batch Created & Processed', `Batch: ${millingData?.batchNumber}`);

    assert(
      Number(millingData?.yieldPercentage) === 100 && Number(millingData?.headRiceYieldPct) === 60,
      '5. Yield Percentage (100%) and Head Rice Yield (60%) Correctly Calculated'
    );

    assert(
      Number(millingData?.totalProcessingCost) === 40000,
      '6. Attributable Processing Costs (Labor + Power + Other) Reconciled',
      `Cost: Rs ${millingData?.totalProcessingCost}`
    );

    assert(
      Number(millingData?.netBatchProfit) > 0,
      '7. Batch Net Milling Profitability Calculated Positively',
      `Profit: Rs ${millingData?.netBatchProfit}`
    );

    // Fetch Milling Analytics
    const analyticsRes = await fetch(`${API_BASE}/production/batches/analytics`, { headers: authHeaders });
    const analyticsData = ((await analyticsRes.json()) as any).data;
    assert(
      analyticsRes.status === 200 && Number(analyticsData?.totalCrushedKg) >= inputWeight,
      '8. Overall Milling Yield Analytics Aggregated Across Batches'
    );

    // =========================================================================
    // SECTION B: COMMISSION AGENTS & ARTHI BROKERAGE
    // =========================================================================
    console.log('\n--- [B] Testing Commission Agents & Brokerage ---');

    // 1. Create Agent
    const agentRes = await fetch(`${API_BASE}/commission/agents`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Chaudhry Riaz (Kamoke Mandi Broker)',
        phone: '0300-8877665',
        mandiCity: 'Kamoke Grain Market',
        commissionType: 'PERCENTAGE',
        defaultRate: 1.5,
        openingBalance: 0,
        notes: 'Senior rice broker for local mandi purchases and wholesale despatches',
      }),
    });
    const agent = ((await agentRes.json()) as any).data;
    assert(agentRes.status === 201 && !!agent?.id, '9. Commission Agent Profile Registered', `Agent: ${agent?.name}`);

    // 2. Accrue Commission on a Sale
    const commTxRes = await fetch(`${API_BASE}/commission/transactions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        agentId: agent.id,
        referenceType: 'SALE',
        referenceNo: 'INV-2026-901',
        baseAmount: 1200000, // Rs 1.2M sale
        rateType: 'PERCENTAGE',
        rateValue: 1.5,
        notes: '1.5% brokerage on 500 bags Basmati sale to Karachi',
      }),
    });
    const commTx = ((await commTxRes.json()) as any).data;
    assert(
      commTxRes.status === 201 && Number(commTx?.commissionAmount) === 18000,
      '10. Commission Accrued Accurately (1.5% of 1.2M = Rs 18,000)'
    );

    // Verify Agent Balance
    const agentAfterAccrualRes = await fetch(`${API_BASE}/commission/agents/${agent.id}`, { headers: authHeaders });
    const agentAfterAccrual = ((await agentAfterAccrualRes.json()) as any).data;
    assert(
      Number(agentAfterAccrual?.currentBalance) === 18000,
      '11. Commission Agent Balance Payable Incremented to Rs 18,000'
    );

    // 3. Disburse Commission Payment via Cash Drawer
    const cashAccsRes = await fetch(`${API_BASE}/accounting/cash-accounts`, { headers: authHeaders });
    const primaryCash = ((await cashAccsRes.json()) as any).data[0];

    const commPayRes = await fetch(`${API_BASE}/commission/payments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        agentId: agent.id,
        amount: 10000,
        paymentMethod: 'CASH',
        cashAccountId: primaryCash.id,
        referenceNumber: 'VOUCHER-COMM-01',
        notes: 'Partial payment of brokerage against Karachi invoice',
      }),
    });
    const commPay = ((await commPayRes.json()) as any).data;
    assert(commPayRes.status === 201 && !!commPay?.id, '12. Commission Payment Disbursed from Cash Drawer');

    // Verify Agent Remaining Balance
    const agentAfterPayRes = await fetch(`${API_BASE}/commission/agents/${agent.id}`, { headers: authHeaders });
    const agentAfterPay = ((await agentAfterPayRes.json()) as any).data;
    assert(
      Number(agentAfterPay?.currentBalance) === 8000,
      '13. Agent Balance Payable Decremented (18,000 - 10,000 = Rs 8,000)'
    );

    // 4. Retrieve Agent Statement
    const stmtRes = await fetch(`${API_BASE}/commission/agents/${agent.id}/statement`, { headers: authHeaders });
    const stmt = ((await stmtRes.json()) as any).data;
    assert(
      stmtRes.status === 200 && stmt?.statement?.length >= 2 && Number(stmt?.closingBalancePayable) === 8000,
      '14. Commission Agent Running Ledger Statement Verified'
    );

    // =========================================================================
    // SECTION C: INTERNATIONAL RICE EXPORT
    // =========================================================================
    console.log('\n--- [C] Testing International Rice Export Management ---');

    // 1. Create Export Buyer
    const expCustRes = await fetch(`${API_BASE}/export/customers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        companyName: 'Al-Qasim Foodstuffs Trading LLC',
        country: 'United Arab Emirates',
        contactPerson: 'Tariq Al-Mansoor',
        email: 'procurement@alqasimfoods.ae',
        phone: '+971-4-8899221',
        address: 'Al Ras, Deira, Dubai, UAE',
        preferredCurrency: 'USD',
        destinationPort: 'Jebel Ali Port, Dubai',
        paymentTerms: '100% Confirmed Irrevocable L/C at Sight',
      }),
    });
    const expCust = ((await expCustRes.json()) as any).data;
    assert(expCustRes.status === 201 && !!expCust?.id, '15. Export Customer (Dubai Buyer) Registered');

    // 2. Create Export Invoice: 25 Metric Tons @ $1,150 / MT = $28,750
    const fxRate = 280.0;
    const expInvRes = await fetch(`${API_BASE}/export/invoices`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        exportCustomerId: expCust.id,
        warehouseId: wh1.id,
        currency: 'USD',
        exchangeRate: fxRate,
        contractNo: 'CNT-DUBAI-2026/08',
        incoterm: 'FOB',
        portOfLoading: 'Karachi Port, Pakistan',
        portOfDischarge: 'Jebel Ali Port, Dubai',
        containerNumber: 'MSCU-892104-5',
        blNumber: 'MEDU-DXB-9921',
        shippingLine: 'MSC Mediterranean Shipping',
        items: [
          {
            productId: finishedRiceProd.id,
            bagType: 'PP Non-Woven 40KG Export Bag',
            bagWeightKg: 40,
            bagCount: 625, // 625 bags * 40 kg = 25,000 kg = 25 MT
            totalWeightKg: 25000,
            totalWeightMt: 25,
            ratePerMtFcy: 1150, // $1,150 / MT
            grainLengthMm: 8.35,
            moisturePct: 12.0,
            brokenPct: 1.0,
          },
        ],
      }),
    });
    const expInv = ((await expInvRes.json()) as any).data;
    const expectedFcy = 25 * 1150; // $28,750
    const expectedPkr = expectedFcy * fxRate; // Rs 8,050,000

    assert(
      expInvRes.status === 201 &&
      Number(expInv?.totalFcyAmount) === expectedFcy &&
      Number(expInv?.totalPkrAmount) === expectedPkr,
      '16. Export Invoice Generated: $28,750.00 (Rs 8,050,000.00 @ Rs 280/USD)'
    );

    // 3. Realize Foreign Remittance with Exchange Rate Gain
    const bankAccsRes = await fetch(`${API_BASE}/accounting/bank-accounts`, { headers: authHeaders });
    const primaryBank = ((await bankAccsRes.json()) as any).data[0];

    const remittanceFcy = 15000; // $15,000 partial advance realization
    const realizedRate = 282.5; // Realized at Rs 282.50 (FX Gain of Rs 2.50 per USD)
    const bankCharges = 12000; // Rs 12,000 swift deduction

    const expPayRes = await fetch(`${API_BASE}/export/payments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        exportInvoiceId: expInv.id,
        amountFcy: remittanceFcy,
        realizedExchangeRate: realizedRate,
        bankChargesPkr: bankCharges,
        bankAccountId: primaryBank.id,
        bankRefNo: 'SWIFT-FEX-89021',
        notes: 'Realization of export proceeds under L/C # 9921-LC',
      }),
    });
    const expPay = ((await expPayRes.json()) as any).data;
    const expectedFxGain = remittanceFcy * (realizedRate - fxRate); // $15,000 * 2.5 = Rs 37,500

    assert(
      expPayRes.status === 201 &&
      Number(expPay?.exchangeGainLossPkr) === expectedFxGain,
      '17. Export Remittance Realized with Foreign Exchange Gain (Rs 37,500.00)'
    );

    // Verify Export Customer Remaining Balance
    const expCustAfterPayRes = await fetch(`${API_BASE}/export/customers/${expCust.id}`, { headers: authHeaders });
    const expCustAfterPay = ((await expCustAfterPayRes.json()) as any).data;
    assert(
      Number(expCustAfterPay?.currentReceivableFcy) === expectedFcy - remittanceFcy,
      '18. Export Customer Receivable Reduced in FCY ($13,750 remaining)'
    );

    // =========================================================================
    // SECTION D: INTER-WAREHOUSE TRANSFERS & RECONCILIATION
    // =========================================================================
    console.log('\n--- [D] Testing Inter-Warehouse Transfers & Reconciliation ---');

    // 1. Dispatch Transfer from wh1 to wh2
    const trfRes = await fetch(`${API_BASE}/warehouse-transfers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        fromWarehouseId: wh1.id,
        toWarehouseId: wh2.id,
        driverName: 'Muhammad Younas',
        vehicleNumber: 'LES-8921',
        biltyNumber: 'BLT-7721',
        notes: 'Inter-godown stock replenishment for export packing line',
        items: [
          {
            productId: finishedRiceProd.id,
            sentBags: 40,
            sentWeightKg: 2000,
          },
        ],
      }),
    });
    const trf = ((await trfRes.json()) as any).data;
    assert(
      trfRes.status === 201 && trf?.status === 'IN_TRANSIT' && Number(trf?.totalWeightKg) === 2000,
      '19. Inter-Warehouse Transfer Dispatched (2000 Kg in Transit)'
    );

    // 2. Receive Transfer at wh2 with 15 Kg in-transit spillage
    const receivedBags = 40;
    const receivedWeight = 1985; // 15 Kg shrinkage
    const receiveRes = await fetch(`${API_BASE}/warehouse-transfers/${trf.id}/receive`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        notes: 'Received at destination godown with minor bag tear spillage',
        receivedItems: [
          {
            itemId: trf.items[0].id,
            productId: finishedRiceProd.id,
            receivedBags,
            receivedWeightKg: receivedWeight,
          },
        ],
      }),
    });
    const receivedTrf = ((await receiveRes.json()) as any).data;
    assert(
      receiveRes.status === 200 &&
      receivedTrf?.status === 'RECEIVED' &&
      Number(receivedTrf?.transitLossWeightKg) === 15,
      '20. Transfer Received with 15 Kg In-Transit Loss Audited'
    );

    // 3. Stock Reconciliation Audit in wh2
    const reconRes = await fetch(`${API_BASE}/warehouse-transfers/reconcile`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        warehouseId: wh2.id,
        productId: finishedRiceProd.id,
        physicalBags: 50,
        physicalWeightKg: 2500,
        reason: 'Monthly physical warehouse weighing & count reconciliation',
      }),
    });
    const reconData = ((await reconRes.json()) as any).data;
    assert(
      reconRes.status === 200 && !!reconData?.variance,
      '21. Physical Stock Count Reconciliation Audit Executed & Logged'
    );

    // =========================================================================
    // SECTION E: CONFIGURABLE FEATURE TOGGLES
    // =========================================================================
    console.log('\n--- [E] Testing Enterprise Feature Toggles ---');

    const settingsUpdateRes = await fetch(`${API_BASE}/settings/company`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        enableMilling: true,
        enableCommission: true,
        enableExport: true,
        enableMultiWarehouse: true,
      }),
    });
    const updatedSettings = ((await settingsUpdateRes.json()) as any).data;
    assert(
      settingsUpdateRes.status === 200 &&
      updatedSettings?.enableMilling === true &&
      updatedSettings?.enableCommission === true &&
      updatedSettings?.enableExport === true,
      '22. Independent Enterprise Feature Toggles Configured & Verified'
    );

  } catch (error: any) {
    console.error('Test execution error:', error);
    assert(false, 'Test Suite Execution Failed', error.message);
  }

  console.log('\n==================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`  ADVANCED SUITE SUMMARY: ${passedCount} / ${results.length} Tests Passed`);
  console.log('==================================================================\n');

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runTests();
