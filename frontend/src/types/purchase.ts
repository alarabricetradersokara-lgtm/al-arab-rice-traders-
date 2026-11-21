import { RiceProduct, Warehouse } from './inventory';

export type PaymentType = 'CASH' | 'CREDIT' | 'PARTIAL' | 'BANK';
export type PurchaseStatus = 'DRAFT' | 'PENDING_WEIGHBRIDGE' | 'BILLED' | 'CANCELLED';

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
  openingBalance: string | number;
  currentBalance: string | number;
  isArthi: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  id?: string;
  purchaseId?: string;
  productId: string;
  product?: RiceProduct;
  bagCount: number;
  bagWeightKg: number;
  grossWeightKg: number;
  bardanaTareKg: number;
  netWeightKg: number;
  unitPricePerKg: number;
  lineTotal: number;
  rateUnit?: 'KG' | 'MAUND';
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplier?: Supplier;
  warehouseId: string;
  warehouse?: Warehouse;
  purchaseDate: string;
  paymentType: PaymentType;
  status: PurchaseStatus;
  subTotal: string | number;
  moistureDeductionWeightKg: string | number;
  moistureDeductionAmount: string | number;
  bardanaTareDeductionKg: string | number;
  kardaDeductionAmount: string | number;
  commissionAmount: string | number;
  palledariAmount: string | number;
  freightAmount: string | number;
  netAmount: string | number;
  paidAmount: string | number;
  balanceAmount: string | number;
  truckNumber?: string;
  biltyNumber?: string;
  notes?: string;
  createdById?: string;
  items: PurchaseItem[];
  returns?: PurchaseReturn[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  purchaseId: string;
  purchase?: Purchase;
  productId: string;
  product?: RiceProduct;
  bagsReturned: number;
  weightReturnedKg: string | number;
  returnRatePerKg: string | number;
  totalRefundAmount: string | number;
  reason: string;
  createdAt: string;
}

export interface CreatePurchaseItemInput {
  productId: string;
  bagCount: number;
  bagWeightKg: number;
  grossWeightKg?: number;
  bardanaTareKg?: number;
  netWeightKg?: number;
  unitPricePerKg: number;
  lineTotal?: number;
  rateUnit?: 'KG' | 'MAUND';
}

export interface CreatePurchaseInput {
  supplierId: string;
  warehouseId: string;
  purchaseDate?: string;
  paymentType: PaymentType;
  truckNumber?: string;
  biltyNumber?: string;
  items: CreatePurchaseItemInput[];
  moistureDeductionWeightKg?: number;
  moistureDeductionAmount?: number;
  kardaDeductionAmount?: number;
  commissionRatePercent?: number;
  palledariAmount?: number;
  freightAmount?: number;
  paidAmount?: number;
  cashAccountId?: string;
  bankAccountId?: string;
  notes?: string;
}

export interface CreatePurchaseReturnInput {
  purchaseId: string;
  productId: string;
  bagsReturned: number;
  weightReturnedKg: number;
  returnRatePerKg: number;
  reason: string;
}

export interface PurchaseRateHistoryItem {
  id: string;
  date: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  variety: string;
  ratePerKg: number;
  ratePerMaund: number;
  bagCount: number;
  netWeightKg: number;
}

export interface SupplierStatementEntry {
  id: string;
  date: string;
  referenceNo: string;
  transactionType: string;
  description: string;
  debit: string;
  credit: string;
  runningBalance: string;
}

export interface SupplierStatementResponse {
  supplier: Supplier;
  period: {
    startDate?: string | null;
    endDate?: string | null;
  };
  openingBalance: string;
  totalDebit: string;
  totalCredit: string;
  closingBalance: string;
  transactions: SupplierStatementEntry[];
  summary?: {
    openingBalance: string;
    totalBilled: string;
    totalPayments: string;
    totalReturns: string;
    currentBalance: string;
  };
  entries?: SupplierStatementEntry[];
}

export interface CashAccount {
  id: string;
  code: string;
  name: string;
  balance: string | number;
}

export interface BankAccount {
  id: string;
  code: string;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  branchName?: string;
  balance: string | number;
}
