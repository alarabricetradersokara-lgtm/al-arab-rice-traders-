# DEVELOPMENT ROADMAP: AL ARAB RICE TRADERS ERP & POS

**Version:** 1.0.0  
**Project:** Al Arab Rice Traders Enterprise ERP & POS System  
**Timeline:** 8 Sequential Implementation Phases  
**Methodology:** Incremental Agile Delivery with Milestone Gateways

---

## 1. Project Phase Overview

```
+---------------------------------------------------------------------------------------+
|                                    ROADMAP PHASES                                     |
|                                                                                       |
|   [Phase 1] Foundation, DB & Auth Engine                                              |
|       |                                                                               |
|       v                                                                               |
|   [Phase 2] Master Data Management (Items, Varieties, Parties, Godowns)               |
|       |                                                                               |
|       v                                                                               |
|   [Phase 3] Dual-Unit Inventory Engine (Bags + Net Weight)                            |
|       |                                                                               |
|       v                                                                               |
|   [Phase 4] Procurement, Mandi/Arthi Gate Inward & Weighbridge Operations            |
|       |                                                                               |
|       v                                                                               |
|   [Phase 5] Rice Milling, Processing & Yield Conversion Engine                        |
|       |                                                                               |
|       v                                                                               |
|   [Phase 6] High-Speed Counter POS & Wholesale Sales Dispatch                         |
|       |                                                                               |
|       v                                                                               |
|   [Phase 7] Double-Entry Financial Accounting & Party Khatabook Ledger                |
|       |                                                                               |
|       v                                                                               |
|   [Phase 8] Business Intelligence, Recharts Analytics, Audit & Hardening              |
+---------------------------------------------------------------------------------------+
```

---

## 2. Phase-by-Phase Detailed Engineering Blueprint

### Phase 1: Foundation, DB Initialization & Authentication System
*Goal: Establish robust monorepo workspace, database connectivity, security middleware, and JWT authentication.*

- **Backend Deliverables:**
  - Initialize Node.js + Express + TypeScript project (`backend/`).
  - Configure PostgreSQL database connectivity and Prisma ORM CLI.
  - Implement Prisma migration pipeline with baseline schema.
  - Build Auth module:
    - User registration, login with bcrypt password hashing (12 rounds).
    - JWT token generation (Access token: 15 min, Refresh token: 7 days).
    - Secure refresh token rotation and revocation.
    - Authentication middleware (`requireAuth`) and error handling pipeline.
  - Seed script: Super Admin credentials and standard role definitions.
- **Frontend Deliverables:**
  - Initialize React 19 + TypeScript + Vite project (`frontend/`).
  - Install and configure Tailwind CSS + shadcn/ui component primitives.
  - Set up TanStack Query v5 provider and Axios/Fetch API client with JWT interceptor.
  - Build modern, responsive Login Screen with validation and persistent session state.
- **Milestone Gate 1:**
  - Super admin can log in, receive valid tokens, and access protected dashboard route.
  - Token refresh occurs transparently on 401 response.

---

### Phase 2: Master Data Management & Role-Based Access Control
*Goal: Build the foundational data registries essential for all rice trading operations.*

- **Backend Deliverables:**
  - RBAC Middleware (`checkPermission('parties:create')`, etc.).
  - **Party Management Module:**
    - Customers, Suppliers, Arthis (Commission Brokers), Farmers, Transporters.
    - Fields: NTN/CNIC, Credit Limit, Payment Terms, Opening Balance, Phone, Address.
  - **Rice Catalog & Classification Module:**
    - Grain Types: Basmati, Non-Basmati, Broken.
    - Varieties: Super Kernel Basmati, 1121 Kainat, Basmati 385, IRRI-6, IRRI-9, PK 386.
    - Processing Grades: Raw (White), Steam, Sella (Parboiled), Brown.
    - Packaging Units: 50kg Jute, 50kg PP, 25kg PP, 10kg Non-Woven, Loose.
  - **Godown & Warehouse Module:**
    - Storage Locations: Godown 1, Godown 2, Silo A, Silo B, POS Shop Floor.
- **Frontend Deliverables:**
  - Clean layout: Collapsible Sidebar, Topbar with User Profile and Notifications.
  - DataTables with search, sorting, filtering, and pagination for Parties, Items, and Godowns.
  - Modal dialogs with Zod form validation for creating/editing master records.
- **Milestone Gate 2:**
  - Admins can manage all parties, rice varieties, and storage locations with role-based restriction.

---

