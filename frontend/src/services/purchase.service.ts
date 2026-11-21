import api from './api';
import type {
  Purchase,
  CreatePurchaseInput,
  CreatePurchaseReturnInput,
  PurchaseRateHistoryItem,
  Supplier,
  SupplierStatementResponse,
  CashAccount,
  BankAccount,
} from '../types/purchase';

export const purchaseService = {
  // Purchases
  getPurchases: async (params?: {
    supplierId?: string;
    warehouseId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<Purchase[]> => {
    const res = await api.get('/purchases', { params });
    return res.data.data;
  },

  getPurchaseById: async (id: string): Promise<Purchase> => {
    const res = await api.get(`/purchases/${id}`);
    return res.data.data;
  },

  createPurchase: async (payload: CreatePurchaseInput): Promise<Purchase> => {
    const res = await api.post('/purchases', payload);
    return res.data.data;
  },

  createPurchaseReturn: async (payload: CreatePurchaseReturnInput): Promise<any> => {
    const res = await api.post('/purchases/return', payload);
    return res.data.data;
  },

  getPurchaseRateHistory: async (params?: {
    productId?: string;
    supplierId?: string;
    limit?: number;
  }): Promise<PurchaseRateHistoryItem[]> => {
    const res = await api.get('/purchases/rates', { params });
    return res.data.data;
  },

  getSupplierStatement: async (
    supplierId: string,
    params?: { startDate?: string; endDate?: string }
  ): Promise<SupplierStatementResponse> => {
    const res = await api.get(`/purchases/statement/${supplierId}`, { params });
    return res.data.data;
  },

  // Suppliers
  getSuppliers: async (params?: { isArthi?: boolean; search?: string }): Promise<Supplier[]> => {
    const res = await api.get('/parties/suppliers', { params });
    return res.data.data;
  },

  createSupplier: async (data: {
    name: string;
    businessName?: string;
    phone: string;
    alternatePhone?: string;
    email?: string;
    address?: string;
    city?: string;
    taxNumber?: string;
    openingBalance?: number;
    isArthi?: boolean;
  }): Promise<Supplier> => {
    const res = await api.post('/parties/suppliers', data);
    return res.data.data;
  },

  getSupplierLedger: async (supplierId: string): Promise<any> => {
    const res = await api.get(`/parties/suppliers/${supplierId}/ledger`);
    return res.data.data;
  },

  // Cash & Bank Accounts
  getCashAccounts: async (): Promise<CashAccount[]> => {
    const res = await api.get('/accounting/cash-accounts');
    return res.data.data;
  },

  getBankAccounts: async (): Promise<BankAccount[]> => {
    const res = await api.get('/accounting/bank-accounts');
    return res.data.data;
  },
};
