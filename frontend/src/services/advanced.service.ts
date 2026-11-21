import api from './api';
import {
  ProductionBatch,
  MillingAnalytics,
  CommissionAgent,
  CommissionTransaction,
  CommissionPayment,
  AgentStatement,
  ExportCustomer,
  ExportInvoice,
  ExportPayment,
  WarehouseTransfer,
  CompanySettings,
} from '../types/advanced';

export const advancedService = {
  // ---------------- MILLING & PRODUCTION ----------------
  getProductionBatches: async (params?: { warehouseId?: string; status?: string; startDate?: string; endDate?: string }): Promise<ProductionBatch[]> => {
    const res = await api.get('/production/batches', { params });
    return res.data.data;
  },
  getProductionBatchById: async (id: string): Promise<ProductionBatch> => {
    const res = await api.get(`/production/batches/${id}`);
    return res.data.data;
  },
  createProductionBatch: async (data: {
    warehouseId: string;
    startDate?: string;
    endDate?: string;
    processingLaborCost?: number;
    electricityPowerCost?: number;
    otherMillingCost?: number;
    notes?: string;
    inputs: { productId: string; bagCount: number; weightKg: number; unitCostPerKg?: number }[];
    outputs: { productId: string; outputType: string; bagCount: number; weightKg: number; unitCostPerKg?: number }[];
  }): Promise<ProductionBatch> => {
    const res = await api.post('/production/batches', data);
    return res.data.data;
  },
  getMillingAnalytics: async (): Promise<MillingAnalytics> => {
    const res = await api.get('/production/batches/analytics');
    return res.data.data;
  },

  // ---------------- COMMISSION ----------------
  getCommissionAgents: async (params?: { search?: string }): Promise<{ agents: CommissionAgent[]; totalPayable: string }> => {
    const res = await api.get('/commission/agents', { params });
    return res.data.data;
  },
  getCommissionAgentById: async (id: string): Promise<CommissionAgent> => {
    const res = await api.get(`/commission/agents/${id}`);
    return res.data.data;
  },
  createCommissionAgent: async (data: {
    name: string;
    code?: string;
    phone?: string;
    mandiCity?: string;
    commissionType?: string;
    defaultRate?: number;
    openingBalance?: number;
    notes?: string;
  }): Promise<CommissionAgent> => {
    const res = await api.post('/commission/agents', data);
    return res.data.data;
  },
  getCommissionTransactions: async (params?: { agentId?: string; startDate?: string; endDate?: string }): Promise<CommissionTransaction[]> => {
    const res = await api.get('/commission/transactions', { params });
    return res.data.data;
  },
  createCommissionTransaction: async (data: {
    agentId: string;
    transactionDate?: string;
    referenceType?: string;
    referenceNo: string;
    baseAmount?: number;
    bagCount?: number;
    weightKg?: number;
    rateType?: string;
    rateValue?: number;
    notes?: string;
  }): Promise<CommissionTransaction> => {
    const res = await api.post('/commission/transactions', data);
    return res.data.data;
  },
  getCommissionPayments: async (params?: { agentId?: string }): Promise<CommissionPayment[]> => {
    const res = await api.get('/commission/payments', { params });
    return res.data.data;
  },
  createCommissionPayment: async (data: {
    agentId: string;
    paymentDate?: string;
    amount: number;
    paymentMethod: 'CASH' | 'BANK';
    cashAccountId?: string;
    bankAccountId?: string;
    referenceNumber?: string;
    notes?: string;
  }): Promise<CommissionPayment> => {
    const res = await api.post('/commission/payments', data);
    return res.data.data;
  },
  getAgentStatement: async (id: string, params?: { startDate?: string; endDate?: string }): Promise<AgentStatement> => {
    const res = await api.get(`/commission/agents/${id}/statement`, { params });
    return res.data.data;
  },

  // ---------------- EXPORT ----------------
  getExportCustomers: async (params?: { search?: string }): Promise<{ customers: ExportCustomer[]; totalReceivableFcy: string; totalReceivablePkr: string }> => {
    const res = await api.get('/export/customers', { params });
    return res.data.data;
  },
  getExportCustomerById: async (id: string): Promise<ExportCustomer> => {
    const res = await api.get(`/export/customers/${id}`);
    return res.data.data;
  },
  createExportCustomer: async (data: {
    companyName: string;
    country: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    preferredCurrency?: string;
    destinationPort?: string;
    paymentTerms?: string;
    taxId?: string;
    notes?: string;
  }): Promise<ExportCustomer> => {
    const res = await api.post('/export/customers', data);
    return res.data.data;
  },
  getExportInvoices: async (params?: { customerId?: string; status?: string }): Promise<ExportInvoice[]> => {
    const res = await api.get('/export/invoices', { params });
    return res.data.data;
  },
  getExportInvoiceById: async (id: string): Promise<ExportInvoice> => {
    const res = await api.get(`/export/invoices/${id}`);
    return res.data.data;
  },
  createExportInvoice: async (data: any): Promise<ExportInvoice> => {
    const res = await api.post('/export/invoices', data);
    return res.data.data;
  },
  getExportPayments: async (params?: { customerId?: string; invoiceId?: string }): Promise<ExportPayment[]> => {
    const res = await api.get('/export/payments', { params });
    return res.data.data;
  },
  createExportPayment: async (data: any): Promise<ExportPayment> => {
    const res = await api.post('/export/payments', data);
    return res.data.data;
  },

  // ---------------- WAREHOUSE TRANSFERS & AUDIT ----------------
  getWarehouseTransfers: async (params?: { fromWarehouseId?: string; toWarehouseId?: string; status?: string }): Promise<WarehouseTransfer[]> => {
    const res = await api.get('/warehouse-transfers', { params });
    return res.data.data;
  },
  getWarehouseTransferById: async (id: string): Promise<WarehouseTransfer> => {
    const res = await api.get(`/warehouse-transfers/${id}`);
    return res.data.data;
  },
  createWarehouseTransfer: async (data: {
    fromWarehouseId: string;
    toWarehouseId: string;
    transferDate?: string;
    driverName?: string;
    vehicleNumber?: string;
    biltyNumber?: string;
    notes?: string;
    items: { productId: string; sentBags: number; sentWeightKg: number }[];
  }): Promise<WarehouseTransfer> => {
    const res = await api.post('/warehouse-transfers', data);
    return res.data.data;
  },
  receiveWarehouseTransfer: async (id: string, data: { receivedItems: { itemId?: string; productId: string; receivedBags: number; receivedWeightKg: number }[]; notes?: string }): Promise<WarehouseTransfer> => {
    const res = await api.post(`/warehouse-transfers/${id}/receive`, data);
    return res.data.data;
  },
  reconcileWarehouseStock: async (data: {
    warehouseId: string;
    productId: string;
    physicalBags: number;
    physicalWeightKg: number;
    reason?: string;
  }): Promise<any> => {
    const res = await api.post('/warehouse-transfers/reconcile', data);
    return res.data.data;
  },

  // ---------------- FEATURE TOGGLES & SETTINGS ----------------
  getCompanySettings: async (): Promise<CompanySettings> => {
    const res = await api.get('/settings/company');
    return res.data.data;
  },
  updateCompanySettings: async (data: Partial<CompanySettings>): Promise<CompanySettings> => {
    const res = await api.put('/settings/company', data);
    return res.data.data;
  },
};
