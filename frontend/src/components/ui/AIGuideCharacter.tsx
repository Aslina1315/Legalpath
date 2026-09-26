/**
 * AIGuideCharacter — Sophisticated Digital Legal Intelligence Companion.
 *
 * Upgraded visual design:
 * - NOT a cartoon, childish robot, emoji, or spinning orb.
 * - Refined abstract geometric intelligence beacon with concentric orbital rings,
 *   luminous aperture focal lens, state-specific precision alignments, and calm ambient aura.
 * - Communicates what the system is ACTUALLY doing in real time.
 * - Fully accessible with aria-live and prefers-reduced-motion compliance.
 */

'use client';

import React from 'react';
import { clsx } from 'clsx';
import type { AIProcessingState } from '@/types/ai';
import { AI_STATE_METADATA } from '@/types/ai';

export interface AIGuideCharacterProps {
  state: AIProcessingState;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatusMessage?: boolean;
}

export const AI_GUIDE_COMMUNICATIONS: Record<AIProcessingState, string> = {
  IDLE: 'Ready to listen. Tell us what happened in your own words.',
  UNDERSTANDING: 'Understanding your situation…',
  STRUCTURING: 'Organizing key facts, timeline, and parties…',
  RESEARCHING: 'Looking for current authoritative information…',
  ANALYZING: 'Reading the evidence you provided…',
  COMPARING: 'Checking for conflicting details…',
  VERIFYING: 'Verifying what can actually be supported…',
  PLANNING: 'Building your next-step path…',
  READY: 'Analysis complete. Verified insights and roadmap ready.',
  ERROR: 'Processing paused. An issue occurred.',
};

