'use client';

import React, { useState } from 'react';
import type { ActionPathResult, ActionStep } from '@/types/ai';

interface ActionPathCardProps {
  actionPath: ActionPathResult;
}

const PRIORITY_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  URGENT: {
    label: 'Urgent',
    bg: 'bg-rose-950/50',
    text: 'text-rose-400',
    border: 'border-rose-800/60',
  },
  HIGH: {
    label: 'High Priority',
    bg: 'bg-amber-950/50',
    text: 'text-amber-400',
    border: 'border-amber-800/60',
  },
  MEDIUM: {
    label: 'Standard',
    bg: 'bg-blue-950/50',
    text: 'text-blue-400',
    border: 'border-blue-800/60',
  },
  LOW: {
    label: 'Optional / Later',
    bg: 'bg-slate-800/50',
    text: 'text-slate-400',
    border: 'border-slate-700/60',
  },
};

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

  return (
    <div
      className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl transition-all"
      aria-labelledby="action-path-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400 font-mono text-sm">
            10
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 id="action-path-heading" className="text-lg font-semibold text-white">
                Action Path & Strategy
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-950/50 text-emerald-300 border border-emerald-800/50">
                ROADMAP
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Structured sequence of actions grounded in verified authorities
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Steps Completed</div>
            <div className="text-base font-bold font-mono text-emerald-400">
              {completedCount} / {totalSteps} ({progressPercent}%)
            </div>
          </div>
        </div>
      </div>

      {/* Current Situation Overview */}
      <div className="mt-5 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-2">
          Assessment of Current Situation
        </h4>
        <p className="text-sm text-slate-200 leading-relaxed">{actionPath.currentSituation}</p>
      </div>

      {/* Human Legal Help Advisory */}
      {actionPath.humanHelpRecommended && (
        <div className="mt-4 p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-900/40 text-amber-400 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-300">Human Legal Counsel Recommended</h4>
            <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
              {actionPath.humanHelpReasoning ||
                'Given the jurisdictional complexity or potential statutory deadlines in this matter, consulting a licensed attorney in your jurisdiction is strongly advised.'}
            </p>
          </div>
        </div>
      )}

      {/* Prioritized Action Steps */}
      <div className="mt-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-3">
          Recommended Action Sequence ({actionPath.nextSteps.length})
        </h4>

        <div className="space-y-3">
          {actionPath.nextSteps.map((step: ActionStep, idx: number) => {
            const isDone = !!completedSteps[step.id || `step-${idx}`];
            const badge = PRIORITY_BADGES[step.priority] || PRIORITY_BADGES.MEDIUM;

            return (
              <div
                key={step.id || idx}
                className={`p-4 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-slate-900/40 border-slate-800 opacity-60'
                    : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleStep(step.id || `step-${idx}`)}
                    className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'border-slate-600 hover:border-emerald-400 bg-slate-900'
                    }`}
                    aria-label={`Mark step ${step.title} as ${isDone ? 'incomplete' : 'completed'}`}
                  >
                    {isDone && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <span className={`text-sm font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {idx + 1}. {step.title}
                      </span>
                      <div className="flex items-center gap-2">
                        {step.estimatedTimeframe && (
                          <span className="text-[11px] font-mono text-slate-400">
                            ⏱ {step.estimatedTimeframe}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-2">{step.description}</p>

                    <div className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-emerald-400 font-semibold font-mono text-[11px]">Why this matters: </span>
                      {step.whyItMatters}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Documents to Gather Grid */}
      {actionPath.documentsNeeded && actionPath.documentsNeeded.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-3">
            Documents to Prepare & Preserve ({actionPath.documentsNeeded.length})
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actionPath.documentsNeeded.map((doc, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-200">{doc.documentName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      doc.priority === 'HIGH'
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {doc.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{doc.purpose}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escalation Pathways */}
      {actionPath.possibleEscalation && actionPath.possibleEscalation.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-3">
            Potential Escalation Pathways
          </h4>

          <div className="space-y-2">
            {actionPath.possibleEscalation.map((esc, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-800/20 border border-slate-800 text-xs">
                <div className="font-semibold text-slate-300 mb-0.5">{esc.route}</div>
                <div className="text-slate-400 mb-1">
                  <span className="font-mono text-slate-500">Trigger: </span>
                  {esc.condition}
                </div>
                <div className="text-slate-400 italic">{esc.advisoryNote}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions to Resolve */}
      {actionPath.questionsToResolve && actionPath.questionsToResolve.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-2">
            Key Questions to Clarify Before Taking Legal Steps
          </h4>
          <ul className="space-y-1 text-xs text-slate-300">
            {actionPath.questionsToResolve.map((q, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono">•</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
