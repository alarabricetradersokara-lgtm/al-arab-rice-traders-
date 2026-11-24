import api, { ensureAuthenticated } from './api';
import {
  RiceProduct,
  RiceCategory,
  Warehouse,
  StockRecord,
  StockOverviewSummary,
  StockMovement,
  StockAlert,
} from '../types/inventory';

export const inventoryService = {
  async getProducts(params?: { search?: string; categoryId?: string; variety?: string }): Promise<RiceProduct[]> {
    await ensureAuthenticated();
    const res = await api.get('/inventory/products', { params });
    return res.data?.data || [];
  },

  async createProduct(data: any): Promise<RiceProduct> {
    await ensureAuthenticated();
    const res = await api.post('/inventory/products', data);
    return res.data?.data;
  },

  async updateProduct(id: string, data: any): Promise<RiceProduct> {
    await ensureAuthenticated();
    const res = await api.put(`/inventory/products/${id}`, data);
    return res.data?.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await ensureAuthenticated();
    await api.delete(`/inventory/products/${id}`);
  },

  async getCategories(): Promise<RiceCategory[]> {
    await ensureAuthenticated();
    const res = await api.get('/inventory/categories');
    return res.data?.data || [];
  },

  async getWarehouses(): Promise<Warehouse[]> {
    await ensureAuthenticated();
    const res = await api.get('/inventory/warehouses');
    return res.data?.data || [];
  },

  async getStockOverview(params?: {
    warehouseId?: string;
    categoryId?: string;
    lowStockOnly?: boolean;
  }): Promise<{ stocks: StockRecord[]; summary: StockOverviewSummary }> {
    await ensureAuthenticated();
    const res = await api.get('/inventory/overview', { params });
    return res.data?.data || { stocks: [], summary: {} as any };
  },

  async getStockMovements(params?: {
    warehouseId?: string;
    productId?: string;
    movementType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ movements: StockMovement[]; pagination: any }> {
    await ensureAuthenticated();
    const res = await api.get('/inventory/movements', { params });
    return {
      movements: res.data?.data || [],
      pagination: res.data?.meta || {},
    };
  },

  async createOpeningStock(data: {
    warehouseId: string;
    productId: string;
    bagCount: number;
    weightKg: number;
    unitCostPerKg: number;
    notes?: string;
  }): Promise<any> {
    await ensureAuthenticated();
    const res = await api.post('/inventory/opening-stock', data);
    return res.data?.data;
  },

  async adjustStock(data: {
    warehouseId: string;
    productId: string;
    actualBags: number;
    actualWeightKg: number;
    reason: string;
  }): Promise<any> {
    await ensureAuthenticated();
    const res = await api.post('/inventory/adjust', data);
    return res.data?.data;
  },

  async recordWastage(data: {
    warehouseId: string;
    productId: string;
    bagCount: number;
    weightKg: number;
    reason: string;
  }): Promise<any> {
    await ensureAuthenticated();
    const res = await api.post('/inventory/wastage', data);
    return res.data?.data;
  },

  async getStockAlerts(): Promise<{
    lowStock: StockAlert[];
    outOfStock: StockAlert[];
    totalAlerts: number;
  }> {
    await ensureAuthenticated();
    const res = await api.get('/inventory/alerts');
    return res.data?.data || { lowStock: [], outOfStock: [], totalAlerts: 0 };
  },
};
