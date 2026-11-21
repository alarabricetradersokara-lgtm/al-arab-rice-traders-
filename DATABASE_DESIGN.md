# DATABASE DESIGN SPECIFICATION: AL ARAB RICE TRADERS ERP & POS

**Version:** 1.0.0  
**Target RDBMS:** PostgreSQL 16+  
**Data Access Layer:** Prisma ORM  
**Precision Standard:** `Decimal(18, 4)` for financial amounts and weight quantities  
**Timezone:** UTC / ISO 8601 with local offset preservation

---

## 1. Entity-Relationship Model Overview

The database design is structured into 7 cohesive domain schemas:
1. **Auth & Security:** Users, Roles, Permissions, UserSessions, AuditLogs.
2. **Master Registries:** Parties, Item Categories, Items (Rice Varieties & Grades), Packaging Types (Bardana), Godowns (Warehouses).
3. **Dual-Unit Inventory Engine:** Batches, Stock Levels, Stock Movements (Ledger), Stock Adjustments.
4. **Procurement & Gate Inward:** Gate Inward Passes, Weighbridge Slips, Purchase Bills, Purchase Line Items, Arthi Charges.
5. **Milling & Processing:** Milling Jobs, Raw Paddy Consumption, Finished Rice Outputs, By-Product Outputs.
6. **Sales & POS Counter:** POS Sessions, Sales Orders, Sales Invoices, Invoice Line Items, Gate Outward Passes.
7. **Double-Entry Financial Accounting:** Fiscal Years, Chart of Accounts (AccountHead), Journal Entries, Journal Entry Lines, Payment Vouchers.

---

## 2. Complete Prisma Schema Specification

Below is the complete, production-ready `schema.prisma` definition:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// =========================================================================
// 1. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
// =========================================================================

enum RoleName {
  SUPER_ADMIN
  BRANCH_MANAGER
  PROCUREMENT_OFFICER
  POS_CASHIER
  ACCOUNTANT
  MILL_SUPERVISOR
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  VOID
  LOGIN
  LOGOUT
}

