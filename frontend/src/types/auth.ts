export type RoleName =
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'ACCOUNTANT'
  | 'STOCK_MANAGER'
  | 'SALES_OPERATOR'
  | 'VIEWER';

export interface Permission {
  id: string;
  code: string;
  module: string;
  description: string;
}

export interface Role {
  id: string;
  name: RoleName;
  description: string;
  userCount?: number;
  permissions: Permission[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
  roleId: string;
  roleName: RoleName;
  roleDescription?: string;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: RoleName;
    permissions: string[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  entityName: string;
  entityId: string;
  oldValues: any;
  newValues: any;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    role?: RoleName;
  } | null;
}

export interface AuditSummary {
  totalLogs: number;
  todayLogs: number;
  loginsToday: number;
  passwordChanges: number;
  topEntities: { entityName: string; count: number }[];
}
