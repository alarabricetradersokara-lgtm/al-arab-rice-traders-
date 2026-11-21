# 📖 OPERATIONAL USER GUIDE
## AL ARAB RICE TRADERS — ENTERPRISE ERP & POS

> **Official Standard Operating Procedures (SOP) & User Manual**  
> *Designed for Business Owners, Head Accountants, Mandi In-charges, Cashiers, and Mill Supervisors.*

---

## 📋 Table of Contents
1. [System Access & Role Switching](#1-system-access--role-switching)
2. [Morning Opening Routine & Dashboard](#2-morning-opening-routine--dashboard)
3. [Dual-UOM Rice Inventory & Product Setup](#3-dual-uom-rice-inventory--product-setup)
4. [Inward Mandi Procurement & Arthi Billing](#4-inward-mandi-procurement--arthi-billing)
5. [Direct Sales Invoices & POS Counter](#5-direct-sales-invoices--pos-counter)
6. [Core Workflow: Daily Sales Entry & EOD Shift Closing](#6-core-workflow-daily-sales-entry--eod-shift-closing)
7. [Sales Returns & Purchase Returns (Credit/Debit Notes)](#7-sales-returns--purchase-returns-creditdebit-notes)
8. [Khata & Ledger Management (Customers & Suppliers)](#8-khata--ledger-management-customers--suppliers)
9. [Financial Accounting, Expenses & Banking](#9-financial-accounting-expenses--banking)
10. [Milling, Yield Recovery & Broker Commission](#10-milling-yield-recovery--broker-commission)
11. [Export Shipments & Multi-Currency Contracts](#11-export-shipments--multi-currency-contracts)
12. [Business Intelligence Reports & Exports](#12-business-intelligence-reports--exports)
13. [Troubleshooting & Frequently Asked Questions](#13-troubleshooting--frequently-asked-questions)

---

## 1. System Access & Role Switching

### Login & Authentication
1. Launch your browser (Google Chrome, Microsoft Edge, or Mozilla Firefox) and navigate to the application URL:
   - **Local Counter / LAN**: `http://localhost:5173` or `http://192.168.1.100:5173`
   - **Production Domain**: `https://erp.alarabrice.com`
2. Enter your authorized username and password.
3. System will authenticate your credentials and generate a cryptographically signed JWT token stored securely in your browser session.

### Role Profiles & Permissions
| Role Name | Designated Users | Key Permissions & Screen Access |
| :--- | :--- | :--- |
| **Owner / Admin** | Haji Muhammad Arab, Managing Director | Full access to all modules, financial ledgers, system settings, user management, and daily sales closing approval. |
| **Accountant** | Head Accountant, Cashier In-charge | Khata ledgers, payments, receipts, expense vouchers, cash/bank books, P&L, balance sheet, trial balance. |
| **Stock Manager** | Warehouse Godown In-charge, Mill Supervisor | Products, warehouses, opening stock, physical inventory adjustments, inter-godown transfers, milling batches. |
| **Sales Operator** | Counter Salesman, Booking Clerk | Daily sales entry, individual sales invoice creation, thermal receipt printing, customer lookup. |
| **Viewer** | Auditor, External Tax Consultant | Read-only access to authorized reports without editing or transaction posting capabilities. |

> [!TIP]
> **Active Role Switcher (Top Navigation Bar)**: In development and authorized testing modes, administrators can click the quick role dropdown in the top header to instantly preview and test user workflows across any of the 5 roles.

---

## 2. Morning Opening Routine & Dashboard

Every business morning at Al Arab Rice Traders should begin with the following three-step verification:

```
[ Step 1: Login ] ──► [ Step 2: Review Executive KPIs ] ──► [ Step 3: Cash & Stock Check ]
```

1. **Review Executive KPI Cards**:
   - **Cash in Hand**: Verify physical cash in safe against system balance.
   - **Bank Balances**: Verify cleared funds across HBL, Meezan, and Bank of Punjab accounts.
   - **Customer Receivables**: Check total market credit (*Market Udhar*).
   - **Supplier Payables**: Check total amount due to Arthis and Mandi suppliers.
2. **Review Low Stock Alerts**:
   - Inspect the **Low Stock Products** table at the bottom of the dashboard to identify varieties requiring mandi procurement or milling orders.
3. **Verify Previous Day Closing**:
   - Ensure yesterday's Daily Closing was confirmed and no draft entries remain unposted.

---

## 3. Dual-UOM Rice Inventory & Product Setup

Rice trading requires simultaneous tracking of physical packaging (Bags/Bori) and legal metric mass (KG/Maund).

### Creating a New Rice Product
1. Navigate to **Inventory** in the sidebar.
2. Click **+ Add Rice Product**.
3. Fill in the mandatory product specifications:
   - **Product Name**: e.g., *Super Kernel Basmati Premium 50KG*.
   - **Product Code / SKU**: e.g., `SKB-50-RAW`.
   - **Variety**: Select from dropdown (`Super Kernel Basmati`, `1121 Kainat Steam`, `IRRI-6`, etc.).
   - **Grade / Processing**: `Raw White`, `Steam`, `Parboiled (Sella)`, or `Brown`.
   - **Standard Bag Weight**: Enter package weight in KG (e.g., `50`, `25`, `10`, or `1`).
   - **Default Rates**: Enter default Purchase Rate (PKR/KG) and default Sale Rate (PKR/KG).
   - **Minimum Alert Level**: Minimum safety stock in KG (e.g., `5,000`).
4. Click **Save Product**.

### Setting Opening Stock
1. Under **Inventory**, click **Opening Stock**.
2. Select target warehouse (e.g., *Main Godown - Raiwind Road*).
3. Select Rice Product.
4. Enter physical bag count and total weight in KG. The system will automatically compute the valuation based on purchase rate.
5. Click **Record Opening Stock**. The system creates an opening stock audit entry and updates current godown stock atomically.

---

## 4. Inward Mandi Procurement & Arthi Billing

When raw paddy (*Dhan*) or processed rice arrives by truck from the grain market:

### Recording Inward Purchase
1. Navigate to **Purchases** ➔ **+ New Purchase Order**.
2. Select or create the **Supplier / Arthi**.
3. Select destination **Warehouse / Godown**.
4. Enter **Truck / Vehicle Number** and **Driver Phone**.
5. Add items to the bill:
   - Select product (e.g., *1121 Kainat Paddy*).
   - Enter **Gross Bags** and **Gross Weight (KG)** from weighbridge chit.
   - Enter **Moisture / Karda Deduction** (if applicable).
   - Enter **Net Weight (KG)** and **Rate per Maund (40 KG)** or **Rate per KG**.
6. **Landed Cost Allocation**:
   - Add **Freight / Carriage (*Gari Kiraya*)**.
   - Add **Loading / Unloading (*Palledari*)**.
   - Add **Mandi Commission (*Arthi Brokerage*)**.
   > [!NOTE]
   > Freight and direct handling costs are automatically added to the inventory unit cost, ensuring accurate Cost of Goods Sold (COGS).
7. Select **Payment Terms**:
   - **Credit Purchase**: Full amount posts to Supplier Khata Ledger as payable.
   - **Cash / Bank Payment**: Enter immediate advance payment; remainder balance reflects in ledger.
8. Click **Confirm & Post Purchase**.
   - Stock is credited immediately.
   - Supplier ledger is updated.
   - Truck bill invoice is ready for printing.

---

## 5. Direct Sales Invoices & POS Counter

For wholesale bulk dispatches, institutional orders, or single-truck cash buyers:

1. Navigate to **Sales** ➔ **+ Create Sales Invoice**.
2. Select **Customer** (or select *Counter Cash Customer*).
3. Select source **Warehouse**.
4. Add line items:
   - Select Rice Product.
   - Enter **Bags** and **Weight (KG)**.
   - Review sale rate (defaults from product master, can be adjusted with proper role authorization).
5. Enter **Freight Charges**, **Discounts**, or **Labour (*Palledari*)** if charged to customer.
6. Choose Payment Method:
   - **Full Cash**: Debits Cash Account, generates cash receipt.
   - **Full Credit**: Debits Customer Ledger balance, subject to customer credit limit.
   - **Split Payment**: Partial cash down payment with remaining amount posted to ledger.
7. Click **Confirm Invoice**.
8. Print standard **A4 Invoice** or compact **80mm Thermal Receipt** with QR code.

---

## 6. Core Workflow: Daily Sales Entry & EOD Shift Closing

> [!IMPORTANT]
> **This is the primary daily workflow for Al Arab Rice Traders.**  
> During busy market days, counter sales occur continuously. At 6:00 PM closing, the administrator logs aggregate product quantities sold across all cash counters.

### Step-by-Step EOD Workflow

```
[ Select Date & Godown ] ──► [ Enter Sold Quantities ] ──► [ Enter Payment Breakdown ] ──► [ Confirm Daily Closing ]
```

1. Navigate to **Daily Sales** from the left navigation menu.
2. Click **+ New Daily Sales Entry**.
3. **Select Parameters**:
   - **Business Date**: System defaults to today's date (can back-date with Admin permission).
   - **Warehouse**: Select source godown (e.g., *Main Godown - Raiwind Road*).
4. **Enter Product Sales Quantities**:
   - The table lists all active rice varieties and current stock on hand.
   - In the **Quantity Sold (KG)** column, enter total kilograms sold.
   - Enter or verify the **Rate per KG**.
   - The system calculates line totals and checks available inventory.
   > [!WARNING]
   > If the entered quantity exceeds available godown stock, the line turns red with a negative stock prevention alert.
5. **Enter Sales Breakdown**:
   - **Total Sales Amount**: Calculated automatically by the system.
   - **Cash Collected (*Naqd Vasooli*)**: Enter total physical cash counted in counter register.
   - **Credit Sales (*Udhar Khata*)**: Allocate credit sales to specific registered customers.
   - **Expenses Paid Out of Cash**: Record any small counter expenses (tea, vehicle puncture, loading).
   - **Commission / Arhat**: Record any broker fee deduction.
6. **Reconciliation Summary**:
   - Verify that:  
     $$\text{Total Sales} = \text{Cash Collected} + \text{Credit Sales} + \text{Expenses Paid} + \text{Discounts}$$
7. **Confirm Daily Closing**:
   - Click **Save as Draft** if awaiting final cashier cash counts.
   - Click **Confirm & Close Daily Sales** to freeze the day.
8. **Automated System Actions on Confirmation**:
   - Deducts sold quantities from warehouse stock.
   - Posts stock movement audit logs.
   - Debits Cash in Hand account for cash collected.
   - Debits individual Customer Khata Ledgers for credit allocations.
   - Locks the business date to prevent duplicate sales entries.
   - Generates the official **Daily Closing Report** with one-click PDF print.

---

## 7. Sales Returns & Purchase Returns (Credit/Debit Notes)

### Customer Sales Return (Credit Note)
1. Go to **Sales** ➔ Select invoice or click **Sales Returns**.
2. Select original customer and sales invoice reference.
3. Enter returning bag count, net weight (KG), and accepted rate.
4. Select receiving warehouse where stock is returned.
5. Click **Process Sales Return**:
   - Restores inventory stock.
   - Automatically credits the Customer Ledger balance (reduces their payable).

### Supplier Purchase Return (Debit Note)
1. Go to **Purchases** ➔ **Purchase Returns**.
2. Select supplier and original purchase bill reference.
3. Specify returning stock quantity and reason (e.g., moisture excess, broken percentage high).
4. Click **Confirm Return**:
   - Deducts stock from warehouse.
   - Debits Supplier Ledger (reduces amount owed to supplier).

---

## 8. Khata & Ledger Management (Customers & Suppliers)

The built-in **Khatabook System** tracks live running balances with zero manual reconciliation errors.

### Viewing Party Ledgers
1. Navigate to **Parties** (or **Customers** / **Suppliers**).
2. Use the search bar to locate the party by **Business Name**, **Owner Name**, or **Phone Number**.
3. Click on the customer card to open their **Live Statement**.
4. The ledger displays:
   - Date, Voucher Type, Reference Number, Description, Debit, Credit, and **Running Balance**.

### Recording Customer Receipts (*Vasooli*)
1. Click **+ Receive Payment** on the customer profile.
2. Enter **Amount Received (PKR)**.
3. Select deposit account: **Cash Safe** or specific **Bank Account** (e.g., *Meezan Bank Current*).
4. Enter payment reference (Cheque number, online IBFT transaction ID).
5. Click **Post Receipt**. Ledger updates immediately.

### Recording Supplier Payments (*Adaigi*)
1. Click **+ Make Payment** on the supplier profile.
2. Enter amount, cheque/reference details, and source bank/cash account.
3. System debits supplier payable and credits bank/cash account.

### Sharing Statement on WhatsApp
1. On the customer or supplier ledger view, click the green **WhatsApp Share** button.
2. Select date range (e.g., *Current Month* or *All Time*).
3. The system generates a formatted statement summary and launches WhatsApp Web / WhatsApp App with pre-filled ledger details and download link.

---

## 9. Financial Accounting, Expenses & Banking

Al Arab Rice Traders ERP runs on strict **double-entry accounting** principles.

### Daily Business Expenses
1. Navigate to **Accounting** ➔ **Expenses**.
2. Click **+ Record Expense**.
3. Select **Expense Category**:
   - *Staff Salaries & Wages*
   - *Electricity & Generator Fuel*
   - *Godown Rent*
   - *Palledari / Loading & Unloading*
   - *Truck Freight & Transportation*
   - *Mill Repair & Maintenance*
   - *Office & Entertainment Expenses*
4. Select payment source (**Cash in Hand** or **Bank Account**).
5. Enter **Amount (PKR)** and operational notes.
6. Click **Save Expense Voucher**. Posts to General Ledger and reduces cash balance.

### Internal Cash Transfers (Safe to Bank / Bank to Bank)
1. Go to **Accounting** ➔ **Cash & Bank Accounts**.
2. Click **Transfer Funds**.
3. Select **Source Account** (e.g., *Shop Cash Safe*) and **Destination Account** (e.g., *HBL Main Trading A/C*).
4. Enter amount and deposit slip number.
5. Click **Execute Transfer**. System creates matching contra journal entries.

---

## 10. Milling, Yield Recovery & Broker Commission

### Milling Batch Operations
1. Navigate to **Milling & Production** ➔ **+ New Milling Batch**.
2. **Input Material (Raw Paddy / Rough Rice)**:
   - Select raw paddy product (e.g., *Super Basmati Paddy Grade A*).
   - Enter input quantity (e.g., `500 Bags` / `20,000 KG`).
3. **Processing Costs**:
   - Enter electricity, labour, and drying costs per batch.
4. **Output Products & Recovery**:
   - Record **Finished Head Rice** (e.g., `11,000 KG` / 55% yield).
   - Record **Tota / Broken Rice** (e.g., `2,400 KG` / 12% yield).
   - Record **Rice Bran (*Kanda*)** (e.g., `1,600 KG` / 8% yield).
   - Record **Husk (*Phok*)** (e.g., `4,000 KG` / 20% yield).
5. **Yield Analysis**: System displays total output yield percentage and highlights processing loss/wastage.
6. Click **Complete Batch**. Consumes raw stock and creates finished stock in designated warehouses.

### Commission Agent Accounts (*Dalal / Broker Khata*)
1. Navigate to **Commission Agents**.
2. View accrued commission payable linked directly to purchase and sales contracts.
3. Record settlement payments against agent ledgers with cheque references.

---

## 11. Export Shipments & Multi-Currency Contracts

1. Navigate to **Export Management**.
2. Create **Export Contract / Proforma Invoice**:
   - Select overseas buyer (e.g., *Dubai Grain Commodities LLC*).
   - Select Contract Currency (`USD`, `EUR`, `AED`, `GBP`).
   - Enter agreed conversion exchange rate (e.g., `1 USD = 278.50 PKR`).
   - Enter shipment terms (`FOB Karachi`, `CIF Jebel Ali`).
   - Enter container numbers, Bill of Lading (B/L) reference, and shipping line.
3. Record Export Receipts:
   - When bank settles Foreign Inward Remittance, enter realized exchange rate.
   - System automatically posts realized **Foreign Exchange (FX) Gain / Loss** to General Ledger.

---

## 12. Business Intelligence Reports & Exports

Navigate to **Reports** in the sidebar. All 12 management reports support date filtering, search, and export:

| Report Name | Key Metrics Covered | Typical Use Case |
| :--- | :--- | :--- |
| **Daily Sales Report** | Daily volume (KG/Bags), cash vs credit breakdown, profit margin | Daily store manager closing review. |
| **Daily Closing Summary** | Chronological record of confirmed shift closings and net collections | Auditing cashier handovers. |
| **Monthly Sales Summary** | Variety-wise sales distribution, revenue trends | Monthly sales target tracking. |
| **Purchase Analysis Report** | Supplier-wise procurement, landed cost per KG, moisture cuts | Mandi price negotiation. |
| **Profit & Loss Statement** | Revenue, Landed COGS, Gross Profit, Expenses, Net Profit | Tax filing and quarterly financial review. |
| **Stock Valuation Report** | Current Bags, Weight (KG), Weighted Average Cost, Total Value | Bank pledge valuation and insurance audits. |
| **Stock Movement Ledger** | Batch-wise audit trail (Opening, Inward, Outward, Wastage) | Discrepancy investigation. |
| **Customer Receivables** | Aging analysis (0-30 days, 31-60 days, 60+ days), credit limits | Recovery drive planning (*Vasooli*). |
| **Supplier Payables** | Outstanding Arthi balances, payment due dates | Weekly cash-flow scheduling. |
| **Expense Breakdown** | Category-wise expenditure, percentage of total revenue | Operational cost control. |
| **Commission Summary** | Agent-wise trade volume, commission earned vs paid | Broker reconciliation. |
| **Warehouse Stock Report** | Godown-wise stock capacity, utilization, and distribution | Inter-warehouse transfer planning. |

### Exporting Reports
- Click **Export to Excel**: Generates a standard UTF-8 CSV with Byte Order Mark (BOM), ensuring clean Urdu text and number formatting in Microsoft Excel.
- Click **Export / Print PDF**: Generates a professional A4 landscape report with company header, timestamp, and signature blocks.

---

## 13. Troubleshooting & Frequently Asked Questions

### Q1: Why is the system preventing a Daily Sales entry from being confirmed?
> **Answer**: Two common safeguards trigger this:
> 1. *Negative Stock*: The quantity entered for one or more rice varieties exceeds the available stock in the selected warehouse. Perform a stock transfer or check pending purchase bills.
> 2. *Already Closed*: A daily closing has already been confirmed for that exact warehouse and business date. Review existing closings under **Daily Closing Summary**.

### Q2: How do I correct a confirmed invoice with the wrong price?
> **Answer**: Under double-entry accounting rules, confirmed transactions cannot be silently deleted. To correct an invoice:
> 1. Issue a **Sales Return / Credit Note** for the original invoice to reverse the stock and customer balance.
> 2. Issue a new sales invoice with the correct price.

### Q3: How do we handle different bag packings for the same variety?
> **Answer**: Each packing (e.g., 50 KG bag vs 25 KG bag vs 10 KG bag) has a unique product SKU in the master catalog. Both stock counts are maintained in bags and converted to base kilograms for valuation.

### Q4: What happens if internet connectivity drops during mandi operations?
> **Answer**: If hosted on a local LAN server (e.g., in the mandi shop office), the system runs completely offline without requiring internet. Internet is only required for external WhatsApp sharing and remote branch sync.

---
*For further technical support, contact the IT Administrator at Al Arab Rice Traders.*