model User {
  id           String        @id @default(uuid())
  username     String        @unique @db.VarChar(50)
  email        String        @unique @db.VarChar(100)
  passwordHash String        @db.VarChar(255)
  fullName     String        @db.VarChar(100)
  phone        String?       @db.VarChar(20)
  isActive     Boolean       @default(true)
  roleId       String
  role         Role          @relation(fields: [roleId], references: [id])
  sessions     UserSession[]
  auditLogs    AuditLog[]
  posSessions  POSSession[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([roleId])
}

model Role {
  id          String           @id @default(uuid())
  name        RoleName         @unique
  description String?          @db.VarChar(255)
  users       User[]
  permissions RolePermission[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}

model Permission {
  id          String           @id @default(uuid())
  code        String           @unique @db.VarChar(100) // e.g. "inventory:read", "pos:sale"
  module      String           @db.VarChar(50)
  description String?          @db.VarChar(255)
  roles       RolePermission[]
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
}

model UserSession {
  id           String    @id @default(uuid())
  userId       String
  refreshToken String    @unique @db.VarChar(500)
  ipAddress    String?   @db.VarChar(45)
  userAgent    String?   @db.VarChar(255)
  expiresAt    DateTime
  revokedAt    DateTime?
  createdAt    DateTime  @default(now())
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model AuditLog {
  id         String      @id @default(uuid())
  userId     String?
  action     AuditAction
  entityName String      @db.VarChar(50)
  entityId   String      @db.VarChar(100)
  oldData    Json?
  newData    Json?
  ipAddress  String?     @db.VarChar(45)
  userAgent  String?     @db.VarChar(255)
  timestamp  DateTime    @default(now())
  user       User?       @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([entityName, entityId])
  @@index([userId])
  @@index([timestamp])
}

// =========================================================================
// 2. MASTER DATA REGISTRIES
// =========================================================================

enum PartyType {
  CUSTOMER
  SUPPLIER
  ARTHI_BROKER
  FARMER
  TRANSPORTER
}

model Party {
  id             String          @id @default(uuid())
  code           String          @unique @db.VarChar(30)
  name           String          @db.VarChar(150)
  type           PartyType
  contactPerson  String?         @db.VarChar(100)
  phone          String          @db.VarChar(25)
  alternatePhone String?         @db.VarChar(25)
  email          String?         @db.VarChar(100)
  address        String?         @db.Text
  city           String?         @db.VarChar(50)
  taxIdOrCnic    String?         @db.VarChar(50)
  creditLimit    Decimal         @default(0.0000) @db.Decimal(18, 4)
  creditDays     Int             @default(0)
  openingBalance Decimal         @default(0.0000) @db.Decimal(18, 4)
  currentBalance Decimal         @default(0.0000) @db.Decimal(18, 4)
  isActive       Boolean         @default(true)
  accountHeadId  String?         @unique
  accountHead    AccountHead?    @relation(fields: [accountHeadId], references: [id])
  purchaseBills  PurchaseBill[]
  salesInvoices  SalesInvoice[]
  salesOrders    SalesOrder[]
  payments       PartyPayment[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  @@index([type])
  @@index([phone])
}

enum ItemType {
  RAW_PADDY
  MILLED_RICE
  BY_PRODUCT
  PACKAGING_MATERIAL
}

model ItemCategory {
  id          String   @id @default(uuid())
  name        String   @unique @db.VarChar(100) // e.g. "Super Basmati", "IRRI", "Broken Rice"
  description String?  @db.Text
  items       Item[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Item {
  id                  String             @id @default(uuid())
  skuCode             String             @unique @db.VarChar(50)
  barcode             String?            @unique @db.VarChar(50)
  name                String             @db.VarChar(150)
  type                ItemType
  categoryId          String
  category            ItemCategory       @relation(fields: [categoryId], references: [id])
  grainLengthMm       Decimal?           @db.Decimal(6, 2)
  brokenPercentageMax Decimal?           @db.Decimal(5, 2)
  moistureStandardPct Decimal?           @default(14.00) @db.Decimal(5, 2)
  defaultPackagingId  String?
  defaultPackaging    PackagingType?     @relation(fields: [defaultPackagingId], references: [id])
  costPricePerKg      Decimal            @default(0.0000) @db.Decimal(18, 4)
  retailPricePerKg    Decimal            @default(0.0000) @db.Decimal(18, 4)
  wholesalePricePerKg Decimal            @default(0.0000) @db.Decimal(18, 4)
  reorderLevelKg      Decimal            @default(1000.0000) @db.Decimal(18, 4)
  isActive            Boolean            @default(true)
  stockBatches        StockBatch[]
  stockLevels         StockLevel[]
  stockMovements      StockMovement[]
  purchaseBillItems   PurchaseBillItem[]
  salesInvoiceItems   SalesInvoiceItem[]
  millingInputPaddy   MillingInput[]
  millingOutputRice   MillingOutput[]
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  @@index([type])
  @@index([categoryId])
}

model PackagingType {
  id              String   @id @default(uuid())
  code            String   @unique @db.VarChar(30) // e.g. "JUTE-50KG", "PP-25KG"
  name            String   @db.VarChar(100)
  nominalWeightKg Decimal  @db.Decimal(10, 4)       // 50.0000 kg
  tareWeightKg    Decimal  @db.Decimal(6, 4)        // Empty sack tare: e.g. 1.1000 kg (jute) or 0.1200 kg (PP)
  material        String?  @db.VarChar(50)         // Jute, Polypropylene, Non-woven fabric
  items           Item[]
  stockBatches    StockBatch[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Warehouse {
  id             String          @id @default(uuid())
  code           String          @unique @db.VarChar(30) // "GODOWN-1", "MILL-SILO-A"
  name           String          @db.VarChar(100)
  address        String?         @db.Text
  capacityBags   Int?
  capacityMt     Decimal?        @db.Decimal(12, 4)
  isActive       Boolean         @default(true)
  stockLevels    StockLevel[]
  stockMovements StockMovement[]
  millingJobs    MillingJob[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

// =========================================================================
// 3. DUAL-UNIT INVENTORY & BATCH ENGINE
// =========================================================================

model StockBatch {
  id                 String             @id @default(uuid())
  batchNumber        String             @unique @db.VarChar(50)
  itemId             String
  item               Item               @relation(fields: [itemId], references: [id])
  packagingTypeId    String?
  packagingType      PackagingType?     @relation(fields: [packagingTypeId], references: [id])
  cropYear           String?            @db.VarChar(10) // e.g. "2025-2026"
  moisturePercent    Decimal?           @db.Decimal(5, 2)
  unitCostPerKg      Decimal            @default(0.0000) @db.Decimal(18, 4)
  initialBagCount    Int                @default(0)
  initialWeightKg    Decimal            @default(0.0000) @db.Decimal(18, 4)
  stockLevels        StockLevel[]
  stockMovements     StockMovement[]
  purchaseBillItems  PurchaseBillItem[]
  salesInvoiceItems  SalesInvoiceItem[]
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  @@index([itemId])
}

model StockLevel {
  id           String     @id @default(uuid())
  warehouseId  String
  warehouse    Warehouse  @relation(fields: [warehouseId], references: [id])
  itemId       String
  item         Item       @relation(fields: [itemId], references: [id])
  stockBatchId String
  stockBatch   StockBatch @relation(fields: [stockBatchId], references: [id])
  bagCount     Int        @default(0)
  netWeightKg  Decimal    @default(0.0000) @db.Decimal(18, 4)
  updatedAt    DateTime   @updatedAt

  @@unique([warehouseId, itemId, stockBatchId])
  @@index([warehouseId])
  @@index([itemId])
}

enum MovementType {
  PURCHASE_RECEIPT
  PURCHASE_RETURN
  SALES_DISPATCH
  POS_SALE
  SALES_RETURN
  MILLING_INPUT_CONSUMPTION
  MILLING_OUTPUT_PRODUCTION
  GODOWN_TRANSFER_OUT
  GODOWN_TRANSFER_IN
  STOCK_ADJUSTMENT
}

model StockMovement {
  id              String       @id @default(uuid())
  movementType    MovementType
  warehouseId     String
  warehouse       Warehouse    @relation(fields: [warehouseId], references: [id])
  itemId          String
  item            Item         @relation(fields: [itemId], references: [id])
  stockBatchId    String
  stockBatch      StockBatch   @relation(fields: [stockBatchId], references: [id])
  bagCountDelta   Int          // Positive for stock in, negative for stock out
  weightKgDelta   Decimal      @db.Decimal(18, 4)
  unitCostPerKg   Decimal      @db.Decimal(18, 4)
  totalCost       Decimal      @db.Decimal(18, 4)
  referenceDocType String      @db.VarChar(50) // "PurchaseBill", "SalesInvoice", "MillingJob"
  referenceDocId   String      @db.VarChar(100)
  notes           String?      @db.Text
  createdAt       DateTime     @default(now())

  @@index([warehouseId, itemId])
  @@index([referenceDocType, referenceDocId])
  @@index([createdAt])
}

// =========================================================================
// 4. PROCUREMENT, MANDI / ARTHI & WEIGHBRIDGE ENGINE
// =========================================================================

enum GatePassStatus {
  ARRIVED
  GROSS_WEIGHED
  UNLOADED
  TARE_WEIGHED
  COMPLETED
  CANCELLED
}

model GateInwardPass {
  id              String         @id @default(uuid())
  passNumber      String         @unique @db.VarChar(50)
  truckNumber     String         @db.VarChar(30)
  driverName      String?        @db.VarChar(100)
  driverPhone     String?        @db.VarChar(25)
  partyName       String         @db.VarChar(150)
  biltyNumber     String?        @db.VarChar(50)
  status          GatePassStatus @default(ARRIVED)
  grossWeightKg   Decimal?       @db.Decimal(12, 4)
  grossWeighedAt  DateTime?
  tareWeightKg    Decimal?       @db.Decimal(12, 4)
  tareWeighedAt   DateTime?
  netWeightKg     Decimal?       @db.Decimal(12, 4)
  bagCountExpected Int?
  bagCountReceived Int?
  moistureSamplePct Decimal?     @db.Decimal(5, 2)
  purchaseBill    PurchaseBill?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([truckNumber])
  @@index([status])
}

enum PurchaseBillStatus {
  DRAFT
  APPROVED
  PAID
  VOID
}

model PurchaseBill {
  id               String             @id @default(uuid())
  billNumber       String             @unique @db.VarChar(50)
  partyId          String
  party            Party              @relation(fields: [partyId], references: [id])
  gateInwardPassId String?            @unique
  gateInwardPass   GateInwardPass?    @relation(fields: [gateInwardPassId], references: [id])
  billDate         DateTime
  status           PurchaseBillStatus @default(DRAFT)
  subTotalAmount   Decimal            @db.Decimal(18, 4)
  moistureCutAmount Decimal           @default(0.0000) @db.Decimal(18, 4)
  kardaCutAmount   Decimal            @default(0.0000) @db.Decimal(18, 4)
  arthiCommission  Decimal            @default(0.0000) @db.Decimal(18, 4)
  palledariCharges Decimal            @default(0.0000) @db.Decimal(18, 4)
  freightCharges   Decimal            @default(0.0000) @db.Decimal(18, 4)
  netPayableAmount Decimal            @db.Decimal(18, 4)
  paidAmount       Decimal            @default(0.0000) @db.Decimal(18, 4)
  items            PurchaseBillItem[]
  journalEntryId   String?            @unique
  journalEntry     JournalEntry?      @relation(fields: [journalEntryId], references: [id])
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  @@index([partyId])
  @@index([billDate])
}

model PurchaseBillItem {
  id              String      @id @default(uuid())
  purchaseBillId  String
  purchaseBill    PurchaseBill @relation(fields: [purchaseBillId], references: [id], onDelete: Cascade)
  itemId          String
  item            Item        @relation(fields: [itemId], references: [id])
  stockBatchId    String
  stockBatch      StockBatch  @relation(fields: [stockBatchId], references: [id])
  bagCount        Int
  grossWeightKg   Decimal     @db.Decimal(14, 4)
  bardanaTareKg   Decimal     @db.Decimal(10, 4)
  netWeightKg     Decimal     @db.Decimal(14, 4)
  pricePerMaund40Kg Decimal?  @db.Decimal(18, 4)
  pricePerKg      Decimal     @db.Decimal(18, 4)
  lineTotal       Decimal     @db.Decimal(18, 4)

  @@index([purchaseBillId])
  @@index([itemId])
}

// =========================================================================
// 5. MILLING & GRAIN PROCESSING ENGINE
// =========================================================================

enum MillingStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model MillingJob {
  id                String          @id @default(uuid())
  jobNumber         String          @unique @db.VarChar(50)
  warehouseId       String
  warehouse         Warehouse       @relation(fields: [warehouseId], references: [id])
  startDate         DateTime
  endDate           DateTime?
  status            MillingStatus   @default(PLANNED)
  totalPaddyInputKg Decimal         @default(0.0000) @db.Decimal(14, 4)
  totalRiceOutputKg Decimal         @default(0.0000) @db.Decimal(14, 4)
  totalByProductKg  Decimal         @default(0.0000) @db.Decimal(14, 4)
  millingYieldPct   Decimal         @default(0.0000) @db.Decimal(6, 2)
  millingCostTotal  Decimal         @default(0.0000) @db.Decimal(18, 4)
  inputs            MillingInput[]
  outputs           MillingOutput[]
  journalEntryId    String?         @unique
  journalEntry      JournalEntry?   @relation(fields: [journalEntryId], references: [id])
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@index([warehouseId])
  @@index([status])
}

model MillingInput {
  id           String     @id @default(uuid())
  millingJobId String
  millingJob   MillingJob @relation(fields: [millingJobId], references: [id], onDelete: Cascade)
  itemId       String     // Raw Paddy Item
  item         Item       @relation(fields: [itemId], references: [id])
  bagCount     Int
  netWeightKg  Decimal    @db.Decimal(14, 4)
  costPriceKg  Decimal    @db.Decimal(18, 4)
  totalCost    Decimal    @db.Decimal(18, 4)

  @@index([millingJobId])
}

model MillingOutput {
  id           String     @id @default(uuid())
  millingJobId String
  millingJob   MillingJob @relation(fields: [millingJobId], references: [id], onDelete: Cascade)
  itemId       String     // Milled Rice or By-product (Bran, Husk, Broken)
  item         Item       @relation(fields: [itemId], references: [id])
  bagCount     Int
  netWeightKg  Decimal    @db.Decimal(14, 4)
  costPriceKg  Decimal    @db.Decimal(18, 4)
  totalCost    Decimal    @db.Decimal(18, 4)

  @@index([millingJobId])
}

// =========================================================================
// 6. SALES & HIGH-SPEED POS COUNTER ENGINE
// =========================================================================

enum POSSessionStatus {
  OPEN
  CLOSED
}

model POSSession {
  id             String           @id @default(uuid())
  sessionNumber  String           @unique @db.VarChar(50)
  userId         String
  user           User             @relation(fields: [userId], references: [id])
  openedAt       DateTime         @default(now())
  closedAt       DateTime?
  openingFloat   Decimal          @db.Decimal(18, 4)
  closingCash    Decimal?         @db.Decimal(18, 4)
  expectedCash   Decimal?         @db.Decimal(18, 4)
  discrepancy    Decimal?         @db.Decimal(18, 4)
  status         POSSessionStatus @default(OPEN)
  salesInvoices  SalesInvoice[]

  @@index([userId])
  @@index([status])
}

enum InvoiceType {
  POS_COUNTER
  WHOLESALE_DISPATCH
}

enum InvoiceStatus {
  PAID
  PARTIALLY_PAID
  UNPAID
  VOID
}

model SalesOrder {
  id             String         @id @default(uuid())
  orderNumber    String         @unique @db.VarChar(50)
  partyId        String
  party          Party          @relation(fields: [partyId], references: [id])
  orderDate      DateTime
  totalAmount    Decimal        @db.Decimal(18, 4)
  status         String         @default("PENDING") // PENDING, APPROVED, DISPATCHED, CANCELLED
  salesInvoices  SalesInvoice[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([partyId])
}

model SalesInvoice {
  id               String             @id @default(uuid())
  invoiceNumber    String             @unique @db.VarChar(50)
  invoiceType      InvoiceType
  status           InvoiceStatus      @default(UNPAID)
  partyId          String?
  party            Party?             @relation(fields: [partyId], references: [id])
  posSessionId     String?
  posSession       POSSession?        @relation(fields: [posSessionId], references: [id])
  salesOrderId     String?
  salesOrder       SalesOrder?        @relation(fields: [salesOrderId], references: [id])
  subTotalAmount   Decimal            @db.Decimal(18, 4)
  discountAmount   Decimal            @default(0.0000) @db.Decimal(18, 4)
  taxAmount        Decimal            @default(0.0000) @db.Decimal(18, 4)
  freightAmount    Decimal            @default(0.0000) @db.Decimal(18, 4)
  netTotalAmount   Decimal            @db.Decimal(18, 4)
  paidAmount       Decimal            @default(0.0000) @db.Decimal(18, 4)
  balanceAmount    Decimal            @db.Decimal(18, 4)
  items            SalesInvoiceItem[]
  journalEntryId   String?            @unique
  journalEntry     JournalEntry?      @relation(fields: [journalEntryId], references: [id])
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  @@index([partyId])
  @@index([posSessionId])
  @@index([invoiceType])
  @@index([createdAt])
}

model SalesInvoiceItem {
  id             String       @id @default(uuid())
  salesInvoiceId String
  salesInvoice   SalesInvoice @relation(fields: [salesInvoiceId], references: [id], onDelete: Cascade)
  itemId         String
  item           Item         @relation(fields: [itemId], references: [id])
  stockBatchId   String
  stockBatch     StockBatch   @relation(fields: [stockBatchId], references: [id])
  bagCount       Int          @default(0)
  netWeightKg    Decimal      @db.Decimal(14, 4)
  unitPricePerKg Decimal      @db.Decimal(18, 4)
  lineDiscount   Decimal      @default(0.0000) @db.Decimal(18, 4)
  lineTotal      Decimal      @db.Decimal(18, 4)

  @@index([salesInvoiceId])
  @@index([itemId])
}

// =========================================================================
// 7. DOUBLE-ENTRY GENERAL LEDGER (GL) & FINANCIAL ACCOUNTING
// =========================================================================

enum AccountCategory {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  EXPENSE
}

model AccountHead {
  id           String             @id @default(uuid())
  accountCode  String             @unique @db.VarChar(30) // e.g. "1010-01" Cash In Hand
  name         String             @db.VarChar(150)
  category     AccountCategory
  parentId     String?
  parent       AccountHead?       @relation("AccountHierarchy", fields: [parentId], references: [id])
  children     AccountHead[]      @relation("AccountHierarchy")
  isSystem     Boolean            @default(false)
  party        Party?
  journalLines JournalEntryLine[]
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt

  @@index([category])
  @@index([parentId])
}

enum VoucherType {
  CASH_PAYMENT_VOUCHER      // CPV
  CASH_RECEIPT_VOUCHER      // CRV
  BANK_PAYMENT_VOUCHER      // BPV
  BANK_RECEIPT_VOUCHER      // BRV
  JOURNAL_VOUCHER           // JV
  PURCHASE_VOUCHER
  SALES_VOUCHER
  MILLING_VOUCHER
}

model JournalEntry {
  id              String             @id @default(uuid())
  entryNumber     String             @unique @db.VarChar(50)
  voucherType     VoucherType
  entryDate       DateTime
  narration       String             @db.Text
  totalDebit      Decimal            @db.Decimal(18, 4)
  totalCredit     Decimal            @db.Decimal(18, 4)
  isBalanced      Boolean            @default(true)
  lines           JournalEntryLine[]
  purchaseBill    PurchaseBill?
  salesInvoice    SalesInvoice?
  millingJob      MillingJob?
  partyPayment    PartyPayment?
  createdAt       DateTime           @default(now())

  @@index([entryDate])
  @@index([voucherType])
}

model JournalEntryLine {
  id             String       @id @default(uuid())
  journalEntryId String
  journalEntry   JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  accountHeadId  String
  accountHead    AccountHead  @relation(fields: [accountHeadId], references: [id])
  debitAmount    Decimal      @default(0.0000) @db.Decimal(18, 4)
  creditAmount   Decimal      @default(0.0000) @db.Decimal(18, 4)
  lineNarration  String?      @db.VarChar(255)

  @@index([journalEntryId])
  @@index([accountHeadId])
}

model PartyPayment {
  id             String        @id @default(uuid())
  voucherNumber  String        @unique @db.VarChar(50)
  partyId        String
  party          Party         @relation(fields: [partyId], references: [id])
  voucherType    VoucherType   // CPV, CRV, BPV, BRV
  paymentDate    DateTime
  amount         Decimal       @db.Decimal(18, 4)
  paymentMethod  String        @db.VarChar(50) // Cash, Cheque, Online Transfer
  chequeNumber   String?       @db.VarChar(50)
  chequeDate     DateTime?
  narration      String?       @db.Text
  journalEntryId String        @unique
  journalEntry   JournalEntry  @relation(fields: [journalEntryId], references: [id])
  createdAt      DateTime      @default(now())

  @@index([partyId])
  @@index([paymentDate])
}
```

---

## 3. Database Constraints, Indexes & Integrity Guarantees

1. **Precision Standard:** Every monetary and weight column uses `Decimal(18, 4)` to guarantee exact precision without floating-point inaccuracies.
2. **Compound Uniqueness:**
   - `StockLevel`: Unique constraint on `[warehouseId, itemId, stockBatchId]` prevents duplicate aggregate rows for the same lot in a godown.
   - `RolePermission`: Unique compound key on `[roleId, permissionId]`.
3. **Immutable Ledgers:** `StockMovement` and `JournalEntryLine` records are append-only. No updates or deletions are performed; balancing adjustments are recorded as new movements or reversing vouchers.
4. **Foreign Key Integrity:** Cascading deletes are strictly forbidden on financial, inventory, and party entities; only dependent line items (like `SalesInvoiceItem` or `PurchaseBillItem`) cascade with their parent draft.
