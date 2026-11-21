import React from 'react';
import clsx from 'clsx';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  unit?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'emerald' | 'amber' | 'blue' | 'rose';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  unit,
  icon,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'border-[#E4EAE5] bg-white',
    emerald: 'border-[#A7F3D0] bg-[#F0FDF4]',
    amber: 'border-[#FDE68A] bg-[#FFFBEB]',
    blue: 'border-[#BAE6FD] bg-[#F0F9FF]',
    rose: 'border-[#FECACA] bg-[#FEF2F2]',
  };

  const iconBgStyles = {
    default: 'bg-[#F5F7F5] text-[#087A55]',
    emerald: 'bg-[#DCFCE7] text-[#087A55]',
    amber: 'bg-[#FEF3C7] text-[#D97706]',
    blue: 'bg-[#E0F2FE] text-[#0284C7]',
    rose: 'bg-[#FEE2E2] text-[#DC2626]',
  };

  return (
    <div
      className={clsx(
        'rounded-xl border p-4 shadow-xs transition-all hover:shadow-md flex items-center justify-between',
        variantStyles[variant]
      )}
    >
      <div>
        <p className="text-xs font-medium text-[#718078] uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="text-2xl font-bold text-[#172B25] font-mono-num">{value}</span>
          {unit && <span className="text-xs font-semibold text-[#718078]">{unit}</span>}
        </div>
        {subValue && <p className="text-xs text-[#087A55] font-medium mt-1">{subValue}</p>}
      </div>
      <div className={clsx('p-3 rounded-xl', iconBgStyles[variant])}>{icon}</div>
    </div>
  );
};
