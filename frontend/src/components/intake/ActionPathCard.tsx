/**
 * ActionPathCard — Beautiful Numbered Legal Action Roadmap (AI Module 10).
 *
 * Roadmap Structure:
 *   01 Gather the missing evidence
 *   02 Review the verified information
 *   03 Prepare your written request
 *   04 Follow the appropriate official process
 *
 * Each item includes:
 *   - why it matters
 *   - documents needed
 *   - interactive status toggle
 */

'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import type { ActionPathResult, ActionStep } from '@/types/ai';

interface ActionPathCardProps {
  actionPath: ActionPathResult;
}

export const ActionPathCard: React.FC<ActionPathCardProps> = ({ actionPath }) => {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const totalSteps = actionPath.nextSteps.length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500/10 text-red-400 border-red-500/25';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/25';
      case 'MEDIUM':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25';
      case 'LOW':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <article
      className="glass-card-static animate-fade-in overflow-hidden"
      aria-labelledby="action-path-heading"
    >
      {/* Header */}
      <div
        className="px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center font-mono text-xs font-bold text-emerald-400 shrink-0">
            10
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                id="action-path-heading"
                className="text-sm font-bold text-white tracking-tight"
              >
                Action Path &amp; Strategy Roadmap
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                ROADMAP
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Structured sequence grounded in verified legal authorities
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/60 border border-indigo-950/80">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Progress</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {completedCount} of {totalSteps} complete ({progressPercent}%)
            </span>
          </div>
          <div className="w-8 h-8 relative flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                stroke="rgba(99, 102, 241, 0.15)"
                strokeWidth="3.5"
                fill="none"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                stroke="#34d399"
                strokeWidth="3.5"
                strokeDasharray="94.2"
                strokeDashoffset={94.2 - (progressPercent / 100) * 94.2}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Current Situation Overview */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-indigo-950/80 space-y-1.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
            Current Situation Assessment
          </span>
          <p className="text-sm text-slate-200 leading-relaxed">
            {actionPath.currentSituation}
          </p>
        </div>

        {/* Beautiful Roadmap Steps */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Action Roadmap ({actionPath.nextSteps.length} Steps)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Click checkbox to mark completed
            </span>
          </div>

          <ol className="space-y-3 relative" aria-label="Action steps roadmap">
            {actionPath.nextSteps.map((step, idx) => {
              const isDone = Boolean(completedSteps[step.id]);
              const stepNumber = String(idx + 1).padStart(2, '0');
              const docsForStep = actionPath.documentsNeeded?.filter(
                (d) =>
                  step.description.toLowerCase().includes(d.documentName.toLowerCase().slice(0, 6)) ||
                  step.whyItMatters.toLowerCase().includes(d.documentName.toLowerCase().slice(0, 6))
              );

              return (
                <li
                  key={step.id}
                  className={clsx(
                    'rounded-2xl p-5 border transition-all duration-200 space-y-3 relative',
                    isDone
                      ? 'bg-slate-950/30 border-emerald-500/20 opacity-75'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-indigo-500/30 shadow-sm'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      {/* Big Elegant Step Number */}
                      <span
                        className={clsx(
                          'text-xl font-bold font-mono tracking-tight shrink-0 transition-colors',
                          isDone ? 'text-emerald-500/60' : 'text-indigo-400'
                        )}
                        aria-hidden="true"
                      >
                        {stepNumber}
                      </span>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={clsx(
                              'text-sm font-semibold transition-colors',
                              isDone ? 'line-through text-slate-400' : 'text-white'
                            )}
                          >
                            {step.title}
                          </h4>

                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border',
                              getPriorityStyle(step.priority)
                            )}
                          >
                            {step.priority}
                          </span>

                          {step.estimatedTimeframe && (
                            <span className="text-[11px] font-mono text-slate-400">
                              ⏱️ {step.estimatedTimeframe}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Completion Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleStep(step.id)}
                      className={clsx(
                        'shrink-0 w-7 h-7 rounded-xl border flex items-center justify-center transition-all',
                        isDone
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-transparent'
                      )}
                      aria-label={`Mark step ${stepNumber}: ${step.title} as ${isDone ? 'pending' : 'completed'}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Why it matters */}
                  <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-indigo-400 font-bold shrink-0 font-mono">Why:</span>
                    <span className="leading-relaxed">{step.whyItMatters}</span>
                  </div>

                  {/* Related Documents if found */}
                  {docsForStep && docsForStep.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                        Documents Needed:
                      </span>
                      {docsForStep.map((d, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-950/40 text-indigo-300 border border-indigo-800/40"
                        >
                          📄 {d.documentName}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Documents Needed Global Overview */}
        {actionPath.documentsNeeded && actionPath.documentsNeeded.length > 0 && (
          <div className="rounded-2xl p-4 bg-slate-900/40 border border-slate-800/80 space-y-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono block">
              Required Supporting Documentation
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {actionPath.documentsNeeded.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <strong className="text-white font-medium">{doc.documentName}</strong>
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded">
                        {doc.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{doc.purpose}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions to Resolve */}
        {actionPath.questionsToResolve && actionPath.questionsToResolve.length > 0 && (
          <div className="rounded-2xl p-4 bg-indigo-950/20 border border-indigo-900/30 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 font-mono block">
              Unresolved Questions to Address
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {actionPath.questionsToResolve.map((q, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-400 font-mono">?</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
};
