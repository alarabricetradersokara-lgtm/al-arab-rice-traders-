# PROJECT ARCHITECTURE: AL ARAB RICE TRADERS ERP & POS SYSTEM

**Version:** 1.0.0  
**Domain:** Enterprise Agricultural Commodity & Rice Trading ERP / POS  
**Classification:** Core System Architecture Specification  
**Status:** Architecture Design Phase (Awaiting User Sign-Off)

---

## 1. Executive Summary & Architectural Goals

**AL ARAB RICE TRADERS** is a mission-critical, enterprise-grade Enterprise Resource Planning (ERP) and Point of Sale (POS) platform tailored specifically to the unique, high-volume realities of the rice trading and grain milling industry.

Commodity grain trading operates under operational dynamics that generic retail/ERP systems fail to handle:
1. **Dual-Unit (Catch Weight) Dynamics:** Rice is handled simultaneously by **Bag Count** (e.g., 50 kg jute bag, 25 kg PP woven bag) and actual **Certified Net Weight** (kg / metric tons / maunds). Bags vary in tare and moisture, requiring dual-unit inventory accounting.
2. **Quality & Grade Variations:** Grains are valued based on moisture percentage, grain length (mm), broken percentage (Tota/Kani), and processing types (Super Kernel Basmati, 1121 Steam, Kainat Parboiled/Sella, White/Raw).
3. **Mandi (Grain Market) Procurement & Arhat:** Managing commission agents (*Arthis*), market committee cesses, labor (*Palledari*), empty sack deductions (*Bardana*), and weighbridge (*Kanda*) gross/tare slips.
4. **Milling & Processing Yields:** Tracking transformation of raw Paddy (*Dhan*) into Milled Rice, Head Rice, Broken Grains (*Tota*), Rice Bran (*Phak/Kunda*), and Husk (*Bhoosa*).
5. **Real-Time Double-Entry Financial Consistency:** Guaranteeing that every stock movement, gate dispatch, POS cash sale, or credit disbursement immediately reflects in immutable General Ledger (GL) journal entries with zero reconciliation lag.

---

## 2. System Architecture & Topology

The system uses a **Decoupled Client-Server Monorepo** architecture ensuring clean boundaries between the frontend presentation tier, backend business service engine, database persistence layer, and external physical hardware (weighbridges, barcode scanners, thermal POS printers).

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT TIER                                        |
|                                                                                       |
|   +------------------------------------+    +-------------------------------------+   |
|   |         Web Back-Office ERP        |    |       High-Speed Counter POS        |   |
|   |  - React 19 + TypeScript + Vite    |    |  - Optimized Keyboard-First UI      |   |
|   |  - Tailwind CSS + shadcn/ui        |    |  - Offline Caching / Resilience     |   |
|   |  - TanStack Query v5 + React Hook  |    |  - Direct ESC/POS Thermal Printing  |   |
|   |  - Recharts Analytics Dashboard    |    |  - Weighing Scale Serial / WebUSB   |   |
|   +-----------------+------------------+    +------------------+------------------+   |
+---------------------|------------------------------------------|----------------------+
                      |                                          |
                      | HTTPS / Secure WSS (JSON REST API)       |
                      v                                          v
