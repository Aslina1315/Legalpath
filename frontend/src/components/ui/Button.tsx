/**
 * Accessible Button component — Premium dark variant.
 * Supports variants, sizes, loading state, and keyboard navigation.
 */

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={clsx(
          // Base
          'inline-flex items-center justify-center gap-2',
          'rounded-xl font-semibold transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary',
          'motion-reduce:transition-none',
          // Disabled
          isDisabled && 'cursor-not-allowed opacity-50',
          // Variants
          variant === 'primary' && [
            'text-white shadow-glow-sm',
            'hover:shadow-glow-md hover:brightness-110 active:brightness-95',
            'focus-visible:ring-brand-500',
          ],
          variant === 'secondary' && [
            'text-neutral-100 border',
            'hover:brightness-110 active:brightness-95',
            'focus-visible:ring-brand-500',
          ],
          variant === 'outline' && [
            'border transition-colors',
            'hover:border-brand-500/40 active:border-brand-500/60',
            'focus-visible:ring-brand-500',
          ],
          variant === 'ghost' && [
            'bg-transparent',
            'hover:bg-white/5 active:bg-white/10',
            'focus-visible:ring-brand-500',
          ],
          variant === 'danger' && [
            'bg-trust-red text-white',
            'hover:opacity-90 active:opacity-80',
            'focus-visible:ring-trust-red',
          ],
          // Sizes
          size === 'sm' && 'px-4 py-2 text-sm',
          size === 'md' && 'px-5 py-2.5 text-sm',
          size === 'lg' && 'px-7 py-3.5 text-base',
          className
        )}
        style={{
          ...(variant === 'primary' ? {
            background: 'var(--gradient-brand)',
          } : {}),
          ...(variant === 'secondary' ? {
            background: 'rgba(99, 102, 241, 0.1)',
            borderColor: 'rgba(99, 102, 241, 0.2)',
          } : {}),
          ...(variant === 'outline' ? {
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            borderColor: 'var(--color-border)',
          } : {}),
          ...(variant === 'ghost' ? {
            color: 'var(--color-text-secondary)',
          } : {}),
        }}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingDots />
            <span>{loadingText ?? 'Loading\u2026'}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

function LoadingDots() {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-current animate-pulse-soft"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
