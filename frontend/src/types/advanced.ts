export type ProductionStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type OutputType = 'HEAD_RICE' | 'BROKEN_RICE' | 'BRAN' | 'HUSK' | 'WASTAGE';

export interface ProductionInput {
  id?: string;
  batchId?: string;
  productId: string;
  product?: { id: string; name: string; code: string };
  bagCount: number;
  weightKg: number | string;
  unitCostPerKg: number | string;
  totalCost: number | string;
}

export interface ProductionOutput {
  id?: string;
  batchId?: string;
  productId: string;
  product?: { id: string; name: string; code: string };
  outputType: OutputType;
  bagCount: number;
  weightKg: number | string;
  unitCostPerKg: number | string;
  totalCost: number | string;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  warehouseId: string;
  warehouse?: { id: string; name: string; code: string };
  startDate: string;
  endDate?: string | null;
  status: ProductionStatus;
  totalInputWeightKg: number | string;
  totalOutputWeightKg: number | string;
  yieldPercentage: number | string;
  totalInputCost: number | string;
  processingLaborCost: number | string;
  electricityPowerCost: number | string;
  otherMillingCost: number | string;
  totalProcessingCost: number | string;
  totalOutputValuation: number | string;
  netBatchProfit: number | string;
  headRiceWeightKg: number | string;
  brokenRiceWeightKg: number | string;
  branWeightKg: number | string;
  huskWeightKg: number | string;
  wastageWeightKg: number | string;
  headRiceYieldPct: number | string;
  notes?: string | null;
  inputs: ProductionInput[];
  outputs: ProductionOutput[];
  createdAt: string;
}

export interface MillingAnalytics {
  totalBatches: number;
  totalCrushedKg: string;
  totalCrushedMaunds: string;
  totalOutputKg: string;
  totalHeadRiceKg: string;
  totalBrokenKg: string;
  totalBranKg: string;
  totalHuskKg: string;
  totalWastageKg: string;
  avgOverallYieldPct: string;
  avgHeadRiceYieldPct: string;
  cumulativeNetMillingProfit: string;
}

// ---------------- COMMISSION ----------------
export type AgentCommissionType = 'PERCENTAGE' | 'PER_BAG' | 'PER_KG';
export type CommTransactionStatus = 'ACCRUED' | 'PAID' | 'CANCELLED';

