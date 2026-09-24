/**
 * Accessible Button component.
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
          'rounded-lg font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'motion-reduce:transition-none',
          // Disabled
          isDisabled && 'cursor-not-allowed opacity-60',
          // Variants
          variant === 'primary' && [
            'bg-brand-500 text-white',
            'hover:bg-brand-600 active:bg-brand-700',
            'focus-visible:ring-brand-500',
          ],
          variant === 'secondary' && [
            'bg-neutral-100 text-neutral-800 border border-neutral-200',
            'hover:bg-neutral-200 active:bg-neutral-300',
            'focus-visible:ring-brand-500',
          ],
          variant === 'outline' && [
            'bg-white text-neutral-700 border border-neutral-300',
            'hover:bg-neutral-50 hover:border-neutral-400 active:bg-neutral-100',
            'focus-visible:ring-brand-500',
          ],
          variant === 'ghost' && [
            'bg-transparent text-neutral-700',
            'hover:bg-neutral-100 active:bg-neutral-200',
            'focus-visible:ring-brand-500',
          ],
          variant === 'danger' && [
            'bg-trust-red text-white',
            'hover:opacity-90 active:opacity-80',
            'focus-visible:ring-trust-red',
          ],
          // Sizes
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2.5 text-sm',
          size === 'lg' && 'px-6 py-3 text-base',
          className
        )}
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
    <span className="flex gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-1 w-1 rounded-full bg-current animate-pulse-soft"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
