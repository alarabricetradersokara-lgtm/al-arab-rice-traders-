import prisma from './config/prisma';
import bcrypt from 'bcryptjs';
import { RoleName } from '@prisma/client';

async function seedRolesAndUsers() {
  console.log('🌱 Seeding Step 11 Roles, Permissions & Operator Accounts...');

  // 1. Roles definitions
  const rolesList = [
    { name: RoleName.ADMIN, description: 'Owner & Executive Admin: Complete unrestricted system authority' },
    { name: RoleName.ACCOUNTANT, description: 'Accountant: Financial accounts, treasury, payments, ledgers and reports' },
    { name: RoleName.STOCK_MANAGER, description: 'Stock Manager: Rice products, godown inventory, weighbridge, transfers and adjustments' },
    { name: RoleName.SALES_OPERATOR, description: 'Sales Operator: Counter POS sales entry, customer lookups and sales invoices' },
    { name: RoleName.VIEWER, description: 'Viewer: Authorized read-only access to catalogs, stock and sales records' },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of rolesList) {
    const roleRecord = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });
    roleMap[r.name] = roleRecord.id;
    console.log(`  ✓ Role verified: ${r.name}`);
  }

  // 2. Granular Permissions Matrix
  const permissionsList = [
    // Users & System
    { code: 'users:manage', module: 'Admin', description: 'Create, edit, deactivate users and reset passwords' },
    { code: 'settings:manage', module: 'Admin', description: 'Manage company settings and feature toggles' },
    { code: 'audit:view', module: 'Admin', description: 'Review security and transaction audit logs' },
    { code: 'daily_closing:approve', module: 'Admin', description: 'Approve, lock, and reverse daily closing registers' },

    // Financial Accounting
    { code: 'accounts:view', module: 'Accounting', description: 'View chart of accounts, bank balances and cash books' },
    { code: 'accounts:manage', module: 'Accounting', description: 'Create and edit cash accounts and bank accounts' },
    { code: 'payments:manage', module: 'Accounting', description: 'Disburse supplier payments, expenses and broker payouts' },
    { code: 'receipts:manage', module: 'Accounting', description: 'Record customer receipts and other income' },
    { code: 'ledgers:view', module: 'Accounting', description: 'View general ledger, customer and supplier Khatabooks' },
    { code: 'ledgers:manage', module: 'Accounting', description: 'Post manual journal entries and ledger adjustments' },
    { code: 'reports:financial', module: 'Accounting', description: 'View confidential Profit & Loss and Balance Sheet' },
    { code: 'reports:view', module: 'Reports', description: 'View operational reports and export statements' },

    // Stock & Inventory
    { code: 'products:manage', module: 'Inventory', description: 'Create and update rice varieties, grades and price rates' },
    { code: 'stock:view', module: 'Inventory', description: 'View godown stock matrices, dual-UOM bags and weights' },
    { code: 'stock:manage', module: 'Inventory', description: 'Manage opening stock and stock reorder alerts' },
    { code: 'inventory:adjust', module: 'Inventory', description: 'Post stock reconciliations, adjustments and wastage' },
    { code: 'warehouses:manage', module: 'Inventory', description: 'Configure godowns and storage locations' },
    { code: 'transfers:manage', module: 'Inventory', description: 'Dispatch and verify inter-godown stock transfers' },

    // Procurement
    { code: 'purchases:manage', module: 'Procurement', description: 'Create inward purchase bills, kanda slips and arthi bills' },

    // Sales & Customers
    { code: 'sales:manage', module: 'Sales', description: 'Full access to sales invoices, credit approvals and returns' },
    { code: 'sales:create', module: 'Sales', description: 'Enter daily sales register lines and POS counter sales' },
    { code: 'sales:view', module: 'Sales', description: 'View sales invoices and print receipts' },
    { code: 'customers:view', module: 'Parties', description: 'Search and lookup customer phone and address records' },
    { code: 'dashboard:view', module: 'Dashboard', description: 'View executive KPI cards and operational summaries' },
  ];

  const permMap: Record<string, string> = {};
  for (const p of permissionsList) {
    const permRecord = await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description, module: p.module },
      create: p,
    });
    permMap[p.code] = permRecord.id;
  }
  console.log(`  ✓ ${permissionsList.length} Permissions verified in matrix`);

  // 3. Assign permissions to roles
  const rolePermissionsMapping: Record<RoleName, string[]> = {
    [RoleName.ADMIN]: permissionsList.map((p) => p.code),
    [RoleName.SUPER_ADMIN]: permissionsList.map((p) => p.code),
    [RoleName.ACCOUNTANT]: [
      'dashboard:view',
      'accounts:view',
      'accounts:manage',
      'payments:manage',
      'receipts:manage',
      'ledgers:view',
      'ledgers:manage',
      'reports:financial',
      'reports:view',
      'customers:view',
      'sales:view',
      'stock:view',
    ],
    [RoleName.STOCK_MANAGER]: [
      'dashboard:view',
      'products:manage',
      'stock:view',
      'stock:manage',
      'inventory:adjust',
      'warehouses:manage',
      'transfers:manage',
      'reports:view',
    ],
    [RoleName.SALES_OPERATOR]: [
      'dashboard:view',
      'sales:create',
      'sales:view',
      'customers:view',
      'stock:view',
    ],
    [RoleName.VIEWER]: [
      'dashboard:view',
      'stock:view',
      'sales:view',
      'customers:view',
      'reports:view',
    ],
    [RoleName.BRANCH_MANAGER]: permissionsList.map((p) => p.code),
    [RoleName.PROCUREMENT_OFFICER]: ['dashboard:view', 'stock:view', 'purchases:manage'],
    [RoleName.POS_CASHIER]: ['dashboard:view', 'sales:create', 'sales:view', 'customers:view'],
    [RoleName.MILL_SUPERVISOR]: ['dashboard:view', 'stock:view', 'inventory:adjust'],
  };

  for (const [roleName, permCodes] of Object.entries(rolePermissionsMapping)) {
    const roleId = roleMap[roleName];
    if (!roleId) continue;

    for (const code of permCodes) {
      const permissionId = permMap[code];
      if (permissionId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId } },
          update: {},
          create: { roleId, permissionId },
        });
      }
    }
    console.log(`  ✓ Permissions bound for Role: ${roleName} (${permCodes.length} permissions)`);
  }

  // 4. Seed Operators for Each Role
  const demoPasswordHash = await bcrypt.hash('AlArab@2026', 12);
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 12);

  const operators = [
    {
      username: 'admin',
      email: 'admin@alarabricetraders.com',
      fullName: 'Haji Muhammad Arab (Owner)',
      phone: '+92-300-8451122',
      role: RoleName.ADMIN,
      passwordHash: adminPasswordHash,
    },
    {
      username: 'accountant',
      email: 'accounts@alarabricetraders.com',
      fullName: 'Sheikh Tariq Mahmood (Senior Accountant)',
      phone: '+92-301-4455667',
      role: RoleName.ACCOUNTANT,
      passwordHash: demoPasswordHash,
    },
    {
      username: 'stock_mgr',
      email: 'godown@alarabricetraders.com',
      fullName: 'Chaudhry Bilal Warraich (Godown Incharge)',
      phone: '+92-302-7788990',
      role: RoleName.STOCK_MANAGER,
      passwordHash: demoPasswordHash,
    },
    {
      username: 'sales_op',
      email: 'sales@alarabricetraders.com',
      fullName: 'Rana Zulfiqar Ali (Counter POS Operator)',
      phone: '+92-303-1122334',
      role: RoleName.SALES_OPERATOR,
      passwordHash: demoPasswordHash,
    },
    {
      username: 'viewer',
      email: 'auditor@alarabricetraders.com',
      fullName: 'M. Kashif Butt (External Auditor & Viewer)',
      phone: '+92-304-5566778',
      role: RoleName.VIEWER,
      passwordHash: demoPasswordHash,
    },
  ];

  for (const op of operators) {
    const roleId = roleMap[op.role];
    await prisma.user.upsert({
      where: { username: op.username },
      update: {
        email: op.email,
        fullName: op.fullName,
        phone: op.phone,
        roleId,
        passwordHash: op.passwordHash,
        isActive: true,
      },
      create: {
        username: op.username,
        email: op.email,
        fullName: op.fullName,
        phone: op.phone,
        roleId,
        passwordHash: op.passwordHash,
        isActive: true,
      },
    });
    console.log(`  ✓ Operator seeded: ${op.username} [Role: ${op.role}]`);
  }

  console.log('🎉 Role-Based Access Control matrix & Operator Accounts ready!');
}

seedRolesAndUsers()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
