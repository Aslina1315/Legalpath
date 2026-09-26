/**
 * AI State Indicator — Premium dark variant.
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

  const isActive = !meta.isTerminal && !meta.isError;
  const isReady = meta.state === 'READY';
  const isError = meta.isError;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`AI status: ${meta.label}`}
      className={clsx(
        'flex items-center gap-3 rounded-xl px-4 py-3',
        'text-sm font-medium',
        'transition-all duration-300 motion-reduce:transition-none',
        className
      )}
      style={{
        background: isError
          ? 'rgba(248, 113, 113, 0.06)'
          : isReady
          ? 'rgba(52, 211, 153, 0.06)'
          : 'rgba(99, 102, 241, 0.06)',
        color: isError
          ? '#f87171'
          : isReady
          ? '#34d399'
          : '#a78bfa',
        border: `1px solid ${
          isError
            ? 'rgba(248, 113, 113, 0.15)'
            : isReady
            ? 'rgba(52, 211, 153, 0.15)'
            : 'rgba(99, 102, 241, 0.15)'
        }`,
      }}
    >
      {/* State dot */}
      <span aria-hidden="true" className="relative flex-shrink-0">
        {isActive && (
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-current opacity-50"></span>
        )}
        <span
          className={clsx(
            'relative inline-flex h-2 w-2 rounded-full bg-current',
            isActive && 'animate-pulse-soft'
          )}
        />
      </span>

      <span>{meta.label}</span>
    </div>
  );
}