+---------------------------------------------------------------------------------------+
|                               API GATEWAY & MIDDLEWARE TIER                           |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   |  - Reverse Proxy / TLS Termination (Nginx or Cloudflare)                      |   |
|   |  - Rate Limiting (express-rate-limit)                                         |   |
|   |  - CORS & Security Headers (Helmet.js)                                        |   |
|   |  - Request Correlation ID Injection & Structured Request Logging (Winston)   |   |
|   |  - JWT Authentication & Granular RBAC Permission Enforcer                     |   |
|   |  - Schema Validation Pipeline (Zod Middleware)                                |   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                           CORE BACKEND SERVICE ENGINE (Node.js)                       |
|                                                                                       |
|   +--------------------+  +--------------------+  +--------------------+              |
|   | Procurement Module |  |  Inventory Module  |  |   Milling Module   |              |
|   | - Gate Inward Pass |  | - Dual-UOM Ledger  |  | - Yield Estimation |              |
|   | - Mandi / Arthi Bill| | - Batch Tracking   |  | - Output Sorting   |              |
|   | - Moisture Cuts    |  | - Godown Transfers |  | - By-product Stock |              |
|   +--------------------+  +--------------------+  +--------------------+              |
|   +--------------------+  +--------------------+  +--------------------+              |
|   | Sales & POS Module |  | General Ledger GL  |  | Audit & Security   |              |
|   | - Counter POS Flow |  | - Double-Entry Engine| | - Tamper-Proof Log |              |
|   | - Wholesale DO     |  | - Party Khatabook  |  | - Session Manager  |              |
|   | - Gate Outward Pass|  | - Trial Balance    |  | - Event Bus / Hooks|              |
|   +--------------------+  +--------------------+  +--------------------+              |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                           PERSISTENCE & DATA STORAGE TIER                             |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   |                         PostgreSQL 16 Enterprise RDBMS                        |   |
|   |   - Schema Management & Migrations via Prisma ORM                             |   |
|   |   - Strict ACID Transactions ($transaction with serializable isolation)       |   |
|   |   - Table Partitioning for Audit Logs & High-Volume Stock Movements           |   |
|   |   - Row-Level Locking (`SELECT FOR UPDATE`) on Critical Inventory Balances    |   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
```

---

## 3. Technology Stack Matrix

| Layer | Recommended Technology | Technical Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + TypeScript + Vite** | Blazing-fast HMR, strict type safety, modular component lifecycle, optimal bundle sizing. |
| **UI Design System** | **Tailwind CSS + shadcn/ui** | Accessible, copy-paste headless primitives (Radix UI), high customizability, light/dark mode ready. |
| **State & Data Fetching**| **TanStack Query (React Query v5)** | Declarative server-state caching, automatic background invalidation, optimistic updates for snappy POS. |
| **Icons & Visuals** | **Lucide React** | Clean, lightweight icon suite with consistent stroke weights. |
| **Data Visualization** | **Recharts** | Declarative charting for sales trends, inventory by variety, milling yields, and profit margins. |
| **Backend Runtime** | **Node.js (LTS v24) + Express** | High throughput event loop, non-blocking I/O ideal for multi-terminal POS and high-volume ERP APIs. |
| **Language** | **TypeScript (Strict Mode)** | Shared types/contracts between client and server, zero runtime type mismatch errors. |
| **Database** | **PostgreSQL 16** | Uncompromising ACID compliance, robust locking mechanisms, JSONB support for dynamic specs, native table partitioning. |
| **ORM & Data Layer** | **Prisma ORM** | Type-safe queries, automated migrations, declarative schema definition, relations and nested writes. |
| **Authentication** | **JWT (Access + Refresh) + bcrypt** | Stateless scalable authentication, token rotation, bcrypt password hashing with salt factor 12. |
| **Validation Layer** | **Zod** | Single source of truth for runtime validation; seamlessly infers static TypeScript types. |
| **Logging & Auditing** | **Winston + Daily Rotate File** | Tiered JSON logging (info, warn, error) with correlation IDs and forensic database audit trails. |
| **Hardware Connectors**| **Web Serial / ESC/POS Protocol** | Native thermal receipt generation and digital weighbridge serial communication. |

---

## 4. Project Workspace Organization

To ensure maintainability, scalability, and clean modular boundaries, the repository will be structured as a standardized, monorepo-friendly project layout:

```
al-arab-rice-traders/
├── docs/                               # Architectural documents & design specs
│   ├── PROJECT_ARCHITECTURE.md
│   ├── DEVELOPMENT_ROADMAP.md
│   ├── DATABASE_DESIGN.md
│   └── BUSINESS_WORKFLOWS.md
├── backend/                            # Express + TypeScript Server
│   ├── prisma/
│   │   ├── schema.prisma               # Prisma Schema with complete models
│   │   ├── seed.ts                     # Initial seed (Admin, Roles, Chart of Accounts, Rice Varieties)
│   │   └── migrations/                 # Versioned SQL migration history
│   ├── src/
│   │   ├── @types/                     # Express request extensions, custom typings
│   │   ├── config/                     # Environment validation, database client, constants
│   │   ├── middleware/                 # Auth guard, RBAC, error handler, rate limiter, request logger
│   │   ├── modules/                    # Feature modules (Clean Layered Architecture)
│   │   │   ├── auth/                   # Login, register, token refresh, password reset
│   │   │   ├── users/                  # User accounts, role assignment, permissions
│   │   │   ├── parties/                # Customers, Suppliers, Arthis (Brokers), Farmers
│   │   │   ├── inventory/              # Items, Varieties, Godowns, Batches, Stock Movements
│   │   │   ├── procurement/            # Inward Gate Pass, Weighbridge Kanda, Purchase Bills
│   │   │   ├── milling/                # Paddy De-husking, Polishing, Yield & By-product Batches
│   │   │   ├── pos/                    # Fast Counter POS, Shift Register (Open/Close), Barcode Lookups
│   │   │   ├── sales/                  # Wholesale Orders, Dispatch, Delivery Challans, Gate Outward
│   │   │   ├── accounting/             # Chart of Accounts, Journal Entries, Party Ledgers, Khatabook
│   │   │   └── reports/                # Stock Valuation, Daily P&L, Sales Register, Aging Analysis
│   │   ├── utils/                      # Ledger builders, catch-weight math, currency formatters
│   │   └── app.ts                      # Express app setup and route registrations
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/                           # React + TypeScript + Vite Application
│   ├── public/                         # Static assets, logos, printable templates
│   ├── src/
│   │   ├── assets/                     # Brand graphics, icons
│   │   ├── components/                 # Reusable UI component library (shadcn/ui + custom)
│   │   │   ├── ui/                     # Button, Input, Dialog, Table, Popover, Badge, Card, etc.
│   │   │   ├── layout/                 # Sidebar, Topbar, UserMenu, Breadcrumbs, Notifications
│   │   │   └── shared/                 # DataTables, DateRangePicker, DualUnitInput, PartySelect
│   │   ├── features/                   # Domain features matching backend modules
│   │   │   ├── auth/                   # Login screen, Session lock
│   │   │   ├── dashboard/              # Executive KPI cards, Recharts trends, Stock level widgets
│   │   │   ├── pos/                    # High-speed POS register, Cart, Weigh scale preview, Cash drawer
│   │   │   ├── procurement/            # Inward entry, Kanda weighbridge slip, Purchase invoice form
│   │   │   ├── inventory/              # Godown stock matrix, Batch tracker, Stock adjustment dialogs
│   │   │   ├── milling/                # Milling job order, Paddy consumption & Yield calculator
│   │   │   ├── sales/                  # Wholesale sales order, Outward gate pass, Invoice print view
│   │   │   ├── accounting/             # Journal vouchers, Chart of accounts tree, Party statement
│   │   │   └── reports/                # Report generator, CSV export, Print layouts
│   │   ├── hooks/                      # Custom hooks (useAuth, useWeighbridge, useThermalPrint)
│   │   ├── services/                   # API client layer (Axios / Fetch with JWT auto-refresh)
│   │   ├── stores/                     # Client state (POS active cart, active shift)
│   │   ├── types/                      # Shared frontend TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css                   # Tailwind CSS utilities and theme variables
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## 5. Clean Modular Architecture (Backend Pattern)

