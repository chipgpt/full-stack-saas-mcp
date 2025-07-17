import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'cta';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const baseClasses = cn(
    // Base styling
    'group relative inline-flex items-center justify-center gap-2 font-medium rounded-lg',
    'transition-all duration-300 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    // Size variants
    {
      'px-3 py-1.5 text-sm': size === 'sm',
      'px-4 py-2 text-sm': size === 'md',
      'px-6 py-3 text-base': size === 'lg',
    },
    // Variant styling
    {
      // Primary - Beautiful gradient with hover effects (view more style)
      'bg-black text-white shadow-lg hover:shadow-xl hover:scale-105': variant === 'primary',

      // Secondary - Glassmorphism with subtle hover
      'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/30 hover:scale-105 focus:ring-white/50':
        variant === 'secondary',

      // Ghost - Minimal styling with hover
      'bg-transparent border border-white/10 text-white hover:bg-white/5 hover:border-white/20 hover:scale-105 focus:ring-white/50':
        variant === 'ghost',

      // Danger - Red gradient for destructive actions
      'bg-red-500 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25 hover:scale-105 focus:ring-red-500/50':
        variant === 'danger',

      // CTA - Large call-to-action button with enhanced styling
      'px-8 py-4 rounded-full font-semibold bg-black text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 focus:ring-orange-500/50':
        variant === 'cta',
    },
    // Custom classes
    className
  );

  return (
    <button className={baseClasses} disabled={disabled || loading} {...rest}>
      <div className="relative z-10 flex items-center gap-2">
        {children}
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        )}
      </div>
      {/* Animated background overlay for primary and cta variants */}
      {(variant === 'primary' || variant === 'cta') && (
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
            variant === 'cta' ? 'rounded-full' : 'rounded-lg'
          }`}
        ></div>
      )}
    </button>
  );
}
