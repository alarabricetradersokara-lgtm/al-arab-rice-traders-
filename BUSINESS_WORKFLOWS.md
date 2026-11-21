# BUSINESS WORKFLOWS & DOMAIN SPECIFICATION: AL ARAB RICE TRADERS

**Version:** 1.0.0  
**Scope:** Core Operational, Processing, POS, and Financial Workflows  
**Target Enterprise:** Al Arab Rice Traders (Milling, Wholesale, Retail & Commission Agency)

---

## 1. End-to-End Workflow Architecture

Rice trading is a complex agricultural commodity industry with specialized practices for procurement, moisture loss, tare calculations, milling yields, and high-speed counter POS. This document defines the exact operational workflows, mathematical algorithms, and financial ledger rules governing the platform.

```
+---------------------------------------------------------------------------------------+
|                             GRAIN FLOW: FARM TO FORK                                  |
|                                                                                       |
|   +-----------------------+     +-----------------------+     +-------------------+   |
|   | 1. Mandi Procurement  | --> | 2. Weighbridge Kanda  | --> | 3. Godown Stock In|   |
|   | - Farmer / Arthi Deal |     | - Gross - Tare - Bag  |     | - Raw Paddy Batch |   |
|   +-----------------------+     +-----------------------+     +-------------------+   |
|                                                                         |             |
|                                                                         v             |
|   +-----------------------+     +-----------------------+     +-------------------+   |
|   | 6. Customer Delivery  | <-- | 5. Sales & POS        | <-- | 4. Rice Milling   |   |
|   | - Gate Outward Pass   |     | - Wholesale / Counter |     | - Finished Rice   |   |
|   | - Customer Khatabook  |     | - Cash / Credit       |     | - Bran, Husk, Tota|   |
|   +-----------------------+     +-----------------------+     +-------------------+   |
+---------------------------------------------------------------------------------------+
```

---

## 2. Core Business Workflows

### WORKFLOW 1: Paddy (Dhan) Procurement & Weighbridge Gate Inward

```
[Truck Arrives at Gate] 
         │
         ▼
[Gate Inward Pass (GINP) Created] ──> Records Truck #, Driver, Party, Expected Bags
         │
         ▼
[1st Weight on Weighbridge] ───────> Captured via Web Serial: GROSS WEIGHT (Kg)
         │
         ▼
[Quality Inspection & Lab Test] ───> Moisture % & Broken Grain % Tested
         │
         ▼
[Unloading at Designated Godown] ──> Actual Bags Counted (e.g., 200 Jute Bags)
         │
         ▼
[2nd Weight on Weighbridge] ───────> Captured via Web Serial: TARE TRUCK WEIGHT (Kg)
         │
         ▼
[Net Grain Weight Computation]
         │
         ▼
[Purchase Bill Generation & GL Posting]
```

#### Detailed Calculations:
1. **Gross Truck Weight ($W_{\text{gross}}$)** and **Tare Truck Weight ($W_{\text{tare}}$)**:
   $$W_{\text{raw\_net}} = W_{\text{gross}} - W_{\text{tare}}$$
2. **Bardana (Bag Tare Deduction):**
   $$W_{\text{bardana\_deduction}} = \text{Bag Count} \times \text{Tare Weight per Empty Bag (e.g. 1.1 kg for Jute)}$$
   $$W_{\text{scale\_net}} = W_{\text{raw\_net}} - W_{\text{bardana\_deduction}}$$
3. **Moisture & Quality Deduction (Karda):**
   - If tested moisture $> 14.0\%$ (standard tolerance), a weight or price cut is applied:
   $$\text{Moisture Cut Weight} = W_{\text{scale\_net}} \times \frac{\text{Actual Moisture \%} - 14.0\%}{100}$$
   $$W_{\text{billable\_net}} = W_{\text{scale\_net}} - \text{Moisture Cut Weight}$$
4. **Line Total Calculation:**
   $$\text{Total Amount} = \frac{W_{\text{billable\_net}}}{40} \times \text{Price per Maund (40 kg)}$$
5. **Deductions & Expenses:**
   - Add: Arthi Commission (*Arhat*), Palledari (Labor unloading), Market Cess (*Chungi*).
   - Deduct: Freight advance paid to driver.
