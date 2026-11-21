import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-[#087A55] text-white hover:bg-[#064E3B] active:bg-[#053D2E] shadow-xs border border-transparent',
    secondary: 'bg-[#064E3B] text-white hover:bg-[#043327] shadow-xs border border-transparent',
    outline: 'border border-[#E4EAE5] bg-white text-[#172B25] hover:bg-[#F5F7F5] active:bg-[#EAEFEA]',
    ghost: 'text-[#172B25] hover:bg-[#F5F7F5] border border-transparent',
    danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] border border-transparent shadow-xs',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded-md font-medium gap-1.5',
    md: 'text-sm px-4 py-2 rounded-lg font-medium gap-2',
    lg: 'text-base px-5 py-2.5 rounded-lg font-semibold gap-2.5',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