### Phase 3: Dual-Unit Inventory Engine & Multi-Godown Stock Ledger
*Goal: Implement the core catch-weight stock tracking engine that balances Bags and Net Kilograms.*

- **Backend Deliverables:**
  - Inventory Stock Ledger (`StockMovement` table):
    - Append-only ledger recording `quantityBagsDelta`, `weightKgDelta`, and `unitCost`.
  - Batch Management: Batch numbering, manufacturing date, grain moisture rating, purchase lot link.
  - Real-time stock calculation service aggregating available bags and net weight per Godown.
  - Inter-Godown transfer workflows with in-transit tracking and approval.
  - Stock Adjustment service for physical audit count reconciliation with variance tracking.
- **Frontend Deliverables:**
  - Real-Time Godown Stock Matrix View: Shows stock by Variety, Grade, Bag Count, and Total Weight.
  - Stock Movement History Ledger view with forensic drill-down.
  - Inter-Godown Stock Transfer form with live source availability check.
  - Stock Adjustment interface with theoretical vs. physical count variance calculator.
- **Milestone Gate 3:**
  - Inventory accurately prevents negative stock, tracks dual-UOM without drift, and logs all movements.

---

### Phase 4: Procurement, Mandi / Arthi Gate Inward & Weighbridge Operations
*Goal: Automate grain reception from grain markets (Mandi), farmers, and mill procurement.*

- **Backend Deliverables:**
  - **Gate Inward Pass (GINP):** Truck number, Driver ID, Party (Farmer/Arthi), Arrival time.
  - **Weighbridge (Kanda) Sub-module:**
    - First Weight (Gross Truck Weight).
    - Unloading at designated Godown.
    - Second Weight (Tare Truck Weight).
    - Net Weight Calculation = Gross - Tare - Bardana (Bag Tare Deduction).
  - **Quality Inspection & Moisture Cuts (Karda):**
    - Laboratory moisture test (Standard: 14%; excess deducted as price or weight cut).
    - Broken percentage and foreign matter deduction.
  - **Purchase Invoice Generator:**
    - Line items with Dual-UOM pricing (rate per 40kg Maund, per MT, or per Bag).
    - Arthi Commission, Palledari (Labor), Chungi (Market cess), and Freight deduction.
    - Automatic double-entry GL posting: Debit Inventory, Credit Accounts Payable (Party).
- **Frontend Deliverables:**
  - Gate Inward entry screen with rapid vehicle entry.
  - Weighbridge Kanda slip generator with direct print support.
  - Procurement Bill calculation wizard with live breakdown of deductions and net payable.
- **Milestone Gate 4:**
  - A truck of raw paddy arrives, gets weighed, tested, unloaded, and billed with complete ledger updates.

---

### Phase 5: Rice Milling, Processing & Yield Conversion Engine
*Goal: Model the industrial transformation of raw Paddy into high-grade polished rice and by-products.*

- **Backend Deliverables:**
  - **Milling Job Order:**
    - Raw Paddy input issuance (Dhan Bags + Weight).
    - Machine line assignment and batch scheduling.
  - **Yield & By-Product Reconciliation Service:**
    - Output recording: Head Rice (Grade A), Second Grade, Broken Grains (*Tota / Kani*).
    - By-Product recording: Rice Bran (*Phak/Kunda*), Rice Husk (*Khol/Bhoosa*), Waste/Dust.
    - Automatic yield efficiency calculation:
      $$\text{Yield \%} = \frac{\text{Total Output Weight (Rice + By-Products)}}{\text{Raw Paddy Input Weight}} \times 100$$
    - Production cost allocation: Distributes paddy purchase cost and milling overhead to finished goods.
  - Automatic inventory transfer: Consumes Raw Paddy; produces Finished Rice and By-products into Godown.
- **Frontend Deliverables:**
  - Milling Run creation form with input batch selection.
  - Output recording screen with real-time yield percentage indicator and benchmark comparison.
  - Production batch summary card with yield analytics.
- **Milestone Gate 5:**
  - Milling job successfully converts 10,000 kg paddy into finished rice and by-products with cost absorption.

---

### Phase 6: High-Speed Counter POS & Wholesale Sales Dispatch
*Goal: Deliver ultra-fast retail counter checkout and controlled wholesale distribution.*

