import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-xl border border-[#E4EAE5] shadow-xs p-5 transition-all',
        onClick && 'cursor-pointer hover:border-[#087A55]/40 hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({
  title,
  subtitle,
  action,
}) => (
  <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E4EAE5]">
    <div>
      <h3 className="text-base font-semibold text-[#172B25]">{title}</h3>
      {subtitle && <p className="text-xs text-[#718078] mt-0.5">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
