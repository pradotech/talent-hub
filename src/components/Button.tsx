import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
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
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg active:scale-[0.99] cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    // Verde Profundo oficial com texto branco
    primary: 'bg-fia-deep text-white hover:bg-fia-navy-800 border border-fia-deep focus:ring-fia-deep/30 shadow-xs',
    // Verde Decidido oficial com texto Verde Profundo (alto contraste conforme regras de acessibilidade)
    accent: 'bg-fia-lime text-fia-deep hover:bg-[#b5f560] font-semibold border border-[#b2e865] focus:ring-fia-lime/40 shadow-xs',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 focus:ring-slate-300',
    outline: 'bg-transparent text-fia-deep border border-slate-300 hover:bg-fia-sereno/50 focus:ring-fia-deep/20',
    ghost: 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-200',
    danger: 'bg-red-700 text-white hover:bg-red-800 border border-red-700 focus:ring-red-300',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
      ) : leftIcon ? (
        <span className="inline-flex shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !isLoading && (
        <span className="inline-flex shrink-0">{rightIcon}</span>
      )}
    </button>
  );
};
