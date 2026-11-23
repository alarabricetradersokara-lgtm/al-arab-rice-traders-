import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronDown,
  Shield,
  Key,
  LogOut,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

interface OperatorProfileDropdownProps {
  onOpenChangePassword: () => void;
  onToast: (msg: string) => void;
}

const ROLE_BADGES: Record<string, { label: string; color: string; desc: string }> = {
  ADMIN: {
    label: 'ایگزیکٹو ایڈمن / اونر (Admin / Owner)',
    color: 'bg-emerald-100 text-[#087A55] border-emerald-300',
    desc: 'مکمل کاروباری کنٹرول و نفع نقصان رسائی',
  },
  SUPER_ADMIN: {
    label: 'سپر ایڈمن (Super Admin)',
    color: 'bg-emerald-100 text-[#087A55] border-emerald-300',
    desc: 'مکمل سسٹم اختیارات',
  },
  ACCOUNTANT: {
    label: 'چیف اکاؤنٹنٹ (Accountant)',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    desc: 'کھاتے، لیجرز اور مالیاتی گوشوارے',
  },
  STOCK_MANAGER: {
    label: 'گودام انچارج (Stock Manager)',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    desc: 'سٹاک، بوریاں اور آمد و روانگی',
  },
  SALES_OPERATOR: {
    label: 'کاؤنٹر آپریٹر (Sales POS)',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    desc: 'روزانہ مال فروخت اور بلنگ',
  },
  VIEWER: {
    label: 'نگران / آڈیٹر (Viewer)',
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    desc: 'صرف پڑھنے کی مجاز رسائی',
  },
};

export const OperatorProfileDropdown: React.FC<OperatorProfileDropdownProps> = ({
  onOpenChangePassword,
  onToast,
}) => {
  const { user, logout } = useAuth();
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
    : 'AR';

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
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#E4EAE5] py-2 z-50 animate-in fade-in duration-150">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-[#E4EAE5] bg-[#F5F7F5]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#087A55] text-white font-bold text-sm flex items-center justify-center shadow-xs">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#172B25] truncate">{user.fullName || user.username}</p>
                <p className="text-xs text-[#718078] truncate">@{user.username} {user.email ? `· ${user.email}` : ''}</p>
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
              <span>پاس ورڈ تبدیل کریں (Change Password)</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
                onToast('لاگ آؤٹ مکمل ہو گیا۔');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>لاگ آؤٹ سیشن (Logout Session)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
