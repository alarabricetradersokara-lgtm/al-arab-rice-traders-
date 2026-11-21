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
  console.log('\n======================================================');
  console.log('  AL ARAB RICE TRADERS - STEP 8 ACCOUNTING TEST SUITE ');
  console.log('======================================================\n');

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

    // 2. Fetch Accounts
    const cashRes = await fetch(`${API_BASE}/accounting/cash-accounts`, { headers: authHeaders });
    const cashData = await cashRes.json();
    const cashAccounts = cashData.data || [];
    assert(cashAccounts.length > 0, '2. Cash Accounts Fetched', `Found ${cashAccounts.length} cash accounts`);
    const primaryCash = cashAccounts[0];

    const bankRes = await fetch(`${API_BASE}/accounting/bank-accounts`, { headers: authHeaders });
    const bankData = await bankRes.json();
    const bankAccounts = bankData.data || [];
    assert(bankAccounts.length > 0, '3. Bank Accounts Fetched', `Found ${bankAccounts.length} bank accounts`);
    const primaryBank = bankAccounts[0];

    const initialCashBal = new Decimal(primaryCash.balance.toString());
    const initialBankBal = new Decimal(primaryBank.currentBalance.toString());

    // 3. Test Cash Transfer (Cash to Bank)
    const transferAmount = 25000;
    const transferRes = await fetch(`${API_BASE}/accounting/transfers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        transferDate: new Date().toISOString(),
        fromAccountType: 'CASH',
        fromCashAccountId: primaryCash.id,
        toAccountType: 'BANK',
        toBankAccountId: primaryBank.id,
        amount: transferAmount,
        referenceNumber: 'DEP-CASH-001',
        notes: 'End of day cash deposit to bank account',
      }),
    });
    const transferData = await transferRes.json();
    assert(transferRes.status === 201 && transferData.success, '4. Cash Transfer Created & Posted');
    const createdTransfer = transferData.data;

    // Verify Balances after Transfer
    const cashAfterTrfRes = await fetch(`${API_BASE}/accounting/cash-accounts`, { headers: authHeaders });
    const cashAfterTrf = (await cashAfterTrfRes.json()).data.find((c: any) => c.id === primaryCash.id);
    const bankAfterTrfRes = await fetch(`${API_BASE}/accounting/bank-accounts`, { headers: authHeaders });
    const bankAfterTrf = (await bankAfterTrfRes.json()).data.find((b: any) => b.id === primaryBank.id);

    const expectedCashAfterTrf = initialCashBal.minus(transferAmount);
    const expectedBankAfterTrf = initialBankBal.plus(transferAmount);
    assert(
      new Decimal(cashAfterTrf.balance.toString()).equals(expectedCashAfterTrf) &&
      new Decimal(bankAfterTrf.currentBalance.toString()).equals(expectedBankAfterTrf),
      '5. Source & Destination Balances Correctly Updated by Transfer'
    );

    // 4. Test Cash Transfer Reversal
    const revTrfRes = await fetch(`${API_BASE}/accounting/transfers/${createdTransfer.id}/reverse`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'Test compensation reversal' }),
    });
    const revTrfData = await revTrfRes.json();
    assert(revTrfRes.status === 200 && revTrfData.success, '6. Cash Transfer Reversal Executed');

    // Verify Balances restored after reversal
    const cashAfterRevTrfRes = await fetch(`${API_BASE}/accounting/cash-accounts`, { headers: authHeaders });
    const cashAfterRevTrf = (await cashAfterRevTrfRes.json()).data.find((c: any) => c.id === primaryCash.id);
    const bankAfterRevTrfRes = await fetch(`${API_BASE}/accounting/bank-accounts`, { headers: authHeaders });
    const bankAfterRevTrf = (await bankAfterRevTrfRes.json()).data.find((b: any) => b.id === primaryBank.id);
    assert(
      new Decimal(cashAfterRevTrf.balance.toString()).equals(initialCashBal) &&
      new Decimal(bankAfterRevTrf.currentBalance.toString()).equals(initialBankBal),
      '7. Balances Restored to Exact Initial State via Compensating Journal Reversal'
    );

    // 5. Test Business Expense
    const expenseAmount = 15000;
    const expRes = await fetch(`${API_BASE}/accounting/expenses`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        category: 'Salaries',
        title: 'Mill Helper Advance Wages',
        description: 'Monthly advance for godown labor staff',
        amount: expenseAmount,
        expenseDate: new Date().toISOString(),
        paymentMethod: 'CASH',
        cashAccountId: primaryCash.id,
        paidTo: 'Muhammad Aslam (Godown Supervisor)',
      }),
    });
    const expData = await expRes.json();
    assert(expRes.status === 201 && expData.success, '8. Business Expense Created & Posted to GL');
    const createdExpense = expData.data;

    // Verify cash reduced
    const cashAfterExpRes = await fetch(`${API_BASE}/accounting/cash-accounts`, { headers: authHeaders });
    const cashAfterExp = (await cashAfterExpRes.json()).data.find((c: any) => c.id === primaryCash.id);
    assert(
      new Decimal(cashAfterExp.balance.toString()).equals(initialCashBal.minus(expenseAmount)),
      '9. Cash Account Deducted for Business Expense'
    );

    // 6. Test Expense Reversal
    const revExpRes = await fetch(`${API_BASE}/accounting/expenses/${createdExpense.id}/reverse`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'Incorrect expense entry voucher' }),
    });
    const revExpData = await revExpRes.json();
    assert(revExpRes.status === 200 && revExpData.success, '10. Expense Reversal Executed with Compensating Entry');

    // Verify cash restored
    const cashAfterRevExpRes = await fetch(`${API_BASE}/accounting/cash-accounts`, { headers: authHeaders });
    const cashAfterRevExp = (await cashAfterRevExpRes.json()).data.find((c: any) => c.id === primaryCash.id);
    assert(
      new Decimal(cashAfterRevExp.balance.toString()).equals(initialCashBal),
      '11. Cash Balance Restored After Expense Reversal'
    );

    // 7. Test Other Income Creation
    const incomeAmount = 45000;
    const incRes = await fetch(`${API_BASE}/accounting/incomes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        category: 'Rice Milling Charges',
        title: 'Commercial Paddy Husking Fee',
        description: 'Processing charges for 300 Maund Paddy of Ch. Munir',
        amount: incomeAmount,
        incomeDate: new Date().toISOString(),
        paymentMethod: 'BANK',
        bankAccountId: primaryBank.id,
        receivedFrom: 'Ch. Munir Agriculture Farms',
      }),
    });
    const incData = await incRes.json();
    assert(incRes.status === 201 && incData.success, '12. Other Income (Commercial Husking) Posted');
    const createdIncome = incData.data;

    // Verify bank balance increased
    const bankAfterIncRes = await fetch(`${API_BASE}/accounting/bank-accounts`, { headers: authHeaders });
    const bankAfterInc = (await bankAfterIncRes.json()).data.find((b: any) => b.id === primaryBank.id);
    assert(
      new Decimal(bankAfterInc.currentBalance.toString()).equals(initialBankBal.plus(incomeAmount)),
      '13. Bank Account Incremented by Other Income'
    );

    // 8. Test Journal Entry (Manual Double-Entry JV)
    const jvAmount = 12000;
    const jvRes = await fetch(`${API_BASE}/accounting/journal`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        entryDate: new Date().toISOString(),
        voucherType: 'JOURNAL',
        narration: 'Depreciation provision for mill husker machinery',
        lines: [
          {
            accountCode: '6060',
            accountName: 'Machinery Repair & Maintenance',
            accountType: 'EXPENSE',
            debit: jvAmount,
            credit: 0,
            memo: 'Husker Roller Maintenance',
          },
          {
            accountCode: '1500',
            accountName: 'Mill Machinery & Plant Equipment',
            accountType: 'ASSET',
            debit: 0,
            credit: jvAmount,
            memo: 'Accumulated Depreciation Reserve',
          },
        ],
      }),
    });
    const jvData = await jvRes.json();
    assert(jvRes.status === 201 && jvData.success, '14. Balanced Double-Entry Journal Voucher (JV) Posted');

    // 9. Test Trial Balance
    const tbRes = await fetch(`${API_BASE}/accounting/reports/trial-balance`, { headers: authHeaders });
    const tbData = await tbRes.json();
    const tb = tbData.data;
    assert(
      tb && tb.isBalanced === true && tb.totalDebits === tb.totalCredits,
      '15. Trial Balance Verified: Debits Equal Credits Exactly',
      `Debits: ${tb?.totalDebits}, Credits: ${tb?.totalCredits}, Balanced: ${tb?.isBalanced}`
    );

    // 10. Test Cash Book
    const cbRes = await fetch(`${API_BASE}/accounting/reports/cash-book?cashAccountId=${primaryCash.id}`, { headers: authHeaders });
    const cbData = await cbRes.json();
    assert(cbRes.status === 200 && cbData.success && Array.isArray(cbData.data.transactions), '16. Cash Book Report Generated');

    // 11. Test Bank Book
    const bbRes = await fetch(`${API_BASE}/accounting/reports/bank-book?bankAccountId=${primaryBank.id}`, { headers: authHeaders });
    const bbData = await bbRes.json();
    assert(bbRes.status === 200 && bbData.success && Array.isArray(bbData.data.transactions), '17. Bank Book Report Generated');

    // 12. Test Profit & Loss Statement
    const plRes = await fetch(`${API_BASE}/accounting/reports/profit-loss`, { headers: authHeaders });
    const plData = await plRes.json();
    const pl = plData.data;
    assert(
      plRes.status === 200 && plData.success && pl && typeof pl.netProfit === 'string',
      '18. Profit & Loss Statement (Income Statement) Derived from Posted Transactions',
      `Revenue: Rs ${pl?.totalRevenue}, COGS: Rs ${pl?.costOfGoodsSold}, Net Profit: Rs ${pl?.netProfit}`
    );

    // 13. Test Balance Sheet
    const bsRes = await fetch(`${API_BASE}/accounting/reports/balance-sheet`, { headers: authHeaders });
    const bsData = await bsRes.json();
    const bs = bsData.data;
    assert(
      bsRes.status === 200 && bsData.success && bs && bs.accountingEquationVerified === true,
      '19. Balance Sheet Verified: Assets Equal Liabilities Plus Equity',
      `Assets: Rs ${bs?.assets?.totalAssets}, Liab: Rs ${bs?.liabilities?.totalLiabilities}, Equity: Rs ${bs?.equity?.totalEquity}, Verified: ${bs?.accountingEquationVerified}`
    );

    // 14. Test General Ledger
    const glRes = await fetch(`${API_BASE}/accounting/reports/general-ledger`, { headers: authHeaders });
    const glData = (await glRes.json()) as any;
    assert(glRes.status === 200 && glData.success && Array.isArray(glData.data), '20. General Ledger Retrieved with Full Account Lines');

  } catch (error: any) {
    console.error('Test execution error:', error);
    assert(false, 'Test Suite Execution Failed', error.message);
  }

  console.log('\n======================================================');
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`  SUMMARY: ${passedCount} / ${results.length} Tests Passed`);
  console.log('======================================================\n');

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runTests();
