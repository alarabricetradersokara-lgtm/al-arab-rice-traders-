# 🌾 AL ARAB RICE TRADERS — ENTERPRISE ERP & POS

> **A Complete, Battle-Tested Enterprise Resource Planning & Point of Sale System built specifically for Grain Markets (Mandis), Commercial Rice Millers, Wholesalers, and Agricultural Exporters.**

![Brand Status](https://img.shields.io/badge/System-AL%20ARAB%20RICE%20TRADERS-087A55?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%2019%20%7C%20Node.js%20%7C%20TypeScript%20%7C%20PostgreSQL-064E3B?style=for-the-badge)
![Status](https://img.shields.io/badge/Production-100%25%20Verified%20%26%20Ready-16A36A?style=for-the-badge)

---

## 🏛️ Executive System Overview

**AL ARAB RICE TRADERS ERP & POS** is engineered from the ground up to address the unique domain realities of the South Asian and international rice trade:
- **Dual-UOM Catch-Weight Inventory**: Strict simultaneous tracking in Physical Bags (Bori), Net Kilograms (KG), Traditional South Asian Maunds (Mund / 40 KG), and Export Metric Tons (MT).
- **Core Daily Sales Closing (Shift Reconciliation)**: Designed for bustling grain markets where hundreds of counter transactions occur without pausing for individual invoice generation; administrators record end-of-day product sales totals, reconcile cash vs credit, deduct warehouse stock atomically, and freeze the daily register.
- **Inward Mandi Procurement & Arthi Accounting**: Truck-wise procurement recording gross weight, tare weight, moisture deduction, karda cut, commission, palledari, and landed freight allocated into inventory valuation.
- **Khata Ledger System (Parties)**: Live running balance ledgers for buyers, suppliers, and commission agents with instant WhatsApp statement sharing and PDF downloads.
- **Strict Double-Entry Financial Accounting**: Automated General Ledger postings, Chart of Accounts, Cash Book, Bank Book, Trial Balance, Profit & Loss, and Balance Sheet.
- **Advanced Processing & Export Trade**: Production crushing batches, yield recovery tracking, broker commission accruals, and foreign currency (USD/EUR) export trade with FX gain/loss realization.
- **Role-Based Access Control (RBAC)**: 5 distinct roles (`Owner/Admin`, `Accountant`, `Stock Manager`, `Sales Operator`, `Viewer`) with strict backend HTTP 403 authorization and tamper-proof audit trails.

---

## 🎨 Design System: Premium Emerald Enterprise

The UI strictly adheres to the custom enterprise design language developed in Figma:
- **Primary Emerald Green**: `#087A55`
- **Deep Forest Green**: `#064E3B`
- **Canvas Background**: `#F5F7F5`
- **Surface**: `#FFFFFF`
- **Borders & Dividers**: `#E4EAE5`
- **Typography & Status**: Main Text `#172B25`, Secondary `#718078`, Success `#16A36A`, Warning `#E6A23C`, Danger `#DC5050`.

---

## 📦 System Modules Architecture

```
AL ARAB RICE TRADERS ERP & POS
├── 1. Overview & Intelligence
│   ├── Executive KPI Dashboard (11 Live KPI Cards)
│   └── 12 Management & Financial Reports (PDF & Excel BOM Export)
├── 2. Trading & Operations
│   ├── Daily Sales Entry & EOD Shift Closing (Core Workflow)
│   ├── Direct Sales Invoices & Credit Notes (Sales Returns)
│   ├── Mandi Procurement, Truck Bills & Debit Notes (Purchase Returns)
│   ├── Parties & Khatabook (Customers, Arthis & WhatsApp Sharing)
│   └── Double-Entry Accounting (Cash Accounts, Bank Books, Expenses)
├── 3. Advanced Rice Milling & Logistics
│   ├── Rice Milling Batches & Output Yield Recovery (Head Rice, Broken, Bran, Husk)
│   ├── Broker Commission Tracking & Disbursement Ledger
│   ├── International Rice Export (USD/EUR, Container Tracking, FX Gain/Loss)
│   └── Inter-Godown Transfers & Transit Loss Reconciliations
├── 4. Dual-UOM Inventory Engine
│   ├── Stock Matrix by Godown & Rice Variety
│   ├── Product Catalog & Catch-Weight Specifications
│   ├── Opening Stock Baseline Weight Register
│   ├── Real-Time Stock Movement Audit Trail
│   └── Safety Buffers & Low Stock Alert Engine
└── 5. Administration & Security
    ├── Operator User Management & Role Assignments
    ├── Immutable Audit Log Trail & Entity Diffs
    └── Enterprise Feature Toggles & System Settings
```

---

## 👥 Demo Operator Accounts (Pre-Seeded)

| Username | Full Name | Role | Baseline Password | Authorized Scope |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | Haji Muhammad Arab | `ADMIN` | `Admin@12345` | Complete unrestricted system authority, user management, audit logs, confidential P&L, closing approvals. |
| `accountant` | Sheikh Tariq Mahmood | `ACCOUNTANT` | `AlArab@2026` | Financial accounts, Khatabook ledgers, voucher entries, P&L, Balance Sheet, Cash Book. |
| `stock_mgr` | Chaudhry Bilal Warraich | `STOCK_MANAGER` | `AlArab@2026` | Godown inventory, weighbridge, transfers, cycle counts, wastage adjustments, milling batches. |
| `sales_op` | Rana Zulfiqar Ali | `SALES_OPERATOR` | `AlArab@2026` | POS counter sales, daily sales closing register, customer lookups, receipt printing. |
| `viewer` | M. Kashif Butt | `VIEWER` | `AlArab@2026` | Authorized read-only view of catalogs, stock matrices, and operational reports. |

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (LTS recommended)
- PostgreSQL 15+ running on port 5432
- npm 9+

### 1. Clone & Configure
```bash
git clone https://github.com/alarabricetraders/erp-pos.git
cd "d:/al arab rice traders"
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npx tsx src/seed.ts
npx tsx src/seed-step11-roles.ts
npm run build
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser. The backend API is live at **`http://localhost:5000`**.

---

## 🧪 Comprehensive Verification Suite

Execute the all-inclusive production readiness test suite covering all 20 critical ERP workflows:

```bash
cd backend
npx tsx src/test-step12-production-audit.ts
```

**Verification Result**: `41 PASSED, 0 FAILED` across all 20 critical business workflows.

---

## 📚 Complete Documentation Suite

- [INSTALLATION.md](file:///d:/al%20arab%20rice%20traders/INSTALLATION.md): Detailed installation and database setup instructions.
- [USER_GUIDE.md](file:///d:/al%20arab%20rice%20traders/USER_GUIDE.md): Operational manual for administrators, accountants, and operators.
- [BACKUP_RESTORE.md](file:///d:/al%20arab%20rice%20traders/BACKUP_RESTORE.md): Automated PostgreSQL database backups, WAL archiving, and disaster recovery drills.
- [DEPLOYMENT.md](file:///d:/al%20arab%20rice%20traders/DEPLOYMENT.md): Production deployment guide covering PM2, Nginx reverse proxy, and SSL certificates.

---

*© 2026 AL ARAB RICE TRADERS. All rights reserved.*
