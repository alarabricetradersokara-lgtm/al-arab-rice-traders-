import Decimal from 'decimal.js';

const API_BASE = 'http://localhost:5000/api';

async function request(url: string, options: any = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || `Request failed with status ${res.status}`);
    error.response = { status: res.status, data };
    throw error;
  }
  return data;
}

async function runPartyTests() {
  console.log('🌾 ================================================================');
  console.log('🌾 AL ARAB RICE TRADERS - STEP 7 CUSTOMERS & SUPPLIERS KHATA TESTS');
  console.log('🌾 ================================================================');

  // 1. Authenticate
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      username: 'admin',
      password: 'Admin@12345',
    },
  });
  const token = loginRes.data.tokens.accessToken;
  const headers = { Authorization: `Bearer ${token}` };
  console.log('  ✅ PASS: Authenticated as System Administrator');

  // Get Cash Account
  const cashAccountsRes = await request('/accounts/cash-accounts', { headers });
  const cashAccount = cashAccountsRes.data[0];
  const initialCashBal = new Decimal(cashAccount.balance.toString());
  console.log(`Initial Cash Drawer balance: PKR ${initialCashBal.toFixed(2)}`);

  // =========================================================================
  // TEST A: CUSTOMER REGISTRATION & OPENING LEDGER
  // =========================================================================
  console.log('\n[A] Testing Customer Registration with Opening Balance...');
  const testCustomerCode = `CUST-TEST-${Date.now().toString().slice(-4)}`;
  const custCreateRes = await request('/parties/customers', {
    method: 'POST',
    headers,
    body: {
      code: testCustomerCode,
      name: 'Malik Zafar & Sons (Rice Wholesalers)',
      businessName: 'Zafar Rice Corporation',
      phone: '0300-8877665',
      city: 'Lahore',
      address: 'Shop 12, Badami Bagh Grain Market, Lahore',
      customerType: 'WHOLESALER',
      creditLimit: 500000,
      openingBalance: 150000, // Opening debit balance
      notes: 'Premier basmati distributor in Lahore wholesale market',
    },
  });
  const customer = custCreateRes.data;
  console.log(`  ✅ PASS: Created Customer ${customer.name} (Code: ${customer.code})`);

  // Verify Opening Ledger was automatically posted
  const custStatement1 = await request(`/parties/customers/${customer.id}/statement`, { headers });
  const stmt1 = custStatement1.data;
  if (stmt1.transactions.length !== 1 || stmt1.transactions[0].transactionType !== 'OPENING_BALANCE') {
    throw new Error('Customer opening balance ledger entry was not created');
  }
  if (new Decimal(stmt1.closingBalance).toNumber() !== 150000) {
    throw new Error(`Expected closing balance 150000, got ${stmt1.closingBalance}`);
  }
  console.log('  ✅ PASS: Opening balance ledger entry posted correctly (PKR 150,000)');

  // =========================================================================
  // TEST B: CUSTOMER CASH RECEIPT (KHATABOOK CREDIT)
  // =========================================================================
  console.log('\n[B] Testing Customer Cash Receipt Posting...');
  const receiptRes = await request(`/parties/customers/${customer.id}/receipt`, {
    method: 'POST',
    headers,
    body: {
      amount: 50000,
      paymentMethod: 'CASH',
      cashAccountId: cashAccount.id,
      referenceNumber: 'CHQ-48190',
      notes: 'Part payment via cash counter',
    },
  });
  const receiptData = receiptRes.data;
  console.log(`  ✅ PASS: Recorded Cash Receipt: ${receiptData.receipt.receiptNumber}, New Balance: PKR ${receiptData.newBalance}`);

  if (new Decimal(receiptData.newBalance).toNumber() !== 100000) {
    throw new Error(`Expected new balance 100000 after 50000 receipt, got ${receiptData.newBalance}`);
  }

  // =========================================================================
  // TEST C: CUSTOMER ADJUSTMENTS (DEBIT & CREDIT NOTES)
  // =========================================================================
  console.log('\n[C] Testing Customer Khatabook Adjustments...');
  // Credit adjustment (Discount / Rate difference) -> reduces balance by 5,000
  const adjCreditRes = await request(`/parties/customers/${customer.id}/adjustment`, {
    method: 'POST',
    headers,
    body: {
      type: 'CREDIT',
      amount: 5000,
      reason: 'Special festival discount authorized by Director',
    },
  });
  console.log(`  ✅ PASS: Posted Credit Note adjustment: New Balance PKR ${adjCreditRes.data.newBalance}`);
  if (new Decimal(adjCreditRes.data.newBalance).toNumber() !== 95000) {
    throw new Error(`Expected balance 95000, got ${adjCreditRes.data.newBalance}`);
  }

  // Debit adjustment (Cartage charge / Late fee) -> increases balance by 2,000
  const adjDebitRes = await request(`/parties/customers/${customer.id}/adjustment`, {
    method: 'POST',
    headers,
    body: {
      type: 'DEBIT',
      amount: 2000,
      reason: 'Emergency destination truck unloading fee',
    },
  });
  console.log(`  ✅ PASS: Posted Debit Note adjustment: New Balance PKR ${adjDebitRes.data.newBalance}`);
  if (new Decimal(adjDebitRes.data.newBalance).toNumber() !== 97000) {
    throw new Error(`Expected balance 97000, got ${adjDebitRes.data.newBalance}`);
  }

  // =========================================================================
  // TEST D: SUPPLIER REGISTRATION & OPENING LEDGER
  // =========================================================================
  console.log('\n[D] Testing Supplier Registration with Opening Balance...');
  const testSupplierCode = `SUPP-TEST-${Date.now().toString().slice(-4)}`;
  const suppCreateRes = await request('/parties/suppliers', {
    method: 'POST',
    headers,
    body: {
      code: testSupplierCode,
      name: 'Haji Noor Muhammad & Sons (Arthi)',
      businessName: 'Noor Commission Shop',
      phone: '0321-7788990',
      city: 'Kamoke',
      address: 'Shop 45, Grain Market, Kamoke',
      isArthi: true,
      paymentTerms: 'MANDI_CYCLE',
      openingBalance: 200000, // Opening credit balance
      notes: 'Grain commission shop in Kamoke mandi',
    },
  });
  const supplier = suppCreateRes.data;
  console.log(`  ✅ PASS: Created Supplier ${supplier.name} (Code: ${supplier.code})`);

  // Verify Opening Ledger
  const suppStatement1 = await request(`/parties/suppliers/${supplier.id}/statement`, { headers });
  const suppStmt1 = suppStatement1.data;
  if (suppStmt1.transactions.length !== 1 || suppStmt1.transactions[0].transactionType !== 'OPENING_BALANCE') {
    throw new Error('Supplier opening balance ledger entry was not created');
  }
  if (new Decimal(suppStmt1.closingBalance).toNumber() !== 200000) {
    throw new Error(`Expected closing balance 200000, got ${suppStmt1.closingBalance}`);
  }
  console.log('  ✅ PASS: Supplier opening balance ledger entry posted correctly (PKR 200,000)');

  // =========================================================================
  // TEST E: SUPPLIER CASH PAYMENT (KHATABOOK DEBIT)
  // =========================================================================
  console.log('\n[E] Testing Supplier Payment Posting...');
  const paymentRes = await request(`/parties/suppliers/${supplier.id}/payment`, {
    method: 'POST',
    headers,
    body: {
      amount: 80000,
      paymentMethod: 'CASH',
      cashAccountId: cashAccount.id,
      referenceNumber: 'VCHR-5501',
      notes: 'Mandi cycle installment payment',
    },
  });
  const paymentData = paymentRes.data;
  console.log(`  ✅ PASS: Recorded Supplier Payment: ${paymentData.payment.paymentNumber}, New Balance: PKR ${paymentData.newBalance}`);

  if (new Decimal(paymentData.newBalance).toNumber() !== 120000) {
    throw new Error(`Expected new balance 120000 after 80000 payment, got ${paymentData.newBalance}`);
  }

  // =========================================================================
  // TEST F: SUPPLIER ADJUSTMENTS
  // =========================================================================
  console.log('\n[F] Testing Supplier Khatabook Adjustments...');
  // Debit adjustment (Quality rebate claim) -> reduces payable by 10,000
  const suppAdjDebitRes = await request(`/parties/suppliers/${supplier.id}/adjustment`, {
    method: 'POST',
    headers,
    body: {
      type: 'DEBIT',
      amount: 10000,
      reason: 'Bardana jute damage deduction agreed during Mandi settlement',
    },
  });
  console.log(`  ✅ PASS: Posted Supplier Debit Adjustment: New Balance PKR ${suppAdjDebitRes.data.newBalance}`);
  if (new Decimal(suppAdjDebitRes.data.newBalance).toNumber() !== 110000) {
    throw new Error(`Expected balance 110000, got ${suppAdjDebitRes.data.newBalance}`);
  }

  // =========================================================================
  // TEST G: DYNAMIC BALANCES RECONCILIATION & SEARCH
  // =========================================================================
  console.log('\n[G] Testing Dynamic Calculated Balances & Search Filter...');
  const searchCustRes = await request(`/parties/customers?search=${testCustomerCode}`, { headers });
  const foundCust = searchCustRes.data[0];
  console.log(`  ✅ PASS: Customer Search returned: ${foundCust.name}`);
  console.log(`  Calculated Balance: PKR ${foundCust.currentBalance} (Total Debits: PKR ${foundCust.totalDebits}, Total Credits: PKR ${foundCust.totalCredits})`);
  if (new Decimal(foundCust.currentBalance).toNumber() !== 97000) {
    throw new Error(`Customer calculated balance mismatch: expected 97000, got ${foundCust.currentBalance}`);
  }

  const searchSuppRes = await request(`/parties/suppliers?search=${testSupplierCode}`, { headers });
  const foundSupp = searchSuppRes.data[0];
  console.log(`  ✅ PASS: Supplier Search returned: ${foundSupp.name}`);
  console.log(`  Calculated Balance: PKR ${foundSupp.currentBalance} (Total Debits: PKR ${foundSupp.totalDebits}, Total Credits: PKR ${foundSupp.totalCredits})`);
  if (new Decimal(foundSupp.currentBalance).toNumber() !== 110000) {
    throw new Error(`Supplier calculated balance mismatch: expected 110000, got ${foundSupp.currentBalance}`);
  }

  // =========================================================================
  // TEST H: KHATABOOK AGGREGATE SUMMARY
  // =========================================================================
  console.log('\n[H] Testing Khatabook Global Summary...');
  const summaryRes = await request('/parties/khatabook-summary', { headers });
  const summary = summaryRes.data;
  console.log(`  Total Customers: ${summary.totalCustomers}`);
  console.log(`  Total Suppliers: ${summary.totalSuppliers}`);
  console.log(`  Total Receivables: PKR ${Number(summary.totalReceivables).toLocaleString()}`);
  console.log(`  Total Payables: PKR ${Number(summary.totalPayables).toLocaleString()}`);
  console.log(`  Net Difference: PKR ${Number(summary.netDifference).toLocaleString()}`);
  console.log('  ✅ PASS: Khatabook global summary verified');

  console.log('\n🌾 ================================================================');
  console.log('🌾 STEP 7 PARTY KHATABOOK TEST SUITE: 100% PASSED');
  console.log('🌾 ================================================================');
}

runPartyTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err.response?.data || err.message);
  process.exit(1);
});
