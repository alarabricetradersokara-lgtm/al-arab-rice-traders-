import { PrismaClient, RoleName, GrainVariety, GrainGrade } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Al Arab Rice Traders database seeding...');

  // 1. Company Settings
  console.log('  → Seeding Company Settings...');
  const settings = await prisma.companySettings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      companyName: 'AL ARAB RICE TRADERS',
      businessType: 'Rice Millers, Commission Agents & Exporters',
      address: 'G.T. Road, Kamoke, Gujranwala, Pakistan',
      phone: '+92-55-1122334',
      email: 'info@alarabricetraders.com',
      taxNumber: '1849204-7',
      currency: 'PKR',
      defaultMoistureBasePct: 14.0,
      standardMaundKg: 40.0,
      allowNegativeInventory: false,
      receiptPrinterType: 'ESC_POS',
      thermalPrinterWidth: 80,
      termsAndConditions: '1. Certified net scale weights.\n2. Dispute claims within 48 hours.\n3. Goods sold with gate pass are non-returnable.',
    },
  });

  // 2. Roles
  console.log('  → Seeding Enterprise Roles...');
  const rolesData: { name: RoleName; description: string }[] = [
    { name: RoleName.SUPER_ADMIN, description: 'Complete system authority, fiscal year closing & audits' },
    { name: RoleName.BRANCH_MANAGER, description: 'Warehouse operations, credit authorizations and shift audits' },
    { name: RoleName.PROCUREMENT_OFFICER, description: 'Weighbridge Kanda slips, Mandi Arthi bills and raw paddy receipt' },
    { name: RoleName.POS_CASHIER, description: 'Retail counter POS cashier, customer checkout and cash receipts' },
    { name: RoleName.ACCOUNTANT, description: 'Chart of accounts, general ledger, bank reconciliations and Khatabook' },
    { name: RoleName.MILL_SUPERVISOR, description: 'Milling production orders, paddy consumption and yield tracking' },
  ];

  const roles: Record<RoleName, string> = {} as Record<RoleName, string>;
  for (const r of rolesData) {
    const roleRecord = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    roles[r.name] = roleRecord.id;
  }

  // 3. Permissions
  console.log('  → Seeding Permissions Matrix...');
  const permissionsData = [
    { code: 'inventory:view', module: 'Inventory', description: 'View stock levels and movements' },
    { code: 'inventory:adjust', module: 'Inventory', description: 'Perform stock adjustments' },
    { code: 'pos:sale', module: 'POS', description: 'Create and process counter POS sales' },
    { code: 'pos:close_shift', module: 'POS', description: 'Close register shift and audit cash' },
    { code: 'procurement:create', module: 'Procurement', description: 'Create gate inward and purchase bills' },
    { code: 'weighbridge:operate', module: 'Procurement', description: 'Capture scale weights' },
    { code: 'milling:operate', module: 'Milling', description: 'Manage milling jobs and yield allocation' },
    { code: 'accounts:view', module: 'Accounting', description: 'View ledgers and financial statements' },
    { code: 'accounts:post', module: 'Accounting', description: 'Post journal entries and payment vouchers' },
    { code: 'reports:view', module: 'Reports', description: 'Generate executive analytics and P&L' },
  ];

  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description, module: p.module },
      create: p,
    });

    // Link all permissions to SUPER_ADMIN
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles[RoleName.SUPER_ADMIN],
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: roles[RoleName.SUPER_ADMIN],
        permissionId: perm.id,
      },
    });
  }

  // 4. Default Super Admin User
  console.log('  → Seeding Super Admin User...');
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash('Admin@12345', salt);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash },
    create: {
      username: 'admin',
      email: 'admin@alarabricetraders.com',
      passwordHash,
      fullName: 'Chief Operations Administrator',
      phone: '+92-300-1234567',
      roleId: roles[RoleName.SUPER_ADMIN],
      isActive: true,
    },
  });

  // 5. Warehouses (Godowns & Silos)
  console.log('  → Seeding Warehouses & Godowns...');
  const warehousesData = [
    { code: 'GODOWN-01', name: 'Godown 1 - Central Mill Storage', location: 'Main Mill Premises, Kamoke', capacityBags: 25000, capacityKg: 1250000 },
    { code: 'GODOWN-02', name: 'Godown 2 - Mandi Gate Warehouse', location: 'Grain Market Bypass, Hafizabad', capacityBags: 15000, capacityKg: 750000 },
    { code: 'SILO-A', name: 'Silo A - Raw Grain Storage', location: 'Intake Hopper Line 1', capacityBags: 0, capacityKg: 500000 },
  ];

  const warehouses: Record<string, string> = {};
  for (const w of warehousesData) {
    const wh = await prisma.warehouse.upsert({
      where: { code: w.code },
      update: {},
      create: w,
    });
    warehouses[w.code] = wh.id;
  }

  // 6. Cash and Bank Accounts
  console.log('  → Seeding Cash & Bank Accounts...');
  await prisma.cashAccount.upsert({
    where: { code: 'CASH-MAIN' },
    update: {},
    create: { code: 'CASH-MAIN', name: 'Main Company Vault Cash', balance: 500000 },
  });

  await prisma.cashAccount.upsert({
    where: { code: 'CASH-TILL-1' },
    update: {},
    create: { code: 'CASH-TILL-1', name: 'POS Counter Till 1 Drawer', balance: 25000 },
  });

  await prisma.bankAccount.upsert({
    where: { code: 'BANK-MEEZAN' },
    update: {},
    create: {
      code: 'BANK-MEEZAN',
      bankName: 'Meezan Bank Limited',
      accountNumber: '0204-0104829104',
      branchName: 'Kamoke G.T. Road Branch',
      iban: 'PK45MEZN0002040104829104',
      currentBalance: 8500000,
    },
  });

  await prisma.bankAccount.upsert({
    where: { code: 'BANK-MCB' },
    update: {},
    create: {
      code: 'BANK-MCB',
      bankName: 'MCB Bank Limited',
      accountNumber: '1048-2948172901',
      branchName: 'Grain Market Branch',
      iban: 'PK82MUCB10482948172901',
      currentBalance: 4200000,
    },
  });

  // 7. Rice Categories
  console.log('  → Seeding Rice Categories...');
  const catBasmati = await prisma.riceCategory.upsert({
    where: { code: 'CAT-BASMATI' },
    update: {},
    create: { code: 'CAT-BASMATI', name: 'Basmati Rice Varieties', description: 'Long-grain aromatic Super Basmati and 1121 Kainat' },
  });

  const catNonBasmati = await prisma.riceCategory.upsert({
    where: { code: 'CAT-NON-BASMATI' },
    update: {},
    create: { code: 'CAT-NON-BASMATI', name: 'Non-Basmati & Coarse', description: 'High-volume export rice varieties (IRRI-6, PK 386)' },
  });

  const catRawPaddy = await prisma.riceCategory.upsert({
    where: { code: 'CAT-PADDY' },
    update: {},
    create: { code: 'CAT-PADDY', name: 'Raw Grain Paddy (Dhan)', description: 'Unprocessed harvest intake from farmers and Mandi' },
  });

  const catByProducts = await prisma.riceCategory.upsert({
    where: { code: 'CAT-BYPRODUCT' },
    update: {},
    create: { code: 'CAT-BYPRODUCT', name: 'Milling By-Products', description: 'Rice Bran (Phak), Broken Grains (Tota), Husk (Bhoosa)' },
  });

  // 8. Rice Products
  console.log('  → Seeding Rice Products Catalog...');
  const productsData = [
    {
      code: 'RICE-1121-STM',
      name: '1121 Kainat Steam Basmati (50kg PP)',
      categoryId: catBasmati.id,
      variety: GrainVariety.BASMATI_1121_KAINAT,
      grade: GrainGrade.STEAM,
      defaultBagWeightKg: 50.0,
      costPricePerKg: 245.0,
      salePricePerKg: 280.0,
      reorderLevelKg: 5000.0,
    },
    {
      code: 'RICE-SUP-RAW',
      name: 'Super Kernel Basmati Raw (50kg Jute)',
      categoryId: catBasmati.id,
      variety: GrainVariety.SUPER_KERNEL_BASMATI,
      grade: GrainGrade.RAW_WHITE,
      defaultBagWeightKg: 50.0,
      costPricePerKg: 260.0,
      salePricePerKg: 295.0,
      reorderLevelKg: 5000.0,
    },
    {
      code: 'RICE-385-WHT',
      name: 'Basmati 385 White (25kg Non-Woven)',
      categoryId: catBasmati.id,
      variety: GrainVariety.BASMATI_385,
      grade: GrainGrade.RAW_WHITE,
      defaultBagWeightKg: 25.0,
      costPricePerKg: 205.0,
      salePricePerKg: 235.0,
      reorderLevelKg: 2500.0,
    },
    {
      code: 'RICE-IRRI6-SEL',
      name: 'IRRI-6 Parboiled Sella (50kg PP)',
      categoryId: catNonBasmati.id,
      variety: GrainVariety.IRRI_6,
      grade: GrainGrade.SELLA_PARBOILED,
      defaultBagWeightKg: 50.0,
      costPricePerKg: 135.0,
      salePricePerKg: 155.0,
      reorderLevelKg: 10000.0,
    },
    {
      code: 'PAD-1121-RAW',
      name: 'Raw Paddy (Dhan) 1121 Kainat',
      categoryId: catRawPaddy.id,
      variety: GrainVariety.RAW_PADDY_DHAN,
      grade: GrainGrade.RAW_WHITE,
      defaultBagWeightKg: 50.0,
      costPricePerKg: 115.0,
      salePricePerKg: 125.0,
      reorderLevelKg: 20000.0,
    },
    {
      code: 'BY-BRAN-PHAK',
      name: 'Rice Bran / Phak (40kg Bag)',
      categoryId: catByProducts.id,
      variety: GrainVariety.RICE_BRAN_PHAK,
      grade: GrainGrade.COMMERCIAL,
      defaultBagWeightKg: 40.0,
      costPricePerKg: 55.0,
      salePricePerKg: 65.0,
      reorderLevelKg: 2000.0,
    },
    {
      code: 'BY-TOTA-SUPER',
      name: 'Broken Rice / Super Tota (50kg PP)',
      categoryId: catByProducts.id,
      variety: GrainVariety.BROKEN_RICE_TOTA,
      grade: GrainGrade.SECOND_GRADE,
      defaultBagWeightKg: 50.0,
      costPricePerKg: 125.0,
      salePricePerKg: 140.0,
      reorderLevelKg: 3000.0,
    },
  ];

  const products: Record<string, string> = {};
  for (const p of productsData) {
    const prod = await prisma.riceProduct.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
    products[p.code] = prod.id;
  }

  // 9. Initial Opening Stock in Godown 1
  console.log('  → Initializing Godown Stock & Movement Ledger...');
  const initStockItems = [
    { code: 'RICE-1121-STM', bags: 1000, kg: 50000, cost: 245.0 },
    { code: 'RICE-SUP-RAW', bags: 800, kg: 40000, cost: 260.0 },
    { code: 'RICE-385-WHT', bags: 400, kg: 10000, cost: 205.0 },
    { code: 'RICE-IRRI6-SEL', bags: 2000, kg: 100000, cost: 135.0 },
    { code: 'BY-TOTA-SUPER', bags: 300, kg: 15000, cost: 125.0 },
  ];

  for (const item of initStockItems) {
    const pId = products[item.code];
    const wId = warehouses['GODOWN-01'];

    await prisma.stock.upsert({
      where: {
        warehouseId_productId: {
          warehouseId: wId,
          productId: pId,
        },
      },
      update: {
        currentBags: item.bags,
        currentWeightKg: item.kg,
        availableBags: item.bags,
        availableWeightKg: item.kg,
      },
      create: {
        warehouseId: wId,
        productId: pId,
        currentBags: item.bags,
        currentWeightKg: item.kg,
        availableBags: item.bags,
        availableWeightKg: item.kg,
        lastMovementDate: new Date(),
      },
    });

    await prisma.stockMovement.upsert({
      where: { movementNumber: `MOV-INIT-${item.code}` },
      update: {},
      create: {
        movementNumber: `MOV-INIT-${item.code}`,
        movementType: 'OPENING_STOCK',
        warehouseId: wId,
        productId: pId,
        bagCountDelta: item.bags,
        weightKgDelta: item.kg,
        unitCostPerKg: item.cost,
        totalCost: item.kg * item.cost,
        referenceType: 'InitialOpeningStock',
        referenceId: 'OPENING-2026',
        notes: 'Initial fiscal year baseline stock valuation entry',
      },
    });
  }

  // 10. Customers & Suppliers
  console.log('  → Seeding Customers & Suppliers (Khatabook Accounts)...');
  const cust1 = await prisma.customer.upsert({
    where: { code: 'CUST-001' },
    update: {},
    create: {
      code: 'CUST-001',
      name: 'Al-Haram Grain Traders',
      businessName: 'Al-Haram Wholesale Foodstuff LLC',
      phone: '+92-300-9428172',
      email: 'orders@alharamgrain.com',
      city: 'Lahore',
      address: 'Akbari Mandi, Circular Road',
      creditLimit: 5000000,
      openingBalance: 450000,
      currentBalance: 450000, // Debit (Receivable)
    },
  });

  await prisma.customerLedger.upsert({
    where: {
      customerId_referenceNo_transactionType: {
        customerId: cust1.id,
        referenceNo: 'OB-2026-001',
        transactionType: 'OPENING_BALANCE',
      },
    },
    update: {},
    create: {
      customerId: cust1.id,
      date: new Date('2026-01-01'),
      transactionType: 'OPENING_BALANCE',
      referenceNo: 'OB-2026-001',
      description: 'Opening balance brought forward from prior fiscal period',
      debit: 450000,
      credit: 0,
      runningBalance: 450000,
    },
  });

  const supp1 = await prisma.supplier.upsert({
    where: { code: 'SUPP-001' },
    update: {},
    create: {
      code: 'SUPP-001',
      name: 'Ch. Tariq Mahmood (Arthi)',
      businessName: 'Tariq Grain Commission Shop # 42',
      phone: '+92-321-4819204',
      city: 'Hafizabad',
      address: 'New Grain Market (Mandi), Hafizabad',
      isArthi: true,
      openingBalance: 1200000,
      currentBalance: 1200000, // Credit (Payable)
    },
  });

  await prisma.supplierLedger.upsert({
    where: {
      supplierId_referenceNo_transactionType: {
        supplierId: supp1.id,
        referenceNo: 'OB-SUPP-001',
        transactionType: 'OPENING_BALANCE',
      },
    },
    update: {},
    create: {
      supplierId: supp1.id,
      date: new Date('2026-01-01'),
      transactionType: 'OPENING_BALANCE',
      referenceNo: 'OB-SUPP-001',
      description: 'Opening balance payable to Mandi Arthi',
      debit: 0,
      credit: 1200000,
      runningBalance: 1200000,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('-------------------------------------------------------');
  console.log(`🔐 Admin Login: username: "admin" | password: "Admin@12345"`);
  console.log(`🌾 Settings: ${settings.companyName}`);
  console.log('-------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
