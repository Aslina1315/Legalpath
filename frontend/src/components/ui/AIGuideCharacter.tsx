/**
 * AIGuideCharacter — Elegant, professional visual AI guide.
 *
 * State-driven visual identity that reflects real pipeline operations.
 * NOT a cartoon. Designed as an ethereal, calm geometric intelligence beacon.
 * Respects prefers-reduced-motion.
 */

'use client';

import { clsx } from 'clsx';
import type { AIProcessingState } from '@/types/ai';
import { AI_STATE_METADATA } from '@/types/ai';

interface AIGuideCharacterProps {
  state: AIProcessingState;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AIGuideCharacter({
  state,
  className,
  size = 'md',
}: AIGuideCharacterProps) {
  const meta = AI_STATE_METADATA[state];

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }[size];

  // Dynamic visual aura colors based on real operation
  const stateColor = (() => {
    switch (state) {
      case 'UNDERSTANDING':
      case 'STRUCTURING':
        return {
          glow: 'rgba(79, 98, 245, 0.25)',
          stroke: '#4f62f5',
          accent: '#7488ff',
          pulseSpeed: 'animate-[pulse_3s_ease-in-out_infinite]',
        };
      case 'RESEARCHING':
        return {
          glow: 'rgba(56, 189, 248, 0.25)',
          stroke: '#0284c7',
          accent: '#38bdf8',
          pulseSpeed: 'animate-[spin_6s_linear_infinite]',
        };
      case 'ANALYZING':
        return {
          glow: 'rgba(217, 119, 6, 0.2)',
          stroke: '#d97706',
          accent: '#f59e0b',
          pulseSpeed: 'animate-[pulse_2.2s_ease-in-out_infinite]',
        };
      case 'COMPARING':
      case 'VERIFYING':
        return {
          glow: 'rgba(16, 185, 129, 0.25)',
          stroke: '#059669',
          accent: '#34d399',
          pulseSpeed: 'animate-[pulse_2.5s_ease-in-out_infinite]',
        };
      case 'PLANNING':
        return {
          glow: 'rgba(99, 102, 241, 0.25)',
          stroke: '#4f46e5',
          accent: '#818cf8',
          pulseSpeed: 'animate-[pulse_2s_ease-in-out_infinite]',
        };
      case 'READY':
        return {
          glow: 'rgba(22, 163, 74, 0.2)',
          stroke: '#16a34a',
          accent: '#22c55e',
          pulseSpeed: '',
        };
      case 'ERROR':
        return {
          glow: 'rgba(220, 38, 38, 0.2)',
          stroke: '#dc2626',
          accent: '#ef4444',
          pulseSpeed: '',
        };
      case 'IDLE':
      default:
        return {
          glow: 'rgba(160, 160, 160, 0.15)',
          stroke: '#94a3b8',
          accent: '#cbd5e1',
          pulseSpeed: '',
        };
    }
  })();

  return (
    <div
      className={clsx('relative flex items-center justify-center select-none', className)}
      aria-hidden="true"
      title={meta.label}
    >
      {/* Ambient ambient glow aura */}
      <div
        className={clsx(
          'absolute rounded-full transition-all duration-700 pointer-events-none',
          'motion-reduce:transition-none motion-reduce:animate-none',
          state !== 'IDLE' && stateColor.pulseSpeed
        )}
        style={{
          width: size === 'lg' ? '120px' : size === 'md' ? '80px' : '52px',
          height: size === 'lg' ? '120px' : size === 'md' ? '80px' : '52px',
          background: `radial-gradient(circle, ${stateColor.glow} 0%, rgba(255,255,255,0) 70%)`,
        }}
      />

      {/* SVG Geometric Beacon */}
      <svg
        className={clsx(sizeClasses, 'transition-transform duration-500 motion-reduce:transition-none')}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer orbital boundary ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke={stateColor.stroke}
          strokeWidth="1.5"
          strokeOpacity="0.4"
          strokeDasharray={state === 'RESEARCHING' ? '6 4' : 'none'}
          className={clsx(
            state === 'RESEARCHING' && 'animate-[spin_10s_linear_infinite] origin-center',
            'motion-reduce:animate-none'
          )}
        />

        {/* Inner geometric focal diamond / shield */}
        <g
          className={clsx(
            state !== 'IDLE' && state !== 'READY' && state !== 'ERROR' && 'animate-pulse-soft origin-center',
            'motion-reduce:animate-none'
          )}
        >
          {state === 'VERIFYING' || state === 'READY' ? (
            /* Shield shape for verification & trust */
            <path
              d="M50 20 L74 32 V52 C74 66 63 76 50 80 C37 76 26 66 26 52 V32 Z"
              stroke={stateColor.stroke}
              strokeWidth="2"
              fill={stateColor.glow}
              strokeLinejoin="round"
            />
          ) : (
            /* Concentric focal rings */
            <>
              <circle
                cx="50"
                cy="50"
                r="28"
                stroke={stateColor.stroke}
                strokeWidth="1.75"
                fill={stateColor.glow}
              />
              <circle
                cx="50"
                cy="50"
                r="16"
                stroke={stateColor.accent}
                strokeWidth="1.25"
                strokeOpacity="0.8"
              />
            </>
          )}
        </g>

        {/* Core luminous pupil / nexus */}
        <circle
          cx="50"
          cy="50"
          r={state === 'READY' ? '6' : '4.5'}
          fill={stateColor.stroke}
          className="transition-all duration-300"
        />

        {/* State specific iconography overlay */}
        {state === 'READY' && (
          <path
            d="M44 50 L48 54 L56 46"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
}