export interface CommissionAgent {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  mandiCity?: string | null;
  commissionType: AgentCommissionType;
  defaultRate: number | string;
  currentBalance: number | string;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CommissionTransaction {
  id: string;
  transactionNumber: string;
  agentId: string;
  agent?: CommissionAgent;
  transactionDate: string;
  referenceType: string;
  referenceNo: string;
  baseAmount: number | string;
  bagCount: number;
  weightKg: number | string;
  rateType: AgentCommissionType;
  rateValue: number | string;
  commissionAmount: number | string;
  status: CommTransactionStatus;
  notes?: string | null;
  createdAt: string;
}

export interface CommissionPayment {
  id: string;
  paymentNumber: string;
  agentId: string;
  agent?: CommissionAgent;
  paymentDate: string;
  amount: number | string;
  paymentMethod: 'CASH' | 'BANK';
  cashAccountId?: string | null;
  cashAccount?: { id: string; name: string };
  bankAccountId?: string | null;
  bankAccount?: { id: string; bankName: string; accountNumber: string };
  referenceNumber?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
}

export interface AgentStatementLine {
  date: string;
  type: string;
  ref: string;
  description: string;
  debit: string;
  credit: string;
  runningBalance: string;
}

export interface AgentStatement {
  agent: CommissionAgent;
  totalAccruedCommission: string;
  totalPaidCommission: string;
  closingBalancePayable: string;
  statement: AgentStatementLine[];
}

// ---------------- EXPORT ----------------
export type ExportInvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'SHIPPED' | 'REALIZED' | 'CANCELLED';
export type Incoterm = 'FOB' | 'CIF' | 'CFR';

export interface ExportCustomer {
  id: string;
  customerCode: string;
  companyName: string;
  country: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  preferredCurrency: string;
  destinationPort?: string | null;
  paymentTerms?: string | null;
  taxId?: string | null;
  currentReceivableFcy: number | string;
  currentReceivablePkr: number | string;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ExportInvoiceItem {
  id?: string;
  invoiceId?: string;
  productId: string;
  product?: { id: string; name: string; code: string };
  bagType: string;
  bagWeightKg: number | string;
  bagCount: number;
  totalWeightKg: number | string;
  totalWeightMt: number | string;
  ratePerMtFcy: number | string;
  lineTotalFcy: number | string;
  lineTotalPkr: number | string;
  grainLengthMm?: number | string | null;
  moisturePct?: number | string | null;
  brokenPct?: number | string | null;
  notes?: string | null;
}

export interface ExportInvoice {
  id: string;
  invoiceNumber: string;
  exportCustomerId: string;
  exportCustomer?: ExportCustomer;
  invoiceDate: string;
  currency: string;
  exchangeRate: number | string;
  contractNo?: string | null;
  paymentTerms?: string | null;
  incoterm: Incoterm;
  portOfLoading: string;
  portOfDischarge?: string | null;
  vesselName?: string | null;
  containerNumber?: string | null;
  blNumber?: string | null;
  shippingLine?: string | null;
  oceanFreightCost: number | string;
  portHandlingCost: number | string;
  otherShippingCosts: number | string;
  totalFreightCostPkr: number | string;
  totalFcyAmount: number | string;
  totalPkrAmount: number | string;
  paidFcyAmount: number | string;
  paidPkrAmount: number | string;
  status: ExportInvoiceStatus;
  notes?: string | null;
  items: ExportInvoiceItem[];
  createdAt: string;
}

export interface ExportPayment {
  id: string;
  paymentNumber: string;
  exportInvoiceId: string;
  exportInvoice?: ExportInvoice;
  exportCustomerId: string;
  exportCustomer?: ExportCustomer;
  paymentDate: string;
  realizationDate: string;
  currency: string;
  amountFcy: number | string;
  realizedExchangeRate: number | string;
  amountPkr: number | string;
  bankChargesPkr: number | string;
  exchangeGainLossPkr: number | string;
  bankAccountId?: string | null;
  bankAccount?: { id: string; bankName: string; accountNumber: string };
  bankRefNo?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
}

// ---------------- WAREHOUSE TRANSFERS ----------------
export type TransferStatus = 'PENDING_APPROVAL' | 'IN_TRANSIT' | 'RECEIVED' | 'REJECTED';

export interface WarehouseTransferItem {
  id?: string;
  transferId?: string;
  productId: string;
  product?: { id: string; name: string; code: string };
  sentBags: number;
  sentWeightKg: number | string;
  receivedBags: number;
  receivedWeightKg: number | string;
  shortageBags: number;
  shortageWeightKg: number | string;
}

export interface WarehouseTransfer {
  id: string;
  transferNumber: string;
  transferDate: string;
  fromWarehouseId: string;
  fromWarehouse?: { id: string; name: string; code: string };
  toWarehouseId: string;
  toWarehouse?: { id: string; name: string; code: string };
  driverName?: string | null;
  vehicleNumber?: string | null;
  biltyNumber?: string | null;
  status: TransferStatus;
  totalBags: number;
  totalWeightKg: number | string;
  transitLossBags: number;
  transitLossWeightKg: number | string;
  approvedById?: string | null;
  approvedAt?: string | null;
  receivedById?: string | null;
  receivedAt?: string | null;
  notes?: string | null;
  items: WarehouseTransferItem[];
  createdAt: string;
}

// ---------------- COMPANY SETTINGS & TOGGLES ----------------
export interface CompanySettings {
  id?: string;
  companyName: string;
  businessType: string;
  address: string;
  phone: string;
  email: string;
  taxNumber: string;
  currency: string;
  enableMilling: boolean;
  enableCommission: boolean;
  enableExport: boolean;
  enableMultiWarehouse: boolean;
}
