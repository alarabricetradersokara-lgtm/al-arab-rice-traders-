export type ReportType =
  | 'daily-sales'
  | 'daily-closing'
  | 'monthly-sales'
  | 'purchases'
  | 'profit-loss'
  | 'stock-valuation'
  | 'stock-ledger'
  | 'customer-outstanding'
  | 'supplier-outstanding'
  | 'expenses'
  | 'commission'
  | 'warehouses';

export interface ReportFilterParams {
  filter?: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  productId?: string;
  customerId?: string;
  supplierId?: string;
  category?: string;
  movementType?: string;
}

export interface ReportResponse<T = any, S = any> {
  rows: T[];
  summary?: S;
  startDate?: string;
  endDate?: string;
  revenue?: any;
  cogs?: any;
  expenses?: any;
  other?: any;
  netProfit?: any;
}
