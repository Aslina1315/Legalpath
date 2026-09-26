/**
 * Accessible growing Textarea — Premium dark variant.
 * Auto-resizes as content grows. Includes label, hint, error states.
 */

import { type TextareaHTMLAttributes, forwardRef, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  charCount?: number;
  maxChars?: number;
  hideLabel?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      hint,
      error,
      charCount,
      maxChars,
      hideLabel = false,
      id,
      className,
      onChange,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLTextAreaElement>) ?? internalRef;

    const inputId = id ?? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

    // Auto-resize
    useEffect(() => {
      const el = resolvedRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    });

    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={inputId}
          className={clsx(
            'text-sm font-semibold',
            hideLabel && 'sr-only'
          )}
          style={{ color: 'var(--color-text-primary)' }}
        >
          {label}
        </label>

        {hint && (
          <p id={hintId} className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {hint}
          </p>
        )}

        <textarea
          ref={resolvedRef}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : 'false'}
          rows={5}
          className={clsx(
            'w-full rounded-xl px-4 py-4',
            'resize-none overflow-hidden',
            'text-base leading-relaxed',
            'transition-all duration-200 motion-reduce:transition-none',
            'focus:outline-none',
            error && 'ring-2 ring-trust-red',
            className
          )}
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
          onChange={onChange}
          {...props}
        />

        <div className="flex items-center justify-between">
          {error && (
            <p id={errorId} role="alert" className="text-sm text-trust-red">
              {error}
            </p>
          )}
          {charCount !== undefined && maxChars !== undefined && (
            <p
              className={clsx(
                'ml-auto text-xs font-mono',
                charCount > maxChars * 0.9
                  ? 'text-trust-amber'
                  : '',
                charCount > maxChars && 'text-trust-red'
              )}
              style={{
                color: charCount > maxChars * 0.9 ? undefined : 'var(--color-text-muted)',
              }}
              aria-live="polite"
            >
              {charCount.toLocaleString()} / {maxChars.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