6. **Automatic Double-Entry Accounting Posting:**
   - **DEBIT:** Inventory - Raw Paddy ($W_{\text{billable\_net}} \times \text{Cost}$)
   - **DEBIT:** Freight & Labor Expenses (if borne by company)
   - **CREDIT:** Accounts Payable - Supplier / Farmer / Arthi (Net Bill Amount)
   - **CREDIT:** Cash / Bank (if freight advance paid directly to driver)

---

### WORKFLOW 2: Rice Milling, Processing & By-Product Conversion

Raw paddy cannot be sold as edible rice without processing. Milling transforms raw paddy into multiple finished items:

```
[Raw Paddy Lot Issued from Godown] ──> 10,000 kg Super Kernel Paddy
                 │
                 ▼
     [Milling Machine Processing] ───> De-husking, Whitening, Polishing, Grinding
                 │
                 ▼
+─────────────────────────────────────────────────────────────+
|                YIELD ALLOCATION & SORTING                   |
|                                                             |
|  - Head Rice Grade A (Polished Super Kernel) : 6,400 kg     |
|  - Broken Rice (Tota / Kani)                 :   400 kg     |
|  - Rice Bran (Phak / Kunda)                  :   800 kg     |
|  - Rice Husk (Khol / Bhoosa)                 : 2,100 kg     |
|  - Moisture Loss / Dust Waste                :   300 kg     |
+─────────────────────────────────────────────────────────────+
                 │
                 ▼
[Stock Update: Reduce Raw Paddy, Increase Milled Rice & By-Products]
                 │
                 ▼
[Cost Absorption: Distribute Input Cost + Milling Power/Labor to Outputs]
```

#### Milling Yield Validation & Cost Allocation:
- **Total Output Mass Balance:**
  $$\sum W_{\text{outputs}} + W_{\text{waste}} = W_{\text{input\_paddy}}$$
- **Yield Efficiency:**
  $$\text{Edible Yield \%} = \frac{W_{\text{head\_rice}} + W_{\text{broken\_rice}}}{W_{\text{input\_paddy}}} \times 100$$
- **Cost Allocation:** Net cost of input paddy plus milling electricity, machine wear, and labor is allocated proportionally by market value ratio to Finished Rice, Broken Rice, and Bran.
- **Automatic Double-Entry Posting:**
  - **DEBIT:** Inventory - Milled Finished Rice
  - **DEBIT:** Inventory - Broken Rice (Tota)
  - **DEBIT:** Inventory - By-Product (Bran & Husk)
  - **CREDIT:** Inventory - Raw Paddy
  - **CREDIT:** Milling Direct Expense Clearing (Labor/Power absorbed)

---

### WORKFLOW 3: Dual-Unit (Catch Weight) Inventory Management

Grain is handled simultaneously in **Bags** and **Kilograms**.

```
+------------------------------------------------------------------------------------+
|                             DUAL-UNIT BALANCE SHEET                                |
|                                                                                    |
|   Commodity: Super Kernel Basmati 1121 Steam                                       |
|   Packaging: 50 kg PP Woven Bag (Nominal: 50 kg)                                   |
|                                                                                    |
|   Theoretical Weight: 500 Bags * 50.00 kg = 25,000.00 kg                          |
|   Actual Scale Net Weight               = 24,930.00 kg                             |
|   Variance                              =    -70.00 kg (-0.28% Natural Shrinkage)  |
+------------------------------------------------------------------------------------+
```

#### Dual-UOM Handling Rules:
1. **Dual Stock Fields:** Every stock query returns `{ bagCount: number, netWeightKg: Decimal }`.
2. **Sales Pricing Flexibility:** The UI permits pricing either:
   - *Per Bag* (e.g. Rs. 14,500 per 50kg bag)
   - *Per Kg* (e.g. Rs. 290.00 per kg $\times$ actual scale weight)
   - *Per Maund* (e.g. Rs. 11,600 per 40 kg)
3. **Weight Variance Account:**
   - If stock is physically audited and shows 500 bags weighing 24,930 kg instead of 25,000 kg, the 70 kg variance is booked to `Stock Loss - Natural Shrinkage / Drying Loss` without affecting the bag count.

---

### WORKFLOW 4: Wholesale Rice Dispatch & Gate Outward Pass

