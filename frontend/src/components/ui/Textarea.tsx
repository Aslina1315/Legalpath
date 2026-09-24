/**
 * Accessible growing Textarea.
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
    const resolvedRef = (ref as React.RefObject<HTMLTextAreaElement> | null) ?? internalRef;

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
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className={clsx(
            'text-sm font-medium text-neutral-700',
            hideLabel && 'sr-only'
          )}
        >
          {label}
        </label>

        {hint && (
          <p id={hintId} className="text-sm text-neutral-500">
            {hint}
          </p>
        )}

        <textarea
          ref={resolvedRef}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : 'false'}
          rows={4}
          className={clsx(
            'w-full rounded-lg border px-4 py-3',
            'text-neutral-900 placeholder:text-neutral-400',
            'resize-none overflow-hidden',
            'text-base leading-relaxed',
            'transition-colors duration-150 motion-reduce:transition-none',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            !error && 'border-neutral-300 hover:border-neutral-400',
            error && 'border-trust-red focus:ring-trust-red',
            className
          )}
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
                'ml-auto text-xs',
                charCount > maxChars * 0.9 ? 'text-trust-amber' : 'text-neutral-400',
                charCount > maxChars && 'text-trust-red'
              )}
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
