/**
 * InteractiveJourney — Living visual timeline of the continuous case journey.
 *
 * Mental Model:
 *   MY STORY → UNDERSTAND → RESEARCH → EVIDENCE → VERIFY → ACTION
 *
 * Connected directly to real AI states and case data.
 * Respects prefers-reduced-motion.
 */

'use client';

import React from 'react';
import { clsx } from 'clsx';
import type { AIProcessingState } from '@/types/ai';

export interface InteractiveJourneyProps {
  aiState: AIProcessingState;
  hasNarrative?: boolean;
  hasEvidence?: boolean;
  hasContradictions?: boolean;
  hasVerification?: boolean;
  hasActionPath?: boolean;
  onStageSelect?: (stageId: string) => void;
  className?: string;
}

interface JourneyStage {
  id: string;
  number: string;
  name: string;
  shortDesc: string;
  icon: string;
  status: 'idle' | 'active' | 'completed';
}

export const InteractiveJourney: React.FC<InteractiveJourneyProps> = ({
  aiState,
  hasNarrative = false,
  hasEvidence = false,
  hasVerification = false,
  hasActionPath = false,
  onStageSelect,
  className,
}) => {
  // Determine live status of each stage strictly from real AI pipeline states
  const stages: JourneyStage[] = [
    {
      id: 'story',
      number: '01',
      name: 'YOUR STORY',
      shortDesc: 'Narrative & context',
      icon: '✍️',
      status: hasNarrative
        ? 'completed'
        : aiState === 'IDLE'
        ? 'active'
        : 'completed',
    },
    {
      id: 'understand',
      number: '02',
      name: 'UNDERSTAND',
      shortDesc: 'Facts, timeline & entities',
      icon: '🧠',
      status:
        aiState === 'UNDERSTANDING' || aiState === 'STRUCTURING'
          ? 'active'
          : [
              'RESEARCHING',
              'ANALYZING',
              'COMPARING',
              'VERIFYING',
              'PLANNING',
              'READY',
            ].includes(aiState)
          ? 'completed'
          : 'idle',
    },
    {
      id: 'research',
      number: '03',
      name: 'RESEARCH',
      shortDesc: 'Grounded authorities',
      icon: '⚖️',
      status:
        aiState === 'RESEARCHING'
          ? 'active'
          : [
              'ANALYZING',
              'COMPARING',
              'VERIFYING',
              'PLANNING',
              'READY',
            ].includes(aiState)
          ? 'completed'
          : 'idle',
    },
    {
      id: 'evidence',
      number: '04',
      name: 'EVIDENCE',
      shortDesc: 'Document cross-check',
      icon: '📄',
      status:
        aiState === 'ANALYZING'
          ? 'active'
          : hasEvidence ||
            ['COMPARING', 'VERIFYING', 'PLANNING', 'READY'].includes(aiState)
          ? 'completed'
          : 'idle',
    },
    {
      id: 'verify',
      number: '05',
      name: 'VERIFY',
      shortDesc: 'Grounding & claim audit',
      icon: '🛡️',
      status:
        aiState === 'COMPARING' || aiState === 'VERIFYING'
          ? 'active'
          : hasVerification || ['PLANNING', 'READY'].includes(aiState)
          ? 'completed'
          : 'idle',
    },
    {
      id: 'action',
      number: '06',
      name: 'ACTION',
      shortDesc: 'Roadmap & documents',
      icon: '🧭',
      status:
        aiState === 'PLANNING'
          ? 'active'
          : hasActionPath || aiState === 'READY'
          ? 'completed'
          : 'idle',
    },
  ];

  return (
    <nav
      className={clsx('w-full select-none', className)}
      aria-label="Continuous Case Journey"
    >
      <div className="relative rounded-2xl p-4 sm:p-5 bg-gradient-to-b from-[#121626]/85 to-[#0e111d]/90 border border-indigo-900/30 backdrop-blur-xl shadow-lg">
        {/* Subtle top indicator label */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={clsx(
                  'absolute inline-flex h-full w-full rounded-full opacity-75',
                  aiState !== 'IDLE' && aiState !== 'READY' && aiState !== 'ERROR'
                    ? 'animate-ping bg-brand-400'
                    : 'bg-emerald-400'
                )}
              />
              <span
                className={clsx(
                  'relative inline-flex rounded-full h-2 w-2',
                  aiState !== 'IDLE' && aiState !== 'READY' && aiState !== 'ERROR'
                    ? 'bg-brand-500'
                    : 'bg-emerald-500'
                )}
              />
            </span>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-400">
              One Continuous Journey
            </span>
          </div>

          <span className="text-[10px] font-mono text-indigo-300/80 hidden sm:inline-block">
            {aiState === 'IDLE'
              ? 'Stage 1 of 6 · Awaiting your story'
              : aiState === 'READY'
              ? 'Stage 6 of 6 · All stages active'
              : `Pipeline in progress · ${aiState}`}
          </span>
        </div>

        {/* Horizontal Journey Nodes Track */}
        <div className="relative">
          {/* Subtle curved background rail */}
          <div
            className="hidden md:block absolute top-[28px] left-[6%] right-[6%] h-[2px] pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, rgba(99,102,241,0.2) 0%, rgba(129,140,248,0.3) 50%, rgba(52,211,153,0.3) 100%)',
            }}
            aria-hidden="true"
          />

          <ol className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 relative z-10">
            {stages.map((stage) => {
              const isActive = stage.status === 'active';
              const isCompleted = stage.status === 'completed';

              return (
                <li key={stage.id} className="relative">
                  <button
                    type="button"
                    onClick={() => onStageSelect?.(stage.id)}
                    className={clsx(
                      'w-full text-left p-3 rounded-xl transition-all duration-300 flex flex-col justify-between group',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                      isActive
                        ? 'bg-indigo-950/50 border border-indigo-500/50 shadow-[0_0_24px_rgba(99,102,241,0.25)] translate-y-[-2px]'
                        : isCompleted
                        ? 'bg-slate-900/60 border border-emerald-500/25 hover:border-emerald-500/40'
                        : 'bg-slate-950/40 border border-slate-800/60 opacity-60 hover:opacity-85'
                    )}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">
                        {stage.number}
                      </span>

                      {/* Status indicator dot */}
                      <span
                        className={clsx(
                          'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px]',
                          isActive
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/50 animate-pulse'
                            : isCompleted
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800/60 text-slate-500'
                        )}
                      >
                        {isCompleted ? '✓' : isActive ? '◉' : '○'}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs" aria-hidden="true">
                          {stage.icon}
                        </span>
                        <h4
                          className={clsx(
                            'text-xs font-bold tracking-tight uppercase truncate',
                            isActive
                              ? 'text-white'
                              : isCompleted
                              ? 'text-slate-200'
                              : 'text-slate-400'
                          )}
                        >
                          {stage.name}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {stage.shortDesc}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </nav>
  );
};
