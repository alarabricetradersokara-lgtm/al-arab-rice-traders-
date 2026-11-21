/**
 * Comprehensive Step 11 Test Suite:
 * AL ARAB RICE TRADERS - Authentication, Admin & Role-Based Access Control (RBAC)
 */

const API_BASE = 'http://localhost:5000/api';

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      username: string;
      email: string;
      fullName: string;
      phone: string | null;
      role: string;
      permissions: string[];
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: string;
    };
  };
}

async function runTests() {
  console.log('================================================================');
  console.log('🔐 STEP 11 TEST SUITE: AUTHENTICATION, ADMIN & RBAC ENFORCEMENT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Health check
  const healthRes = await fetch(`${API_BASE}/health`);
  const healthData: any = await healthRes.json();
  assert(healthRes.status === 200 && healthData.data?.status === 'ONLINE', 'System Health Check is ONLINE');

  // 2. Test logins for all 5 roles
  console.log('\n--- 1. Authenticating Mandated 5 System Roles ---');

  const operators = [
    { username: 'admin', password: 'Admin@12345', expectedRole: 'ADMIN' },
    { username: 'accountant', password: 'AlArab@2026', expectedRole: 'ACCOUNTANT' },
    { username: 'stock_mgr', password: 'AlArab@2026', expectedRole: 'STOCK_MANAGER' },
    { username: 'sales_op', password: 'AlArab@2026', expectedRole: 'SALES_OPERATOR' },
    { username: 'viewer', password: 'AlArab@2026', expectedRole: 'VIEWER' },
  ];

  const tokens: Record<string, string> = {};
  const userIds: Record<string, string> = {};

  for (const op of operators) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: op.username, password: op.password }),
    });

    const json: LoginResponse = await res.json();
    assert(
      res.status === 200 && json.data.user.role === op.expectedRole,
      `Operator '${op.username}' authenticated with role '${op.expectedRole}'`
    );

    if (json.data?.tokens?.accessToken) {
      tokens[op.username] = json.data.tokens.accessToken;
      userIds[op.username] = json.data.user.id;
    }
  }

  // 3. Test Invalid Credentials
  console.log('\n--- 2. Security Defense: Invalid Credentials ---');
  const badLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'WrongPassword!123' }),
  });
  assert(badLoginRes.status === 401, 'Unauthorized request rejected (HTTP 401) on invalid password');

  // 4. Test Backend RBAC Enforcement (403 Forbidden)
  console.log('\n--- 3. Dual-Layer Backend Authorization (HTTP 403 Forbidden Enforcement) ---');

  // Test: User Management route (/api/users)
  // Admin allowed (200), everyone else strictly forbidden (403)
  const adminUsersRes = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${tokens['admin']}` },
  });
  assert(adminUsersRes.status === 200, "Admin granted access to '/api/users' (HTTP 200)");

  const nonAdminRoles = ['accountant', 'stock_mgr', 'sales_op', 'viewer'];
  for (const roleKey of nonAdminRoles) {
    const forbiddenRes = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${tokens[roleKey]}` },
    });
    assert(
      forbiddenRes.status === 403,
      `Operator '${roleKey}' correctly blocked from '/api/users' (HTTP 403 Forbidden)`
    );
  }

  // Test: Financial Statement (/api/reports/profit-loss)
  // Admin & Accountant allowed (200), Sales Op and Viewer forbidden (403)
  const acctPLRes = await fetch(`${API_BASE}/reports/profit-loss`, {
    headers: { Authorization: `Bearer ${tokens['accountant']}` },
  });
  assert(acctPLRes.status === 200, "Accountant authorized for confidential '/api/reports/profit-loss' (HTTP 200)");

  const salesPLRes = await fetch(`${API_BASE}/reports/profit-loss`, {
    headers: { Authorization: `Bearer ${tokens['sales_op']}` },
  });
  assert(salesPLRes.status === 403, "Sales Operator blocked from confidential '/api/reports/profit-loss' (HTTP 403)");

  const stockPLRes = await fetch(`${API_BASE}/reports/profit-loss`, {
    headers: { Authorization: `Bearer ${tokens['stock_mgr']}` },
  });
  assert(stockPLRes.status === 403, "Stock Manager blocked from confidential '/api/reports/profit-loss' (HTTP 403)");

  // Test: Mutation prevention for Viewer
  const viewerMutateRes = await fetch(`${API_BASE}/daily-sales/draft`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens['viewer']}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ businessDate: '2026-11-21', warehouseId: 'dummy', items: [] }),
  });
  assert(viewerMutateRes.status === 403, "Viewer blocked from mutation '/api/daily-sales/draft' (HTTP 403)");

  // Test: Daily Closing Approval / Reverse permission
  // Admin allowed, Sales Op blocked
  const salesReverseRes = await fetch(`${API_BASE}/daily-sales/dummy-id/reverse`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['sales_op']}` },
  });
  assert(salesReverseRes.status === 403, "Sales Operator blocked from closing reversal (HTTP 403)");

  // 5. Admin User Management CRUD
  console.log('\n--- 4. Admin User Management Workflows ---');

  // List roles
  const rolesRes = await fetch(`${API_BASE}/users/roles`, {
    headers: { Authorization: `Bearer ${tokens['admin']}` },
  });
  const rolesData: any = await rolesRes.json();
  assert(
    rolesRes.status === 200 && rolesData.data?.length >= 5,
    `Admin fetched ${rolesData.data?.length} roles with assigned permissions`
  );

  const salesRole = rolesData.data.find((r: any) => r.name === 'SALES_OPERATOR');

  // Create new operator
  const testUsername = `counter_sub_${Date.now().toString().slice(-4)}`;
  const createUserRes = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens['admin']}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: testUsername,
      email: `${testUsername}@alarabricetraders.com`,
      fullName: 'Muhammad Usman (Counter Assistant)',
      phone: '+92-305-9988776',
      password: 'TempPassword@2026',
      roleId: salesRole.id,
    }),
  });
  const createUserData: any = await createUserRes.json();
  assert(createUserRes.status === 201, `Admin created new operator account '${testUsername}' (HTTP 201)`);
  const createdUserId = createUserData.data?.id;

  // Deactivate user
  const toggleRes = await fetch(`${API_BASE}/users/${createdUserId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokens['admin']}` },
  });
  const toggleData: any = await toggleRes.json();
  assert(toggleRes.status === 200 && toggleData.data.isActive === false, 'Admin deactivated operator account');

  // Reactivate user
  const toggleRes2 = await fetch(`${API_BASE}/users/${createdUserId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokens['admin']}` },
  });
  const toggleData2: any = await toggleRes2.json();
  assert(toggleRes2.status === 200 && toggleData2.data.isActive === true, 'Admin reactivated operator account');

  // Reset password
  const resetPassRes = await fetch(`${API_BASE}/users/${createdUserId}/reset-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens['admin']}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newPassword: 'ResetPassword@123' }),
  });
  assert(resetPassRes.status === 200, 'Admin reset operator password successfully');

  // Verify new password works
  const newLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUsername, password: 'ResetPassword@123' }),
  });
  assert(newLoginRes.status === 200, "Created operator successfully logged in with reset password");

  // 6. Self Password Change Workflow
  console.log('\n--- 5. Self Password Change & Verification ---');
  const changePassRes = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens['sales_op']}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      currentPassword: 'AlArab@2026',
      newPassword: 'NewSalesPass@2026',
    }),
  });
  assert(changePassRes.status === 200, "Sales Operator successfully changed their own password");

  // Verify login with new password
  const opLoginNew = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'sales_op', password: 'NewSalesPass@2026' }),
  });
  assert(opLoginNew.status === 200, "Sales Operator logged in with new password");

  // Revert password back to AlArab@2026 for consistency
  const revertLoginData: any = await opLoginNew.json();
  const revertToken = revertLoginData.data.tokens.accessToken;
  await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${revertToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      currentPassword: 'NewSalesPass@2026',
      newPassword: 'AlArab@2026',
    }),
  });
  console.log("  ✓ Restored sales_op password to demo baseline");

  // 7. Audit Trail Verification
  console.log('\n--- 6. Audit Trail & Compliance Verification ---');
  const auditRes = await fetch(`${API_BASE}/audit-logs?limit=15`, {
    headers: { Authorization: `Bearer ${tokens['admin']}` },
  });
  const auditData: any = await auditRes.json();
  assert(auditRes.status === 200, "Admin fetched audit logs (HTTP 200)");
  assert(auditData.data?.logs?.length > 0, `Audit trail contains ${auditData.data?.logs?.length} recorded events`);

  // Check audit summary
  const summaryRes = await fetch(`${API_BASE}/audit-logs/summary`, {
    headers: { Authorization: `Bearer ${tokens['admin']}` },
  });
  const summaryData: any = await summaryRes.json();
  assert(
    summaryRes.status === 200 && summaryData.data?.totalLogs > 0,
    `Audit summary reports ${summaryData.data?.totalLogs} total logs, ${summaryData.data?.loginsToday} logins today`
  );

  // Verify non-admin cannot access audit trail
  const acctAuditRes = await fetch(`${API_BASE}/audit-logs`, {
    headers: { Authorization: `Bearer ${tokens['accountant']}` },
  });
  assert(acctAuditRes.status === 403, "Accountant correctly blocked from sensitive '/api/audit-logs' (HTTP 403)");

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Unhandled test failure:', e);
  process.exit(1);
});
