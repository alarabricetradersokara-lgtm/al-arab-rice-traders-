import api from './api';
import {
  DashboardKpi,
  DashboardPeriodInfo,
  DashboardChartsData,
  DashboardRecentData,
} from '../types/dashboard';

export const dashboardService = {
  getStats: async (params?: {
    filter?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ kpi: DashboardKpi; period: DashboardPeriodInfo }> => {
    const res = await api.get('/dashboard/stats', { params });
    return res.data.data;
  },

  getCharts: async (days: number = 14): Promise<DashboardChartsData> => {
    const res = await api.get('/dashboard/charts', { params: { days } });
    return res.data.data;
  },

  getRecent: async (): Promise<DashboardRecentData> => {
    const res = await api.get('/dashboard/recent');
    return res.data.data;
  },
};
