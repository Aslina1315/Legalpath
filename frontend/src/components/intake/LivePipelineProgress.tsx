/**
 * LivePipelineProgress — Real-time AI pipeline stage tracker.
 *
 * Shows the live stages as they actually complete during intake and continuous processing:
 *   ✓ Situation understood
 *   ✓ Key facts organized
 *   ◉ Researching current sources...
 *   ○ Evidence review
 *   ○ Verification
 *   ○ Action path
 *
 * Connected strictly to actual AI pipeline state.
 */

'use client';

import React from 'react';
import { clsx } from 'clsx';
import type { AIProcessingState } from '@/types/ai';

interface LivePipelineProgressProps {
  state: AIProcessingState;
  className?: string;
}

interface StepItem {
  id: string;
  label: string;
  isActive: boolean;
  isDone: boolean;
}

export const LivePipelineProgress: React.FC<LivePipelineProgressProps> = ({
  state,
  className,
}) => {
  const steps: StepItem[] = [
    {
      id: 'understanding',
      label: 'Situation understood',
      isActive: state === 'UNDERSTANDING',
      isDone: [
        'STRUCTURING',
        'RESEARCHING',
        'ANALYZING',
        'COMPARING',
        'VERIFYING',
        'PLANNING',
        'READY',
      ].includes(state),
    },
    {
      id: 'structuring',
      label: 'Key facts organized',
      isActive: state === 'STRUCTURING',
      isDone: [
        'RESEARCHING',
        'ANALYZING',
        'COMPARING',
        'VERIFYING',
        'PLANNING',
        'READY',
      ].includes(state),
    },
    {
      id: 'researching',
      label:
        state === 'RESEARCHING'
          ? 'Researching current sources...'
          : 'Authoritative sources researched',
      isActive: state === 'RESEARCHING',
      isDone: [
        'ANALYZING',
        'COMPARING',
        'VERIFYING',
        'PLANNING',
        'READY',
      ].includes(state),
    },
    {
      id: 'evidence',
      label:
        state === 'ANALYZING' || state === 'COMPARING'
          ? 'Reviewing evidence & discrepancies...'
          : 'Evidence & discrepancy audit',
      isActive: state === 'ANALYZING' || state === 'COMPARING',
      isDone: ['VERIFYING', 'PLANNING', 'READY'].includes(state),
    },
    {
      id: 'verification',
      label:
        state === 'VERIFYING'
          ? 'Verifying claims against sources...'
          : 'Verification & trust layer',
      isActive: state === 'VERIFYING',
      isDone: ['PLANNING', 'READY'].includes(state),
    },
    {
      id: 'action',
      label:
        state === 'PLANNING'
          ? 'Formulating action path...'
          : 'Action path ready',
      isActive: state === 'PLANNING',
      isDone: state === 'READY',
    },
  ];

  const isWorking =
    state !== 'IDLE' && state !== 'READY' && state !== 'ERROR';

  return (
    <div
      className={clsx(
        'rounded-2xl p-4 sm:p-5 bg-[#0f1220]/80 border border-indigo-900/30 backdrop-blur-xl',
        className
      )}
      role="region"
      aria-label="Real-time AI pipeline execution"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-indigo-950/60">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-indigo-400">
            Live AI Pipeline
          </span>
          {isWorking && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
              </span>
              Processing Live
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          State: {state}
        </span>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {steps.map((step) => {
          return (
            <li
              key={step.id}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-300',
                step.isActive
                  ? 'bg-indigo-950/60 border border-indigo-500/40 text-white font-medium shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  : step.isDone
                  ? 'bg-slate-900/40 border border-emerald-500/20 text-slate-300'
                  : 'bg-slate-950/30 border border-slate-900/50 text-slate-500'
              )}
            >
              <span
                className={clsx(
                  'shrink-0 font-mono text-xs flex items-center justify-center w-4 h-4',
                  step.isActive
                    ? 'text-indigo-400 animate-pulse'
                    : step.isDone
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-600'
                )}
                aria-hidden="true"
              >
                {step.isDone ? '✓' : step.isActive ? '◉' : '○'}
              </span>
              <span className="truncate">{step.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