```
[Wholesale Customer Order Placed] 
         │
         ▼
[Credit Limit & Outstanding Check] ──> System blocks order if credit exceeded
         │
         ▼
[Warehouse Delivery Order (DO)] ─────> Godown supervisor stacks bags onto truck
         │
         ▼
[1st Weight: Empty Truck Tare] ──────> Recorded at Outward Weighbridge
         │
         ▼
[Loading Rice Bags] ─────────────────> 300 Bags of 1121 Kainat loaded
         │
         ▼
[2nd Weight: Loaded Truck Gross] ────> Recorded at Outward Weighbridge
         │
         ▼
[Gate Outward Pass (GOP) & Bilty] ───> Driver given stamped Gate Outward Pass
         │
         ▼
[Sales Invoice & Ledger Posting]
```

#### Double-Entry Accounting Posting:
- **DEBIT:** Accounts Receivable - Customer Party ($W_{\text{net}} \times \text{Price}$)
- **CREDIT:** Sales Revenue - Rice
- **DEBIT:** Cost of Goods Sold (COGS)
- **CREDIT:** Inventory - Finished Goods

---

### WORKFLOW 5: High-Speed Counter POS Checkout

Designed for sub-15-second counter retail transactions:

```
[Cashier Opens Register Shift] ──────> Enters Opening Cash Float (e.g., $100 / Rs. 10,000)
         │
         ▼
[Item Entry] ────────────────────────> Barcode scan (pre-packed bag) OR Scale Weigh (loose rice)
         │
         ▼
[Instant Line Calculation] ──────────> Quantity, Weight, Price, Auto-Discount
         │
         ▼
[Payment Processing] ────────────────> Cash / Credit Card / Bank QR / Customer Khata Credit
         │
         ▼
[Instant ESC/POS Thermal Receipt] ───> 80mm silent print in <1 sec; Cash drawer kicks open
         │
         ▼
[Atomic DB Commit & GL Entry] ───────> Decrements stock; Credits Sales; Debits POS Till Cash
         │
         ▼
[Shift Close & Day-End Tally] ───────> Physical Cash Counted vs. Expected System Total;
                                       Over/Short Discrepancy Logged
```

---

## 3. Potential Consistency Problems & Architectural Safeguards

| Consistency Problem | Real-World Manifestation | Architectural Mitigation in Al Arab ERP |
| :--- | :--- | :--- |
| **1. Dual-UOM Drift** | Stock shows 0 bags left in godown, but 120 kg remains in system (or vice versa). | Every stock movement enforces atomic bag and weight decrement. When `bagCount == 0`, a zero-balance cleaner writes any residual $<1.0$ kg to `WeightVarianceAccount`. |
| **2. Concurrent POS & Wholesale Race Condition** | POS cashier sells the last 50 bags while wholesale officer simultaneously dispatches them. | Explicit PostgreSQL row-level locking (`SELECT ... FOR UPDATE`) on the `StockLevel` record inside Prisma `$transaction`. |
| **3. Negative Inventory Discrepancy** | Orders processed when physical stock exists but inward GRN was delayed in entry. | Strict configurable system toggle: `ALLOW_NEGATIVE_STOCK = FALSE`. Any transaction driving stock below zero fails with a structured 409 Conflict. |
| **4. Out-of-Balance Journal Entries** | Network failure or partial write causes debits to not equal credits. | All double-entry postings run within a single atomic database transaction with an invariant check: `assert(sum(debits) === sum(credits))`. |
| **5. Moisture Loss (Natural Shrinkage)** | 50,000 kg of fresh grain shrinks to 49,200 kg after 3 months of summer storage. | Periodic physical stock audit module with automated `StockDryingLoss` adjustment voucher posting to COGS. |
| **6. Unreconciled POS Cash Till Drift** | Cashier drawer is short at end of day due to incorrect change or unrecorded withdrawals. | Mandatory blind close POS shift: cashier must input physical count before seeing system expected count. Differences are permanently recorded in `CashOverShortAccount`. |
| **7. Gate Pass vs Invoice Disconnect** | Truck leaves premises with 350 bags, but invoice was only generated for 300 bags. | Physical Gate Outward Pass requires a digitally signed and verified Sales Invoice or Delivery Order ID before gate barrier release. |
