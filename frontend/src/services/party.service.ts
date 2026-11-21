import api from './api';
import type {
  Customer,
  Supplier,
  PartyStatementResponse,
  KhatabookSummary,
} from '../types/party';

export const partyService = {
  // Global Khatabook KPI Summary
  getKhatabookSummary: async (): Promise<KhatabookSummary> => {
    const res = await api.get('/parties/khatabook-summary');
    return res.data.data;
  },

  // Customers
  getCustomers: async (params?: {
    search?: string;
    customerType?: string;
    isActive?: boolean;
    overLimit?: boolean;
  }): Promise<Customer[]> => {
    const res = await api.get('/parties/customers', { params });
    return res.data.data;
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const res = await api.get(`/parties/customers/${id}`);
    return res.data.data;
  },

  createCustomer: async (data: Partial<Customer>): Promise<Customer> => {
    const res = await api.post('/parties/customers', data);
    return res.data.data;
  },

  updateCustomer: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const res = await api.put(`/parties/customers/${id}`, data);
    return res.data.data;
  },

  getCustomerStatement: async (
    id: string,
    params?: { startDate?: string; endDate?: string }
  ): Promise<PartyStatementResponse> => {
    const res = await api.get(`/parties/customers/${id}/statement`, { params });
    return res.data.data;
  },

  recordCustomerReceipt: async (
    id: string,
    data: {
      amount: number;
      receiptDate?: string;
      paymentMethod: 'CASH' | 'BANK' | 'CHEQUE';
      cashAccountId?: string;
      bankAccountId?: string;
      chequeNumber?: string;
      chequeDate?: string;
      referenceNumber?: string;
      notes?: string;
    }
  ): Promise<any> => {
    const res = await api.post(`/parties/customers/${id}/receipt`, data);
    return res.data.data;
  },

  recordCustomerAdjustment: async (
    id: string,
    data: {
      type: 'DEBIT' | 'CREDIT';
      amount: number;
      date?: string;
      reason: string;
      notes?: string;
    }
  ): Promise<any> => {
    const res = await api.post(`/parties/customers/${id}/adjustment`, data);
    return res.data.data;
  },

  // Suppliers
  getSuppliers: async (params?: {
    search?: string;
    isArthi?: boolean;
    isActive?: boolean;
  }): Promise<Supplier[]> => {
    const res = await api.get('/parties/suppliers', { params });
    return res.data.data;
  },

  getSupplierById: async (id: string): Promise<Supplier> => {
    const res = await api.get(`/parties/suppliers/${id}`);
    return res.data.data;
  },

  createSupplier: async (data: Partial<Supplier>): Promise<Supplier> => {
    const res = await api.post('/parties/suppliers', data);
    return res.data.data;
  },

  updateSupplier: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    const res = await api.put(`/parties/suppliers/${id}`, data);
    return res.data.data;
  },

  getSupplierStatement: async (
    id: string,
    params?: { startDate?: string; endDate?: string }
  ): Promise<PartyStatementResponse> => {
    const res = await api.get(`/parties/suppliers/${id}/statement`, { params });
    return res.data.data;
  },

  recordSupplierPayment: async (
    id: string,
    data: {
      amount: number;
      paymentDate?: string;
      paymentMethod: 'CASH' | 'BANK' | 'CHEQUE';
      cashAccountId?: string;
      bankAccountId?: string;
      chequeNumber?: string;
      chequeDate?: string;
      referenceNumber?: string;
      notes?: string;
    }
  ): Promise<any> => {
    const res = await api.post(`/parties/suppliers/${id}/payment`, data);
    return res.data.data;
  },

  recordSupplierAdjustment: async (
    id: string,
    data: {
      type: 'DEBIT' | 'CREDIT';
      amount: number;
      date?: string;
      reason: string;
      notes?: string;
    }
  ): Promise<any> => {
    const res = await api.post(`/parties/suppliers/${id}/adjustment`, data);
    return res.data.data;
  },
};
