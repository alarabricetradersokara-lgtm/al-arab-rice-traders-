import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronDown,
  Shield,
  Key,
  LogOut,
  UserCheck,
  Sparkles,
  Check,
  UserCheck2,
} from 'lucide-react';
import clsx from 'clsx';
import { RoleName } from '../../types/auth';

interface OperatorProfileDropdownProps {
  onOpenChangePassword: () => void;
  onToast: (msg: string) => void;
}

const ROLE_BADGES: Record<string, { label: string; color: string; desc: string }> = {
  ADMIN: {
    label: 'Owner / Executive Admin',
    color: 'bg-emerald-100 text-[#087A55] border-emerald-300',
    desc: 'Root authority & confidential audit access',
  },
  SUPER_ADMIN: {
    label: 'Super Admin',
    color: 'bg-emerald-100 text-[#087A55] border-emerald-300',
    desc: 'Unrestricted full access',
  },
  ACCOUNTANT: {
    label: 'Chief Accountant',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    desc: 'Accounts, Ledgers, P&L & Treasury',
  },
  STOCK_MANAGER: {
    label: 'Godown Incharge / Stock Mgr',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    desc: 'Inventory, Dual-UOM, Weighbridge & Milling',
  },
  SALES_OPERATOR: {
    label: 'Counter POS Operator',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    desc: 'Daily Sales, Invoices & Customer Lookup',
  },
  VIEWER: {
    label: 'External Auditor / Viewer',
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    desc: 'Read-only authorized information',
  },
};

const OPERATOR_DEMO_ACCOUNTS = [
  {
    key: 'admin' as const,
    name: 'Haji Muhammad Arab',
    role: 'ADMIN' as RoleName,
    roleTitle: 'Owner & Executive Admin',
    initials: 'HA',
  },
  {
    key: 'accountant' as const,
    name: 'Sheikh Tariq Mahmood',
    role: 'ACCOUNTANT' as RoleName,
    roleTitle: 'Senior Accountant',
    initials: 'TM',
  },
  {
    key: 'stock_mgr' as const,
    name: 'Chaudhry Bilal Warraich',
    role: 'STOCK_MANAGER' as RoleName,
    roleTitle: 'Godown Incharge / Stock Mgr',
    initials: 'BW',
  },
  {
    key: 'sales_op' as const,
    name: 'Rana Zulfiqar Ali',
    role: 'SALES_OPERATOR' as RoleName,
    roleTitle: 'Counter POS Operator',
    initials: 'ZA',
  },
  {
    key: 'viewer' as const,
    name: 'M. Kashif Butt',
    role: 'VIEWER' as RoleName,
    roleTitle: 'External Auditor / Viewer',
    initials: 'KB',
  },
];

export const OperatorProfileDropdown: React.FC<OperatorProfileDropdownProps> = ({
  onOpenChangePassword,
  onToast,
}) => {
  const { user, switchOperator, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const currentRoleInfo = ROLE_BADGES[user.roleName] || {
    label: user.roleName,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    desc: 'Standard User',
  };

  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'OP';

  const handleSwitch = async (key: 'admin' | 'accountant' | 'stock_mgr' | 'sales_op' | 'viewer', name: string) => {
    setIsOpen(false);
    await switchOperator(key);
    onToast(`Switched operator to ${name} (${key.toUpperCase()})`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 pl-3 border-l border-[#E4EAE5] hover:opacity-90 transition-opacity cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-full bg-[#064E3B] text-white font-bold text-xs flex items-center justify-center shadow-xs">
          {initials}
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-xs font-bold text-[#172B25] group-hover:text-[#087A55] transition-colors flex items-center gap-1.5">
            {user.fullName || user.username}
            <ChevronDown className="w-3.5 h-3.5 text-[#718078]" />
          </p>
          <p className="text-[10px] font-semibold text-[#087A55] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#16A36A]" /> {currentRoleInfo.label}
          </p>
        </div>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-[#E4EAE5] py-2 z-50 animate-in fade-in duration-150">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-[#E4EAE5] bg-[#F5F7F5]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#087A55] text-white font-bold text-sm flex items-center justify-center">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#172B25] truncate">{user.fullName}</p>
                <p className="text-xs text-[#718078] truncate">@{user.username} · {user.email}</p>
                <span
                  className={clsx(
                    'inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold border',
                    currentRoleInfo.color
                  )}
                >
                  {currentRoleInfo.label}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[#718078] mt-2 italic">{currentRoleInfo.desc}</p>
          </div>

          {/* Quick Role Switcher for Verification & Demo */}
          <div className="px-3 py-2 border-b border-[#E4EAE5]">
            <p className="text-[10px] font-bold text-[#718078] uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
              <UserCheck2 className="w-3.5 h-3.5 text-[#087A55]" /> Switch Demo Role
            </p>
            <div className="space-y-1 mt-1">
              {OPERATOR_DEMO_ACCOUNTS.map((op) => {
                const isCurrent = user.username === op.key;
                return (
                  <button
                    key={op.key}
                    onClick={() => handleSwitch(op.key, op.name)}
                    className={clsx(
                      'w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer',
                      isCurrent
                        ? 'bg-emerald-50 text-[#087A55] font-bold'
                        : 'text-[#172B25] hover:bg-[#F5F7F5]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#E8F5E9] text-[#087A55] text-[10px] font-bold flex items-center justify-center">
                        {op.initials}
                      </span>
                      <div>
                        <span className="block">{op.name}</span>
                        <span className="text-[10px] text-[#718078] font-normal">{op.roleTitle}</span>
                      </div>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-[#087A55]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Links */}
          <div className="p-2 space-y-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenChangePassword();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#172B25] hover:bg-[#F5F7F5] hover:text-[#087A55] rounded-xl transition-colors cursor-pointer"
            >
              <Key className="w-4 h-4 text-[#718078]" />
              <span>Change Password</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
                onToast('Operator logged out.');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
