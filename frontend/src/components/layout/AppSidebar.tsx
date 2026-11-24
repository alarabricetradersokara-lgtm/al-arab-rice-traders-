import React from 'react';
import clsx from 'clsx';
import {
  CalendarCheck,
  Boxes,
  PlusCircle,
  History,
  AlertTriangle,
  PackagePlus,
  Scale,
  FileSpreadsheet,
  Truck,
  Users,
  DollarSign,
  Landmark,
  Factory,
  Globe,
  ArrowLeftRight,
  UserCheck,
  Sliders,
  LayoutDashboard,
  BarChart3,
  Shield,
  FileText,
  X,
} from 'lucide-react';
import { CompanySettings } from '../../types/advanced';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';

export type NavTab =
  | 'dashboard'
  | 'reports'
  | 'daily-sales'
  | 'owner-dispatch'
  | 'purchases'
  | 'parties'
  | 'accounting'
  | 'production'
  | 'commission'
  | 'export'
  | 'transfers'
  | 'stock-overview'
  | 'products'
  | 'opening-stock'
  | 'movements'
  | 'alerts'
  | 'audit';

interface AppSidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lowStockCount: number;
  companySettings?: CompanySettings | null;
  onOpenSettings?: () => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onSelectTab,
  lowStockCount,
  companySettings,
  onOpenSettings,
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  const { hasPermission, isSuperAdminOrAdmin } = useAuth();

  // Main Overview Items
  const overviewItems = [
    {
      id: 'dashboard' as NavTab,
      labelUrdu: 'ڈیش بورڈ',
      labelEn: 'Dashboard Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      enabled: hasPermission('dashboard:view'),
    },
    {
      id: 'reports' as NavTab,
      labelUrdu: 'کاروباری رپورٹس',
      labelEn: 'Business & Khata Reports',
      icon: <BarChart3 className="w-4 h-4" />,
      enabled: hasPermission('reports:view'),
    },
  ];

  // Daily Trading Operations
  const dailyTradingItems = [
    {
      id: 'daily-sales' as NavTab,
      labelUrdu: 'روزانہ رجسٹر',
      labelEn: 'Daily Sales & Purchases',
      icon: <CalendarCheck className="w-4 h-4" />,
      badge: 'مال آیا/بکا',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      enabled: hasPermission('sales:create'),
    },
    {
      id: 'owner-dispatch' as NavTab,
      labelUrdu: 'اوکاڑہ مال روانگی کھاتہ',
      labelEn: 'Okara Dispatch & Capital',
      icon: <Truck className="w-4 h-4" />,
      badge: 'اونر کھاتہ',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      enabled: true,
    },
    {
      id: 'parties' as NavTab,
      labelUrdu: 'کھاتہ رجسٹر',
      labelEn: 'Parties Khatabook',
      icon: <Users className="w-4 h-4" />,
      badge: 'کھاتہ',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      enabled: hasPermission('customers:view'),
    },
    {
      id: 'purchases' as NavTab,
      labelUrdu: 'منڈی خریداریاں',
      labelEn: 'Procurement & Inward Bills',
      icon: <Truck className="w-4 h-4" />,
      enabled: hasPermission('purchases:manage'),
    },
    {
      id: 'accounting' as NavTab,
      labelUrdu: 'مالی اکاؤنٹس و بینک',
      labelEn: 'Cash & Bank Accounts',
      icon: <Landmark className="w-4 h-4" />,
      badge: 'بینک کھاتے',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      enabled: hasPermission('accounts:view'),
    },
  ];

  // Stock & Inventory
  const inventoryItems = [
    {
      id: 'stock-overview' as NavTab,
      labelUrdu: 'دکان سٹاک بیلنس',
      labelEn: 'Shop Stock & Bag Counts',
      icon: <Boxes className="w-4 h-4" />,
      badge: lowStockCount > 0 ? `${lowStockCount} کم سٹاک` : null,
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
      enabled: hasPermission('stock:view'),
    },
    {
      id: 'products' as NavTab,
      labelUrdu: 'چاول ورائٹیز',
      labelEn: 'Rice Products Catalog',
      icon: <PackagePlus className="w-4 h-4" />,
      enabled: hasPermission('products:manage') || hasPermission('stock:view'),
    },
    {
      id: 'movements' as NavTab,
      labelUrdu: 'سٹاک لیجر',
      labelEn: 'Stock In/Out Ledger',
      icon: <History className="w-4 h-4" />,
      enabled: hasPermission('stock:view'),
    },
  ];

  // Optional Advanced Modules
  const advancedItems = [
    {
      id: 'production' as NavTab,
      labelUrdu: 'رائز ملنگ',
      labelEn: 'Milling & Recovery Batches',
      icon: <Factory className="w-4 h-4" />,
      enabled: (companySettings?.enableMilling ?? false) && (hasPermission('inventory:adjust') || isSuperAdminOrAdmin),
    },
    {
      id: 'commission' as NavTab,
      labelUrdu: 'کمیشن و آڑھتی',
      labelEn: 'Brokers & Dalali Khata',
      icon: <UserCheck className="w-4 h-4" />,
      enabled: (companySettings?.enableCommission ?? false) && (hasPermission('accounts:view') || isSuperAdminOrAdmin),
    },
    {
      id: 'export' as NavTab,
      labelUrdu: 'ایکسپورٹ',
      labelEn: 'Export Orders & Contracts',
      icon: <Globe className="w-4 h-4" />,
      enabled: (companySettings?.enableExport ?? false) && (hasPermission('accounts:view') || isSuperAdminOrAdmin),
    },
    {
      id: 'transfers' as NavTab,
      labelUrdu: 'گودام ٹرانسفر',
      labelEn: 'Warehouse Transfers',
      icon: <ArrowLeftRight className="w-4 h-4" />,
      enabled: (companySettings?.enableMultiWarehouse ?? false) && (hasPermission('transfers:manage') || isSuperAdminOrAdmin),
    },
  ];

  // Admin & Security
  const adminSecurityItems = [
    {
      id: 'audit' as NavTab,
      labelUrdu: 'سیکیورٹی آڈٹ لاگ',
      labelEn: 'Activity Audit Trail',
      icon: <FileText className="w-4 h-4" />,
      enabled: isSuperAdminOrAdmin,
    },
  ];

  interface NavGroupItem {
    id: NavTab;
    labelUrdu: string;
    labelEn: string;
    icon: React.ReactNode;
    badge?: string | null;
    badgeColor?: string;
    enabled: boolean;
  }

  const renderNavGroup = (titleUrdu: string, titleEn: string, items: NavGroupItem[]) => {
    const visibleItems = items.filter((item) => item.enabled);
    if (visibleItems.length === 0) return null;

    return (
      <div className="space-y-1 pt-1 pb-1">
        <div className="px-3 pt-2 pb-1 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{titleUrdu}</span>
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{titleEn}</span>
        </div>
        {visibleItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={clsx(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group',
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={clsx(
                    'shrink-0 p-1 rounded-lg transition-colors',
                    isActive ? 'bg-white/10 text-white' : 'text-slate-400 group-hover:text-slate-700'
                  )}
                >
                  {item.icon}
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-xs font-bold leading-snug truncate">{item.labelUrdu}</span>
                  <span
                    className={clsx(
                      'text-[10px] leading-tight font-medium truncate',
                      isActive ? 'text-emerald-100' : 'text-slate-400'
                    )}
                  >
                    {item.labelEn}
                  </span>
                </div>
              </div>
              {item.badge && (
                <span
                  className={clsx(
                    'text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ml-2 whitespace-nowrap',
                    isActive
                      ? 'bg-white/20 text-white border-white/20'
                      : item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isOpenOnMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/50 z-40 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'bg-white border-r border-slate-200/80 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] z-50 transition-transform duration-200 ease-in-out',
          'md:static md:w-64 lg:w-72 md:translate-x-0',
          'fixed inset-y-0 left-0 w-80 max-w-[88vw] shadow-2xl md:shadow-none',
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Mobile Header in Slide Drawer */}
        <div className="flex md:hidden items-center justify-between p-3.5 border-b border-slate-800 bg-slate-900 text-white">
          <BrandLogo
            size="sm"
            textColor="light"
            subText="اوکاڑہ ⟷ مانسہرہ (Okara · Mansehra)"
          />
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white cursor-pointer ml-1"
            aria-label="مینیو بند کریں"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {renderNavGroup('کاروبار', 'OVERVIEW', overviewItems)}
          {renderNavGroup('روزانہ کا کام', 'DAILY TRADING', dailyTradingItems)}
          {renderNavGroup('سٹاک و گودام', 'INVENTORY', inventoryItems)}
          {advancedItems.some((i) => i.enabled) && renderNavGroup('دیگر ماڈیولز', 'ADVANCED', advancedItems)}
          {renderNavGroup('انتظام و سیکیورٹی', 'ADMIN', adminSecurityItems)}
        </nav>

        {/* Enterprise Module Toggle Trigger (Admin only) */}
        {onOpenSettings && isSuperAdminOrAdmin && (
          <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
            <button
              onClick={() => {
                onOpenSettings();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-500" /> ماڈیول سیٹنگز (Modules)
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                CONFIG
              </span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
