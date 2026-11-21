import React from 'react';
import clsx from 'clsx';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Boxes,
  Menu,
} from 'lucide-react';
import type { NavTab } from './AppSidebar';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMobileMenu,
}) => {
  const navButtons = [
    {
      id: 'dashboard' as NavTab,
      label: 'ڈیش بورڈ',
      sublabel: 'Home',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'daily-sales' as NavTab,
      label: 'رات کا کھاتہ',
      sublabel: 'Night Entry',
      icon: <CalendarCheck className="w-5 h-5" />,
      isHighlight: true,
    },
    {
      id: 'parties' as NavTab,
      label: 'ڈیجی کھاتہ',
      sublabel: 'DigiKhata',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'stock-overview' as NavTab,
      label: 'دکان سٹاک',
      sublabel: 'Stock',
      icon: <Boxes className="w-5 h-5" />,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-lg safe-area-inset-bottom">
      {navButtons.map((btn) => {
        const isActive = activeTab === btn.id;

        if (btn.isHighlight) {
          return (
            <button
              key={btn.id}
              onClick={() => onSelectTab(btn.id)}
              className="flex flex-col items-center justify-center -mt-4 cursor-pointer group"
            >
              <div
                className={clsx(
                  'w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all group-active:scale-95 border-2 border-white',
                  isActive
                    ? 'bg-emerald-800 text-white ring-2 ring-emerald-600'
                    : 'bg-emerald-700 text-white'
                )}
              >
                {btn.icon}
              </div>
              <span className="text-[10px] font-bold text-emerald-800 mt-0.5 leading-none">
                {btn.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={btn.id}
            onClick={() => onSelectTab(btn.id)}
            className={clsx(
              'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[54px]',
              isActive
                ? 'text-emerald-800 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <div
              className={clsx(
                'p-1 rounded-lg transition-colors',
                isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500'
              )}
            >
              {btn.icon}
            </div>
            <span className="text-[9px] font-medium mt-0.5 leading-none">
              {btn.label}
            </span>
          </button>
        );
      })}

      {/* 5th Button: Open More Menu Drawer */}
      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-900 min-w-[54px]"
      >
        <div className="p-1 rounded-lg text-slate-500">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[9px] font-medium mt-0.5 leading-none">
          مزید مینیو
        </span>
      </button>
    </div>
  );
};