export function AIGuideCharacter({
  state,
  className,
  size = 'md',
  showStatusMessage = false,
}: AIGuideCharacterProps) {
  const meta = AI_STATE_METADATA[state] || AI_STATE_METADATA.IDLE;
  const companionMessage = AI_GUIDE_COMMUNICATIONS[state] || meta.description;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  }[size];

  const pixelSizes = {
    sm: 32,
    md: 56,
    lg: 84,
    xl: 120,
  };
  const px = pixelSizes[size] || 56;

  // Dynamic visual aura colors based on actual pipeline phase
  const stateColor = (() => {
    switch (state) {
      case 'UNDERSTANDING':
      case 'STRUCTURING':
        return {
          glow: 'rgba(99, 102, 241, 0.35)',
          outerRing: '#818cf8',
          innerCore: '#6366f1',
          accent: '#c7d2fe',
          pulseSpeed: 'animate-[pulse_2.8s_ease-in-out_infinite]',
          orbitDuration: 'animate-[spin_12s_linear_infinite]',
        };
      case 'RESEARCHING':
        return {
          glow: 'rgba(34, 211, 238, 0.35)',
          outerRing: '#22d3ee',
          innerCore: '#06b6d4',
          accent: '#a5f3fc',
          pulseSpeed: 'animate-[pulse_2.2s_ease-in-out_infinite]',
          orbitDuration: 'animate-[spin_8s_linear_infinite]',
        };
      case 'ANALYZING':
        return {
          glow: 'rgba(245, 158, 11, 0.3)',
          outerRing: '#f59e0b',
          innerCore: '#d97706',
          accent: '#fde68a',
          pulseSpeed: 'animate-[pulse_2s_ease-in-out_infinite]',
          orbitDuration: 'animate-[spin_10s_linear_infinite]',
        };
      case 'COMPARING':
      case 'VERIFYING':
        return {
          glow: 'rgba(52, 211, 153, 0.35)',
          outerRing: '#34d399',
          innerCore: '#10b981',
          accent: '#a7f3d0',
          pulseSpeed: 'animate-[pulse_2.4s_ease-in-out_infinite]',
          orbitDuration: 'animate-[spin_14s_linear_infinite]',
        };
      case 'PLANNING':
        return {
          glow: 'rgba(139, 92, 246, 0.35)',
          outerRing: '#a78bfa',
          innerCore: '#8b5cf6',
          accent: '#ddd6fe',
          pulseSpeed: 'animate-[pulse_2s_ease-in-out_infinite]',
          orbitDuration: 'animate-[spin_10s_linear_infinite]',
        };
      case 'READY':
        return {
          glow: 'rgba(52, 211, 153, 0.25)',
          outerRing: '#34d399',
          innerCore: '#10b981',
          accent: '#6ee7b7',
          pulseSpeed: '',
          orbitDuration: '',
        };
      case 'ERROR':
        return {
          glow: 'rgba(248, 113, 113, 0.25)',
          outerRing: '#f87171',
          innerCore: '#ef4444',
          accent: '#fca5a5',
          pulseSpeed: '',
          orbitDuration: '',
        };
      case 'IDLE':
      default:
        return {
          glow: 'rgba(129, 140, 248, 0.15)',
          outerRing: '#64748b',
          innerCore: '#818cf8',
          accent: '#94a3b8',
          pulseSpeed: 'animate-[pulse_4s_ease-in-out_infinite]',
          orbitDuration: '',
        };
    }
  })();

  const isWorking =
    state !== 'IDLE' && state !== 'READY' && state !== 'ERROR';

  return (
    <div
      className={clsx('flex items-center gap-3 select-none', className)}
      role="status"
      aria-label={`AI Guide State: ${meta.label}. ${companionMessage}`}
    >
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: `${px}px`, height: `${px}px`, minWidth: `${px}px`, minHeight: `${px}px` }}
      >
        {/* Soft Ambient Depth Aura */}
        <div
          className={clsx(
            'absolute rounded-full transition-all duration-700 pointer-events-none',
            'motion-reduce:transition-none motion-reduce:animate-none',
            isWorking && stateColor.pulseSpeed
          )}
          style={{
            width: `${px + 24}px`,
            height: `${px + 24}px`,
            background: `radial-gradient(circle, ${stateColor.glow} 0%, rgba(11, 13, 20, 0) 72%)`,
          }}
          aria-hidden="true"
        />

        {/* Sophisticated SVG Geometric Intelligence Beacon */}
        <svg
          className={clsx(
            sizeClasses,
            'relative transition-transform duration-500 motion-reduce:transition-none drop-shadow-sm shrink-0'
          )}
          width={px}
          height={px}
          style={{
            width: `${px}px`,
            height: `${px}px`,
            maxWidth: `${px}px`,
            maxHeight: `${px}px`,
            flexShrink: 0,
          }}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`grad-ring-${state}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={stateColor.outerRing} stopOpacity="0.8" />
              <stop offset="100%" stopColor={stateColor.innerCore} stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id={`grad-core-${state}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={stateColor.accent} />
              <stop offset="100%" stopColor={stateColor.innerCore} />
            </linearGradient>
          </defs>

          {/* Outer Orbital Precision Track */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke={`url(#grad-ring-${state})`}
            strokeWidth="1.25"
            strokeDasharray={
              state === 'RESEARCHING'
                ? '4 6'
                : state === 'UNDERSTANDING' || state === 'STRUCTURING'
                ? '8 4'
                : state === 'ANALYZING'
                ? '3 3'
                : 'none'
            }
            className={clsx(
              isWorking && stateColor.orbitDuration,
              'origin-center motion-reduce:animate-none'
            )}
          />

          {/* Subtle Outer Cardinal Ticks */}
          <line x1="50" y1="2" x2="50" y2="7" stroke={stateColor.outerRing} strokeWidth="1.5" strokeOpacity="0.7" />
          <line x1="50" y1="93" x2="50" y2="98" stroke={stateColor.outerRing} strokeWidth="1.5" strokeOpacity="0.7" />
          <line x1="2" y1="50" x2="7" y2="50" stroke={stateColor.outerRing} strokeWidth="1.5" strokeOpacity="0.7" />
          <line x1="93" y1="50" x2="98" y2="50" stroke={stateColor.outerRing} strokeWidth="1.5" strokeOpacity="0.7" />

          {/* Secondary Concentric Lens Ring */}
          <circle
            cx="50"
            cy="50"
            r="32"
            stroke={stateColor.innerCore}
            strokeWidth="1.5"
            strokeOpacity="0.55"
            fill={stateColor.glow}
            fillOpacity="0.18"
          />

          {/* State Specific Geometric Focal Iris */}
          {state === 'VERIFYING' || state === 'READY' ? (
            /* Trust Shield geometry */
            <path
              d="M50 26 L68 35 V52 C68 64 59 72 50 76 C41 72 32 64 32 52 V35 Z"
              stroke={stateColor.outerRing}
              strokeWidth="1.8"
              fill={stateColor.glow}
              strokeLinejoin="round"
            />
          ) : (
            /* Inner Geometric Aperture Octagon / Diamond */
            <g
              className={clsx(
                isWorking && 'animate-pulse origin-center',
                'motion-reduce:animate-none'
              )}
            >
              <rect
                x="37"
                y="37"
                width="26"
                height="26"
                rx="6"
                transform="rotate(45 50 50)"
                stroke={stateColor.accent}
                strokeWidth="1.25"
                strokeOpacity="0.75"
                fill={stateColor.glow}
                fillOpacity="0.3"
              />
              <circle
                cx="50"
                cy="50"
                r="18"
                stroke={stateColor.outerRing}
                strokeWidth="1"
                strokeDasharray="2 3"
              />
            </g>
          )}

          {/* Nexus Central Pupil */}
          <circle
            cx="50"
            cy="50"
            r={state === 'READY' ? '6.5' : isWorking ? '5' : '4'}
            fill={`url(#grad-core-${state})`}
            className="transition-all duration-300"
          />

          {/* Completion Checkmark when READY */}
          {state === 'READY' && (
            <path
              d="M44 50 L48 54 L56 46"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Cross marker when ERROR */}
          {state === 'ERROR' && (
            <path
              d="M45 45 L55 55 M55 45 L45 55"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>

      {/* Companion communication message if enabled */}
      {showStatusMessage && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-indigo-300">
              AI Guide
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              · {meta.label}
            </span>
          </div>
          <p className="text-xs text-slate-200 font-medium leading-relaxed truncate">
            {companionMessage}
          </p>
        </div>
      )}
    </div>
  );
}
