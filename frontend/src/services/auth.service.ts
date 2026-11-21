import { User, Role, AuditLog, AuditSummary, LoginResponse } from '../types/auth';
import { getStoredToken, setStoredAuth, clearStoredAuth, ensureAuthenticated } from './api';

const API_BASE = '/api';

export const authService = {
  getAuthHeaders(): HeadersInit {
    const token = getStoredToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Login failed');
    }

    setStoredAuth(json.data.tokens.accessToken, json.data.user);
    return json.data;
  },

  async getCurrentUser(): Promise<User> {
    let res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getAuthHeaders(),
    });

    if (res.status === 401) {
      // Re-authenticate silently and retry
      clearStoredAuth();
      await ensureAuthenticated(true);
      res = await fetch(`${API_BASE}/auth/me`, {
        headers: this.getAuthHeaders(),
      });
    }

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch current operator profile');
    }
    return json.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to update password');
    }
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`, {
      headers: this.getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch users');
    }
    return json.data;
  },

  async getRoles(): Promise<Role[]> {
    const res = await fetch(`${API_BASE}/users/roles`, {
      headers: this.getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch roles');
    }
    return json.data;
  },

  async createUser(payload: {
    username: string;
    email: string;
    fullName: string;
    phone?: string;
    password: string;
    roleId: string;
  }): Promise<User> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to create user');
    }
    return json.data;
  },

  async updateUser(
    id: string,
    payload: { fullName?: string; email?: string; phone?: string; roleId?: string }
  ): Promise<User> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to update user');
    }
    return json.data;
  },

  async toggleUserStatus(id: string): Promise<{ id: string; isActive: boolean }> {
    const res = await fetch(`${API_BASE}/users/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to toggle status');
    }
    return json.data;
  },

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const res = await fetch(`${API_BASE}/users/${id}/reset-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ newPassword }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to reset password');
    }
  },

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    entityName?: string;
    search?: string;
  }): Promise<{ logs: AuditLog[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.action) query.set('action', params.action);
    if (params?.entityName) query.set('entityName', params.entityName);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/audit-logs?${query.toString()}`, {
      headers: this.getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch audit trail');
    }
    return json.data;
  },

  async getAuditSummary(): Promise<AuditSummary> {
    const res = await fetch(`${API_BASE}/audit-logs/summary`, {
      headers: this.getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch audit summary');
    }
    return json.data;
  },
};
