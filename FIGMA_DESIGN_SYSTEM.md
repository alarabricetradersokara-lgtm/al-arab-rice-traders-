# AL ARAB RICE TRADERS — ENTERPRISE FIGMA DESIGN SYSTEM

**Version:** 1.0.0  
**Design Direction:** Premium Emerald Enterprise ERP & High-Speed Grain POS  
**Target Figma File:** [AL ARAB RICE TRADERS - ERP & POS Design System](https://www.figma.com/design/xw0wo5aNtrte79tXpal6tQ)  
**File Key:** `xw0wo5aNtrte79tXpal6tQ`  
**Authentication & Owner:** Naheed (`nlh624333@gmail.com`)  
**Status:** Complete & Published in Figma (Awaiting User Review)

---

## 1. Live Figma Architecture & Page Structure

The Figma project is organized across 3 dedicated pages to provide maximum structural clarity within professional enterprise design constraints:

```
AL ARAB RICE TRADERS (xw0wo5aNtrte79tXpal6tQ)
├── 🎨 Page 1: Tokens & Design System
│   ├── Artboard 1: Brand Foundations & Token Specimen
│   ├── Artboard 2: Core UI Components Library (Buttons, Badges, Inputs, KPI Cards)
│   ├── Screen 01: Login Page (Split-Screen Emerald Hero + Terminal Access Card)
│   └── Screen 02: Main Executive Operations & ERP Dashboard
├── 🌾 Page 2: Operations, Inventory & Milling
│   ├── Screen 03: Dual-Unit Stock Overview & Multi-Godown Matrix
│   ├── Screen 12: Purchase Bill & Weighbridge Kanda Slip (Moisture Cuts & Arthi Charges)
│   └── Screen 23: Rice Milling, Yield & By-Product Processing (Mass Balance Engine)
└── 💰 Page 3: Sales, Accounts & Reporting
    ├── Screen 08: Ultra-Fast Daily Sales Entry & POS Counter Terminal
    ├── Screen 09: Wholesale Sales Invoice & Gate Outward Delivery Challan
    ├── Screen 15: Customer Ledger & Party Khatabook Statement
    └── Screen 21: Daily Closing & POS Register Shift Reconciliation (Z-Report)
```

---

## 2. Color Palette & Variable Design Tokens

All tokens are created as native Figma Color Variables in the **"Al Arab Enterprise Tokens"** collection, scoped explicitly with CSS custom property syntax (`var(--...)`):

| Token Name | Hex Code | Role & Usage | Figma Scope | CSS Variable |
| :--- | :--- | :--- | :--- | :--- |
| **`brand/primary`** | `#087A55` | Deep Emerald Green. Primary action buttons, active navigation, links, success totals. | `FRAME_FILL`, `SHAPE_FILL`, `TEXT_FILL` | `var(--color-primary)` |
| **`brand/secondary`** | `#064E3B` | Forest Green. Sidebar background, header banners, brand titles. | `FRAME_FILL`, `SHAPE_FILL`, `TEXT_FILL` | `var(--color-secondary)` |
| **`brand/background`** | `#F5F7F5` | Light Cool Mint background for all ERP views and canvases. | `FRAME_FILL` | `var(--color-background)` |
| **`brand/surface`** | `#FFFFFF` | Pure white cards, modal dialogs, data table backgrounds. | `FRAME_FILL` | `var(--color-surface)` |
| **`text/main`** | `#172B25` | Deep Dark Green-Black. Headings, table text, primary body copy. | `TEXT_FILL` | `var(--color-text-main)` |
| **`text/secondary`** | `#718078` | Sage Muted Grey. Labels, subtitles, table column headers. | `TEXT_FILL` | `var(--color-text-secondary)` |
| **`ui/border`** | `#E4EAE5` | Subtle border for table dividers, card outlines, form inputs. | `STROKE_COLOR`, `FRAME_FILL` | `var(--color-border)` |
| **`status/success`** | `#16A36A` | Emerald Green. "In Stock", "Paid", "Reconciled", "Yield Optimal". | `FRAME_FILL`, `TEXT_FILL` | `var(--color-success)` |
| **`status/warning`** | `#E6A23C` | Warm Amber. "Low Stock Alert", "Moisture Above Standard", "Pending Approval". | `FRAME_FILL`, `TEXT_FILL` | `var(--color-warning)` |
| **`status/danger`** | `#DC5050` | Crimson Red. "Depleted Stock", "Overdue Khata Balance", "Void Entry". | `FRAME_FILL`, `TEXT_FILL` | `var(--color-danger)` |

---

## 3. Typography Hierarchy

The system uses **Inter** (pre-loaded with clean rendering in web browsers and electron environments):

- **Display / Brand Heading:** Inter Bold, 44px (Line height: 52px)
- **Screen Title (H1):** Inter Bold, 24px (Line height: 32px)
- **Section Heading (H2):** Inter Bold, 20px (Line height: 28px)
- **Card Title / Sub-heading (H3):** Inter Semi Bold, 15px (Line height: 22px)
- **Primary Body & Table Text:** Inter Regular & Medium, 13px - 14px (Line height: 20px)
- **Meta / Caption / Badges:** Inter Semi Bold & Medium, 11px - 12px (Line height: 16px)

---

## 4. Reusable UI Component Specifications

### 4.1 Buttons
- **Primary Emerald (`#087A55`):** 8px corner radius, white text, 10px vertical padding, 20px horizontal padding.
- **Secondary Forest (`#064E3B`):** Used for terminal printing and hardware trigger actions.
- **Outline Button:** `#FFFFFF` fill with 1px `#E4EAE5` stroke and `#172B25` text.
- **Danger Button (`#DC5050`):** Used for voiding transactions and emergency stops.

### 4.2 Status Chips & Badges
- 20px pill radius, 4px vertical / 12px horizontal padding.
- Combinations:
  - `In Stock`: `#E8F8F0` bg with `#16A36A` text.
  - `Low Stock`: `#FEF7E8` bg with `#E6A23C` text.
  - `Depleted / Overdue`: `#FEECEC` bg with `#DC5050` text.
  - `Moisture Tested`: `#E8F8F0` bg with `#087A55` text.

### 4.3 Catch-Weight Dual-UOM Input
- A specialized composite input component combining:
  1. `Bag Count` input (e.g. `200 Bags`, 50kg PP Woven).
  2. `Actual Scale Net Weight` input (e.g. `9,940.00 Kg`) with automatic tare subtraction display.

### 4.4 Executive KPI Card
- Dimensions: 272px $\times$ 110px.
- White `#FFFFFF` card with 10px border radius, 1px `#E4EAE5` border.
- Structure: Label + Trend Badge $\rightarrow$ Big Value (20px Bold Forest Green) $\rightarrow$ Secondary Subtitle (Variety count, valuation).

---

## 5. Flagship Screen Inventory & Operational Highlights

### Screen 01: Login Page
- **Dimensions:** 1440 $\times$ 900.
- **Left Panel:** 600px wide `#064E3B` Forest Green brand hero with grain ERP features and enterprise badges.
- **Right Panel:** Centered clean card with Operator ID, Password, Terminal Location selector, and high-visibility login trigger.

### Screen 02: Main Operations Dashboard
- **Dimensions:** 1440 $\times$ 1080.
- **Sidebar:** 240px wide `#064E3B` with active Deep Emerald menu indicators and live POS shift status banner.
- **Topbar:** Quick search, `+ New POS Sale [F2]` shortcut, User avatar, and notification badges.
- **KPI Metrics:** Rice Stock Valuation (Rs. 142.8M), Today's Sales (Rs. 2.84M), Today's Paddy Intake (32.4 MT), Liquid Cash & Bank (Rs. 14.92M).
- **Interactive Visuals:** Weekly Trading Volume (MT) bar chart comparing Sales vs Paddy Intake; Variety breakdown progress bars (1121 Kainat, Super Kernel, Basmati 385, Broken Tota); Live Low-Stock warning alerts.

### Screen 03: Dual-Unit Stock Overview & Godown Matrix
- **Dimensions:** 1200 $\times$ 850.
- **Godown Tabs:** Switch between All Locations, Central Mill Godown 1, Mandi Gate Godown 2, Raw Paddy Silo A, and POS Retail Floor.
- **Data Table:** Shows SKU, Variety & Grade, Packaging Type, Godown Location, Bag Count, Scale Net Weight (Kg), Unit Cost, and Live Stock Status.

### Screen 08: Ultra-Fast Daily Sales Entry & POS Counter
- **Dimensions:** 1440 $\times$ 900.
- **Speed Ergonomics:** Designed for sub-15-second counter sales.
- **Keyboard Hotkeys:** `[F1]` Search Item, `[F2]` New Bill, `[F4]` Party Khata, `[F8]` Cash Paid, `[F9]` Print ESC/POS.
- **Quick Bag Buttons:** Instant `+1`, `+5`, `+10`, `+50`, `+100` Bag increment chips.
- **Split Payment & Change Calculator:** Instant big net payable banner (`Rs. 312,950.00`), Tendered cash entry, and green change due display (`Rs. 2,050.00`).

### Screen 09: Sales Invoice & Gate Outward Delivery Challan
- **Dimensions:** 1200 $\times$ 950.
- **Format:** Professional commercial sales invoice printable on A4 or 80mm roll.
- **Rice Particulars:** Billed party details, Gate Outward Pass ID (`GOP-2026-4029`), Truck Number (`LES-8420`), Bilty Number, Driver phone, certified scale net weight, packaging material charges, trade discounts, and authorized signatures.

### Screen 12: Purchase Bill & Digital Weighbridge Kanda Slip
- **Dimensions:** 1200 $\times$ 850.
- **Weighbridge Electronics:** Side-by-side view showing electronic scale readings (Gross Truck Weight 38,420kg, Tare Truck Weight 13,100kg, Bardana Tare deduction -550kg, Moisture Cut -380kg) yielding exact billable grain weight (24,390kg / 609.75 Maunds).
- **Arthi Billing:** Purchase cost calculation with Arhat commission (+1.5%), Palledari labor (+Rs. 12,500), Market Cess (+Rs. 5,610), and Driver Advance deduction.

### Screen 15: Customer Khatabook Statement
- **Dimensions:** 1200 $\times$ 850.
- **Features:** Opening balance, Total invoiced debits, Total received credits, and Current outstanding running balance.
- **One-Click Actions:** `📲 Share on WhatsApp` summary generator and `📄 Export Statement PDF`.

### Screen 21: Daily Closing & POS Register Reconciliation
- **Dimensions:** 1440 $\times$ 850.
- **Audit Process:** Expected system cash in drawer (`Rs. 420,500.00`) vs. physical counted currency notes (`Rs. 420,500.00`).
- **Currency Denomination Breakdown:** Counts of Rs. 5000, Rs. 1000, Rs. 500, Rs. 100, and Rs. 50 notes.
- **Shift Actions:** Finalize & Close POS Shift button and Print ESC/POS Z-Report trigger.

### Screen 23: Rice Milling & Production Run
- **Dimensions:** 1200 $\times$ 850.
- **Mass Balance Yield Engine:** 10,000 kg Raw Paddy intake converted into 6,520 kg (65.2%) Head Rice Grade A, 380 kg (3.8%) Broken Rice (Tota), 840 kg (8.4%) Rice Bran (Phak), and 2,260 kg (22.6%) Husk & Moisture loss.

---

## 6. Accessing and Reviewing the Design in Figma

You can open and view the live Figma file directly:
👉 **[Open AL ARAB RICE TRADERS Figma Design](https://www.figma.com/design/xw0wo5aNtrte79tXpal6tQ)**

All frames, components, and variables are editable in your Figma workspace under your account (`nlh624333@gmail.com`).