To avoid spaghetti code and ensure testability, the backend enforces a strict **Controller-Service-Repository** boundary with a dedicated **Double-Entry Financial Orchestrator**:

```
+-------------------------------------------------------------+
|                     HTTP / Express Route                    |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                      Controller Layer                       |
|   - Parses HTTP Request (Headers, Params, Body)             |
|   - Executes Zod Schema Validation                          |
|   - Calls Service Layer & Formats Unified API Response      |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                       Service Layer                         |
|   - Enforces Business Logic (e.g., Credit Limit Check)     |
|   - Coordinates Multiple Entities Inside a Transaction      |
|   - Triggers Double-Entry Journal Entry Generation          |
|   - Logs Audit Records                                      |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                  Repository / Prisma ORM                    |
|   - Executes Database Queries with Strict Isolation         |
|   - Applies Row-Level Locks (`SELECT FOR UPDATE`)           |
|   - Writes Atomic Database Transactions ($transaction)      |
+-------------------------------------------------------------+
```

### Standardized API Response Envelope
All API endpoints return a strictly typed JSON structure:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 25,
    "totalCount": 1420,
    "totalPages": 57
  },
  "timestamp": "2026-11-20T18:15:00.000Z"
}
```

---

## 6. Security, Authentication & Role-Based Access Control (RBAC)

### 6.1 Authentication Mechanism
- **Access Tokens:** Signed via RS256 or HS256, short lifespan (15 minutes), containing `userId`, `roleId`, and `branchId`.
- **Refresh Tokens:** Stored as hashed values in the `UserSession` table, long lifespan (7 days), with cryptographic token rotation upon every refresh. Stored in HTTP-only, SameSite Secure cookies.
- **Brute Force Protection:** IP and username-based lockout after 5 consecutive failed attempts.
- **Password Standards:** Enforced bcrypt hashing with 12 salt rounds; mandatory minimum 8 characters with alphanumeric and special symbol criteria.

### 6.2 Granular RBAC Permissions
The system defines 5 default enterprise roles with granular action permissions:

| Role Name | Access Scope & Responsibilities |
| :--- | :--- |
| **SUPER_ADMIN** | Complete system authority: configuration, fiscal year closing, role editing, full audit logs. |
| **BRANCH_MANAGER** | Approves large credit purchases/sales, monitors warehouse godowns, reviews day-end POS shifts. |
| **PROCUREMENT_OFFICER** | Manages weighbridge *Kanda* slips, Gate Inward Passes, Arthi bills, and raw paddy receipt. |
| **POS_CASHIER** | High-speed retail counter operations: scans bags, enters loose weights, collects payments, prints receipts. Cannot edit pricing or view General Ledger. |
| **ACCOUNTANT** | Chart of accounts maintenance, journal vouchers, bank reconciliations, tax reports, party payments. |
| **MILL_SUPERVISOR** | Records milling production orders, raw paddy consumption, and finished rice/by-product yields. |

---

## 7. Dual-Unit Inventory & Financial Integrity Engine

### 7.1 Catch Weight / Dual-UOM Architecture
Rice cannot be tracked purely by quantity or purely by weight:
- An entry of `100 bags (Bori)` of Basmati 1121 nominally 50 kg must record:
  - `Primary Quantity`: 100 Bags (Packaging Type: 50kg PP Woven Bag).
  - `Secondary (Actual) Weight`: 4,985.50 kg (net of tare weight).
  - `Cost / Valuation Basis`: Price per Metric Ton, Price per 40 kg (Maund), or Price per kg.
- Every inventory ledger entry (`StockMovement`) records **both** `quantityDelta` (bags) and `weightDeltaKg` (kilograms).
- Discrepancies between theoretical bag weight and scale weight are captured in an explicit `WeightVarianceAccount` to prevent invisible shrinkage or inventory inflation.

### 7.2 Immutability & Audit Trails
- **Zero Hard Deletes:** Financial ledger entries (`JournalEntry`, `JournalEntryLine`) and inventory ledger entries (`StockMovement`) are **immutable**. Corrections must be made via reversal credit/debit notes or adjustment entries.
- **Audit Logging Table:** Captures every mutation with `userId`, `ipAddress`, `userAgent`, `action` (`CREATE`, `UPDATE`, `DELETE`, `VOID`), `entityName`, `entityId`, `oldValues` (JSONB), and `newValues` (JSONB).

---

## 8. Hardware & Peripheral Integration Architecture

For a physical rice trading facility, seamless communication with on-premise hardware is mandatory:
1. **Digital Weighbridge (Kanda) Interface:**
   - Communication via RS-232 / COM port or TCP/IP socket.
   - Frontend accesses device streams through the standard **Web Serial API** or an optional lightweight local bridge utility.
   - Automatically populates Gross Weight, Tare Weight (Truck empty), and computes Net Grain Weight without manual clerk manipulation, eliminating fraud.
2. **Thermal POS Receipt Printers:**
   - ESC/POS raw command format for 80mm and 58mm thermal printers (Epson, Xprinter).
   - High-speed direct printing without standard OS print dialog lag.
3. **Electronic Platform Scales (Counter POS):**
   - Direct scale reading for loose rice retail sales (e.g. 2.5 kg, 5 kg scoops).
4. **Barcode & QR Scanners:**
   - 1D/2D barcode compatibility for pre-bagged branded rice sacks.

---

## 9. Figma Integration & MCP Tooling Strategy

The workspace is equipped with the **`figma_figma` MCP server**, providing complete design-to-code capabilities:
- **Design Tokens & Variables Extraction:** Using `get_variable_defs` to extract color palettes (Earth/Paddy green, Rice white, Metallic slate, Amber alerts), typography scales, and padding tokens.
- **Figma Design Generation & Inspection:** Utilizing `generate_figma_design` and `get_design_context` to model pixel-perfect desktop ERP layouts and high-speed POS touch interfaces.
- **System Flow Diagramming:** Leveraging `generate_diagram` to render FigJam flowcharts for warehouse gate passes, milling lifecycles, and double-entry accounting paths.

---

## 10. Conclusion & Architectural Readiness

This architecture establishes a rock-solid, production-grade foundation for **AL ARAB RICE TRADERS**. It satisfies enterprise compliance, eliminates inventory-accounting drift, handles physical grain trading quirks (tare, moisture, bag variations), and provides a clean separation of concerns ready for modular development.
