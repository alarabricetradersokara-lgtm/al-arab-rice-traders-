import api from './api';
import { ReportFilterParams, ReportResponse } from '../types/reports';

export const reportsService = {
  getDailySales: async (params?: ReportFilterParams): Promise<ReportResponse> => {
    const res = await api.get('/reports/daily-sales', { params });
    return res.data.data;
  },

  getDailyClosing: async (params?: ReportFilterParams): Promise<ReportResponse> => {
    const res = await api.get('/reports/daily-closing', { params });
    return res.data.data;
  },

  getMonthlySales: async (params?: ReportFilterParams): Promise<ReportResponse> => {
    const res = await api.get('/reports/monthly-sales', { params });
    return res.data.data;
  },

  getPurchases: async (params?: ReportFilterParams): Promise<ReportResponse> => {
    const res = await api.get('/reports/purchases', { params });
    return res.data.data;
  },

  getProfitLoss: async (params?: ReportFilterParams): Promise<any> => {
    const res = await api.get('/reports/profit-loss', { params });
    return res.data.data;
  },

  getStockValuation: async (params?: ReportFilterParams): Promise<ReportResponse> => {
    const res = await api.get('/reports/stock-valuation', { params });
    return res.data.data;
  },

  getStockLedger: async (params?: ReportFilterParams): Promise<ReportResponse> => {
    const res = await api.get('/reports/stock-ledger', { params });
    return res.data.data;
  },

  getCustomerOutstanding: async (params?: ReportFilterParams): Promise<ReportResponse> => {
    const res = await api.get('/reports/customer-outstanding', { params });
    return res.data.data;
  },

  getSupplierOutstanding: async (params?: ReportFilterParams): Promise<ReportResponse> => {
    const res = await api.get('/reports/supplier-outstanding', { params });
    return res.data.data;
  },

  getExpenses: async (params?: ReportFilterParams): Promise<ReportResponse> => {
    const res = await api.get('/reports/expenses', { params });
    return res.data.data;
  },

  getCommission: async (params?: ReportFilterParams): Promise<ReportResponse> => {
    const res = await api.get('/reports/commission', { params });
    return res.data.data;
  },

  getWarehouseReports: async (params?: ReportFilterParams): Promise<ReportResponse> => {
    const res = await api.get('/reports/warehouses', { params });
    return res.data.data;
  },
};
