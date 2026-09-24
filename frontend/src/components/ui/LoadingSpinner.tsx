/** Accessible loading spinner. Respects prefers-reduced-motion. */

import { clsx } from 'clsx';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  label = 'Loading',
  className,
}: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={clsx(
        'inline-block rounded-full border-2 border-current border-t-transparent',
        'animate-spin motion-reduce:animate-none',
        size === 'sm' && 'h-4 w-4',
        size === 'md' && 'h-6 w-6',
        size === 'lg' && 'h-8 w-8',
        className
      )}
    />
  );
}
