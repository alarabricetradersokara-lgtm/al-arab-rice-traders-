import type { RiceProduct, Warehouse } from './inventory';

export type DailySalesStatus = 'DRAFT' | 'SUBMITTED' | 'CONFIRMED' | 'REVERSED';

export interface DailySalesEntryLine {
  id?: string;
  productId: string;
  product?: RiceProduct;
  bagCount: number;
  weightKg: number;
  ratePerKg: number;
  lineTotal: number;
  unitCostPerKg: number;
  cogsAmount: number;
  grossProfit: number;
}

export interface DailySalesCustomerAllocation {
  id?: string;
  customerId?: string | null;
  customer?: { id: string; name: string; code: string; phone?: string };
  customerName: string;
  amount: number;
  notes?: string;
}

export interface DailySalesEntry {
  id: string;
  entryNumber: string;
  salesDate: string;
  warehouseId: string;
  warehouse?: Warehouse;
  status: DailySalesStatus;
  grossAmount: string | number;
  discountAmount: string | number;
  commissionAmount: string | number;
  netAmount: string | number;
  totalCogs: string | number;
  grossProfit: string | number;
  totalBagsSold: number;
  totalWeightSoldKg: string | number;
  cashAmount: string | number;
  creditAmount: string | number;
  unallocatedCredit: string | number;
  cashAccountId?: string | null;
  cashAccount?: { id: string; name: string; code: string; balance: string | number };
  notes?: string;
  reversalReason?: string;
  confirmedAt?: string;
  confirmedById?: string;
  reversedAt?: string;
  reversedById?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  lines: DailySalesEntryLine[];
  customerAllocations: DailySalesCustomerAllocation[];
}

export interface CatalogProductWithStock {
  id: string;
  code: string;
  name: string;
  variety: string;
  grade: string;
  category: string;
  defaultBagWeightKg: number;
  costPricePerKg: number;
  salePricePerKg: number;
  availableBags: number;
  availableWeightKg: number;
  availableMaunds: number;
}

export interface IndividualSalesSummary {
  totalInvoices: number;
  totalBags: number;
  totalWeightKg: string;
  totalMaunds: string;
  totalAmount: string;
  items: {
    productId: string;
    productName: string;
    bags: number;
    weightKg: string;
    amount: string;
  }[];
}

export interface DailySalesSheetResponse {
  date: string;
  warehouse: { id: string; name: string; code: string };
  productsCatalog: CatalogProductWithStock[];
  existingEntry?: DailySalesEntry | null;
  individualSalesSummary: IndividualSalesSummary;
  cashAccounts: { id: string; name: string; code: string; balance: string | number }[];
  customers: { id: string; name: string; code: string; phone: string; currentBalance: string | number }[];
}

export interface DailyClosingReportResponse {
  company: any;
  entry: DailySalesEntry;
  metrics: {
    totalBags: number;
    totalWeightKg: string | number;
    totalMaunds: string | number;
    grossRevenue: string | number;
    discount: string | number;
    commission: string | number;
    netRevenue: string | number;
    cogs: string | number;
    grossProfit: string | number;
    grossMarginPct: string;
    cashReceived: string | number;
    allocatedCredit: string | number;
    unallocatedCredit: string | number;
  };
}
