export type CustomerType =
  | 'WHOLESALER'
  | 'RETAILER'
  | 'BROKER'
  | 'EXPORTER'
  | 'HOTEL_BULK'
  | 'WALK_IN';

export type PaymentTerms =
  | 'CASH_ON_DELIVERY'
  | 'NET_7'
  | 'NET_15'
  | 'NET_30'
  | 'MANDI_CYCLE';

export interface Customer {
  id: string;
  code: string;
  name: string;
  businessName?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  city?: string;
  taxNumber?: string;
  customerType: CustomerType | string;
  creditLimit: string | number;
  openingBalance: string | number;
  currentBalance: string | number;
  totalDebits?: string;
  totalCredits?: string;
  isOverLimit?: boolean;
  isActive: boolean;
  notes?: string;
  totalSalesCount?: number;
  totalReceiptsCount?: number;
  totalTransactionsCount?: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  businessName?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  city?: string;
  taxNumber?: string;
  isArthi: boolean;
  paymentTerms: PaymentTerms | string;
  openingBalance: string | number;
  currentBalance: string | number;
  totalDebits?: string;
  totalCredits?: string;
  isActive: boolean;
  notes?: string;
  totalPurchasesCount?: number;
  totalPaymentsCount?: number;
  totalTransactionsCount?: number;
  createdAt: string;
}

export interface PartyLedgerEntry {
  id: string;
  date: string;
  referenceNo: string;
  transactionType: string;
  description: string;
  debit: string;
  credit: string;
  runningBalance: string;
}

export interface PartyStatementResponse {
  customer?: Customer;
  supplier?: Supplier;
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  openingBalance: string;
  totalDebit: string;
  totalCredit: string;
  closingBalance: string;
  transactions: PartyLedgerEntry[];
}

export interface KhatabookSummary {
  totalCustomers: number;
  totalSuppliers: number;
  totalReceivables: string;
  totalPayables: string;
  netDifference: string;
  overLimitCustomersCount: number;
  mandiArthisCount: number;
}
