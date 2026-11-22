import React, { useState } from 'react';
import { Warehouse, Bell, Menu, Palette } from 'lucide-react';
import { OperatorProfileDropdown } from '../auth/OperatorProfileDropdown';
import { ThemeSelectorModal } from './ThemeSelectorModal';
import { useTheme } from '../../context/ThemeContext';

interface AppHeaderProps {
  selectedWarehouse: string;
  onSelectWarehouse: (warehouseId: string) => void;
  warehouses: { id: string; name: string; code: string }[];
  alertCount: number;
  onOpenChangePassword: () => void;
  onToast: (msg: string) => void;
  onToggleMobileMenu?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  selectedWarehouse,
  onSelectWarehouse,
  warehouses,
  alertCount,
  onOpenChangePassword,
  onToast,
  onToggleMobileMenu,
}) => {
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const { themeConfig } = useTheme();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Hamburger Button */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 -ml-1 text-slate-700 hover:bg-slate-100 rounded-xl md:hidden cursor-pointer transition-colors"
            aria-label="مینیو کھولیں"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
        )}

        {/* Brand Icon & Name */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs flex-shrink-0 tracking-wider transition-colors"
            style={{ backgroundColor: themeConfig.primaryColor }}
          >
            AR
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate max-w-[150px] sm:max-w-none">
              العرب رائز ٹریڈرز
            </h1>
            <p className="text-[10px] sm:text-[11px] font-normal text-slate-500 hidden xs:block">
              Al Arab Rice Traders · کاؤنٹر و کھاتہ
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden md:block" />

        {/* Single Shop Context Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-xl">
          <Warehouse className="w-3.5 h-3.5 text-emerald-700" />
          <span className="text-xs font-bold text-emerald-900">مرکزی دکان - مانسہرہ</span>
          <span className="text-[10px] text-emerald-700/80 font-medium">(Main Shop - Mansehra)</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Theme Palette Switcher */}
        <button
          onClick={() => setIsThemeModalOpen(true)}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer"
          title="سسٹم کا رنگ منتخب کریں (Theme Colors)"
        >
          <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
        </button>

        {/* Discreet Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>آن لائن</span>
        </div>

        {/* Stock Alert Bell */}
        <div className="relative">
          <button className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                {alertCount}
              </span>
            )}
          </button>
        </div>

        {/* Dynamic Operator Profile & Quick Role Switcher */}
        <OperatorProfileDropdown
          onOpenChangePassword={onOpenChangePassword}
          onToast={onToast}
        />
      </div>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </header>
  );
};
