export interface DashboardKpi {
  totalStockQuantityBags: number;
  totalStockQuantityKg: string;
  totalStockQuantityMaunds: string;
  totalStockQuantityMt: string;
  totalStockValue: string;
  todaySales: string;
  todaySalesBags: number;
  todayPurchases: string;
  todayPurchaseBags: number;
  todayGrossProfit: string;
  monthlySales: string;
  monthlySalesBags: number;
  monthlyProfit: string;
  monthlyGrossProfit: string;
  monthlyExpenses: string;
  cashInHand: string;
  bankBalance: string;
  totalLiquidFunds: string;
  customerReceivables: string;
  supplierPayables: string;
  lowStockCount: number;
}

export interface DashboardPeriodInfo {
  filter: string;
  startDate: string;
  endDate: string;
  salesAmount: string;
  purchaseAmount: string;
}

export interface DailyTrendPoint {
  date: string;
  label: string;
  sales: number;
  purchases: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  bagsSold: number;
  bagsPurchased: number;
}

export interface MonthlyTrendPoint {
  month: string;
  sales: number;
  purchases: number;
}

export interface TopProductPoint {
  name: string;
  variety: string;
  bags: number;
  weightKg: number;
  maunds: number;
  revenue: number;
}

export interface WarehouseDistributionPoint {
  name: string;
  bags: number;
  weightKg: number;
  metricTons: number;
  valuation: number;
}

export interface VarietyDistributionPoint {
  name: string;
  variety: string;
  bags: number;
  weightKg: number;
  valuation: number;
}

export interface ExpenseDistributionPoint {
  category: string;
  amount: number;
}

export interface DashboardChartsData {
  dailySalesTrend: DailyTrendPoint[];
  monthlyTrend: MonthlyTrendPoint[];
  topProducts: TopProductPoint[];
  warehouseDistribution: WarehouseDistributionPoint[];
  varietyDistribution?: VarietyDistributionPoint[];
  expenseDistribution?: ExpenseDistributionPoint[];
}

export interface RecentSaleRow {
  id: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  totalBags: number;
  totalWeightKg: string;
  netAmount: string;
  paymentType: string;
  status: string;
}

export interface RecentPurchaseRow {
  id: string;
  purchaseNumber: string;
  supplierName: string;
  warehouseName?: string;
  date: string;
  totalBags: number;
  totalWeightKg: string;
  netAmount: string;
  paymentType: string;
  biltyNumber?: string;
}

export interface TopCustomerRow {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  totalPurchases: string;
  currentBalance: string;
}

export interface TopSupplierRow {
  id: string;
  code: string;
  name: string;
  phone: string;
  totalSupplied: string;
  currentBalance: string;
}

export interface LowStockProductRow {
  id: string;
  code: string;
  name: string;
  variety: string;
  totalBags: number;
  totalWeightKg: string;
  reorderLevelKg: string;
  deficitKg: string;
  isOutOfStock: boolean;
}

export interface RecentPaymentRow {
  id: string;
  date: string;
  partyName: string;
  partyType: 'CUSTOMER' | 'SUPPLIER';
  type: string;
  referenceNo: string;
  amount: string;
}

export interface DashboardRecentData {
  recentSales: RecentSaleRow[];
  recentPurchases: RecentPurchaseRow[];
  topCustomers: TopCustomerRow[];
  topSuppliers: TopSupplierRow[];
  lowStockProducts: LowStockProductRow[];
  recentPayments: RecentPaymentRow[];
}