- **Backend Deliverables:**
  - **POS Register Session Management:**
    - Open Shift: Cashier assignment, opening float entry.
    - Close Shift: Cash drawer count, card/bank slips total, over/short variance logging.
  - **High-Speed Counter POS API:**
    - Sub-second item lookup by barcode or shortcut code.
    - Real-time stock verification with optimistic locking.
    - Multiple payment split: Cash, Bank Transfer, Customer Credit / Khata.
    - Instant receipt generation and automatic GL posting.
  - **Wholesale Order & Outward Gate Pass:**
    - Sales Order -> Credit Limit & Aging Verification -> Delivery Order (DO).
    - Gate Outward Pass (GOP): Truck loading, outbound weighbridge tare/gross check.
    - Sales Invoice generation with automated customer ledger posting.
- **Frontend Deliverables:**
  - **Optimized POS Counter UI:**
    - Full keyboard navigation (F1-F12 shortcuts: F2=New Bill, F4=Payment, F8=Hold, F9=Print).
    - Bag scanner and loose weight input.
    - Direct ESC/POS 80mm thermal receipt printing.
  - Wholesale Dispatch Dashboard: Order tracking, dispatch status, bill of lading / bilty details.
- **Milestone Gate 6:**
  - Cashier performs retail checkout in under 15 seconds; wholesale truck departs with verified Gate Pass.

---

### Phase 7: Double-Entry Financial Accounting & Party Khatabook Ledger
*Goal: Complete financial automation with real-time General Ledger, Trial Balance, and Khatabook statements.*

- **Backend Deliverables:**
  - **Hierarchical Chart of Accounts (COA):**
    - 5 Root Classes: Assets (1000), Liabilities (2000), Equity (3000), Revenue (4000), Expenses (5000).
    - System Accounts: Accounts Receivable, Accounts Payable, Cash in Hand, POS Till, Bank, Sales, COGS, Inventory, Weight Variance, Milling Expense.
  - **Double-Entry Transaction Engine:**
    - Atomic journal posting helper: guarantees $\sum \text{Debits} = \sum \text{Credits}$.
    - Automatic posting triggers for: Purchases, Sales, POS Receipts, Payments, Stock Adjustments.
  - **Voucher Management Module:**
    - Cash Payment Voucher (CPV), Cash Receipt Voucher (CRV).
    - Bank Payment Voucher (BPV), Bank Receipt Voucher (BRV).
    - Journal Voucher (JV).
  - **Party Khatabook & Aging Analysis:**
    - Real-time running balance party statement with debit, credit, and running balance.
    - Receivables aging (0-30 days, 31-60 days, 61-90 days, 90+ days).
- **Frontend Deliverables:**
  - Chart of Accounts visual tree viewer.
  - Voucher entry interface with dynamic debit/credit line addition.
  - Interactive Party Khatabook view with PDF statement export and WhatsApp summary generator.
  - Real-time Trial Balance, Profit & Loss Statement, and Balance Sheet.
- **Milestone Gate 7:**
  - Financial statements match operational stock and invoice values with zero manual reconciliation required.

---

### Phase 8: Business Intelligence, Analytics Dashboard, Audit & Hardening
*Goal: Provide executive analytics, comprehensive audit trail, performance tuning, and production readiness.*

- **Backend Deliverables:**
  - Performance optimization: DB index tuning, query caching, connection pooling.
  - Comprehensive Audit Trail inspection API (searchable by user, action, entity, date range).
  - Automated database backup scripts and disaster recovery procedures.
- **Frontend Deliverables:**
  - **Executive Analytics Dashboard (Recharts):**
    - Daily & Monthly Sales revenue trend lines.
    - Inventory valuation breakdown by rice variety (Pie / Donut chart).
    - Procurement cost per metric ton comparison over time.
    - Milling yield efficiency radar / bar chart.
    - Top 10 customer accounts by volume and outstanding balance.
  - Audit Trail Log Explorer with diff viewer (before vs. after state).
- **Milestone Gate 8:**
  - Production-ready system with sub-100ms API response times, full audit coverage, and responsive UX.

---

## 3. Risk Matrix & Quality Assurance Strategy

| Risk Factor | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Concurrent POS & Wholesale Inventory Depletion** | High | PostgreSQL row-level locking (`SELECT FOR UPDATE`) on stock batches inside atomic transactions. |
| **Financial / Inventory Drift** | Critical | No stock movement is committed without its corresponding double-entry journal lines in the same transaction. |
| **Network Hiccups at POS Counter** | Medium | Local browser storage cart preservation; retry queue for offline transaction submission. |
| **Weighbridge Clerk Tampering** | High | Direct RS232 / Web Serial scale reading; uneditable weight fields; photo/camera log link option. |
| **Excess Moisture Rice Spoilage** | High | Mandatory moisture test parameter during Gate Inward with automated threshold warnings. |
