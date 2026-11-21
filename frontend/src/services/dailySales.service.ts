import api, { ensureAuthenticated } from './api';
import type {
  DailySalesSheetResponse,
  DailySalesEntry,
  DailyClosingReportResponse,
} from '../types/dailySales';

export const dailySalesService = {
  async getDailySalesSheet(date: string, warehouseId: string): Promise<DailySalesSheetResponse> {
    await ensureAuthenticated();
    const res = await api.get('/daily-sales/sheet', {
      params: { date, warehouseId },
    });
    return res.data?.data;
  },

  async saveDailySalesDraft(data: any): Promise<DailySalesEntry> {
    await ensureAuthenticated();
    const res = await api.post('/daily-sales/draft', data);
    return res.data?.data;
  },

  async confirmDailySales(id: string): Promise<DailySalesEntry> {
    await ensureAuthenticated();
    const res = await api.post(`/daily-sales/${id}/confirm`);
    return res.data?.data;
  },

  async reverseDailySales(id: string, reason: string): Promise<DailySalesEntry> {
    await ensureAuthenticated();
    const res = await api.post(`/daily-sales/${id}/reverse`, { reason });
    return res.data?.data;
  },

  async getDailySalesHistory(params?: {
    warehouseId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<DailySalesEntry[]> {
    await ensureAuthenticated();
    const res = await api.get('/daily-sales/history', { params });
    return res.data?.data || [];
  },

  async getDailyClosingReport(id: string): Promise<DailyClosingReportResponse> {
    await ensureAuthenticated();
    const res = await api.get(`/daily-sales/${id}/report`);
    return res.data?.data;
  },
};
