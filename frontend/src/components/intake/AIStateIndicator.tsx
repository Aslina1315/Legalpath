/**
 * AI State Indicator.
 * Visually reflects the current AI processing state.
 * Maps to REAL backend/AI state changes — no fake timers.
 */

'use client';

import { clsx } from 'clsx';
import { AI_STATE_METADATA } from '@/types/ai';
import type { AIProcessingState } from '@/types/ai';

interface AIStateIndicatorProps {
  state: AIProcessingState;
  className?: string;
}

export function AIStateIndicator({ state, className }: AIStateIndicatorProps) {
  const meta = AI_STATE_METADATA[state];

  if (state === 'IDLE') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`AI status: ${meta.label}`}
      className={clsx(
        'flex items-center gap-3 rounded-lg px-4 py-3',
        'text-sm font-medium',
        'transition-all duration-300 motion-reduce:transition-none',
        !meta.isError && 'bg-brand-50 text-brand-700',
        meta.isError && 'bg-red-50 text-trust-red',
        meta.state === 'READY' && 'bg-green-50 text-trust-green',
        className
      )}
    >
      {/* State dot */}
      <span
        aria-hidden="true"
        className={clsx(
          'flex-shrink-0 h-2 w-2 rounded-full',
          !meta.isTerminal && !meta.isError && 'animate-pulse-soft bg-brand-500',
          meta.state === 'READY' && 'bg-trust-green',
          meta.isError && 'bg-trust-red'
        )}
      />

      <span>{meta.label}</span>
    </div>
  );
}
