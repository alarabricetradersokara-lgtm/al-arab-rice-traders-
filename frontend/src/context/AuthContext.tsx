import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleName } from '../types/auth';
import { authService } from '../services/auth.service';
import { getStoredToken, clearStoredAuth, setStoredAuth } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  switchOperator: (username: 'admin' | 'accountant' | 'stock_mgr' | 'sales_op' | 'viewer') => Promise<void>;
  hasRole: (...roles: RoleName[]) => boolean;
  hasPermission: (permissionCode: string) => boolean;
  isSuperAdminOrAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const OPERATOR_CREDENTIALS: Record<string, { u: string; p: string }> = {
  admin: { u: 'admin', p: 'Admin@12345' },
  accountant: { u: 'accountant', p: 'AlArab@2026' },
  stock_mgr: { u: 'stock_mgr', p: 'AlArab@2026' },
  sales_op: { u: 'sales_op', p: 'AlArab@2026' },
  viewer: { u: 'viewer', p: 'AlArab@2026' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and verify secure auth session
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = getStoredToken();
      const savedUser = localStorage.getItem('alarab_user') || localStorage.getItem('al_arab_erp_user');

      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          // Verify with live backend session check
          const freshUser = await authService.getCurrentUser();
          setUser(freshUser);
          setStoredAuth(savedToken, freshUser);
        } catch (e) {
          console.warn('Stored token is expired or invalid. Requiring password authentication.');
          clearStoredAuth();
          setUser(null);
          setToken(null);
        }
      } else {
        // No saved session: user must log in
        clearStoredAuth();
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login(username, password);
      const accessToken = res.tokens.accessToken;
      const loggedUser = {
        ...res.user,
        roleName: res.user.role as RoleName,
        roleId: '',
        isActive: true,
      };

      setToken(accessToken);
      setUser(loggedUser);
      setStoredAuth(accessToken, loggedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
  };

  const switchOperator = async (roleKey: 'admin' | 'accountant' | 'stock_mgr' | 'sales_op' | 'viewer') => {
    setIsLoading(true);
    try {
      const creds = OPERATOR_CREDENTIALS[roleKey];
      if (creds) {
        await login(creds.u, creds.p);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdminOrAdmin =
    user?.roleName === 'ADMIN' ||
    user?.roleName === 'SUPER_ADMIN' ||
    (user as any)?.role === 'ADMIN' ||
    (user as any)?.role === 'SUPER_ADMIN';

  const hasRole = (...roles: RoleName[]): boolean => {
    if (!user) return false;
    if (isSuperAdminOrAdmin && roles.includes('ADMIN' as RoleName)) return true;
    return roles.includes(user.roleName);
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!user) return false;
    if (isSuperAdminOrAdmin) return true;
    return user.permissions?.includes(permissionCode) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        switchOperator,
        hasRole,
        hasPermission,
        isSuperAdminOrAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
