/**
 * ContradictionsCard — Calm, Human-Centered Discrepancy Resolution (AI Module 08).
 *
 * Design:
 * - "Your timeline has one detail that needs clarification."
 * - Side-by-side visual comparison: "Your statement" vs "Document" (e.g. June 10 vs June 18)
 * - "Which one is correct?" with calm, intuitive resolution choices.
 * - Calm, non-alarmist amber & slate palette — no frightening red walls.
 */

'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import type { ContradictionResult, ContradictionItem } from '@/types/ai';

interface ContradictionsCardProps {
  contradictionResult: ContradictionResult;
  onClarify?: (contradictionId: string, clarification: string) => void;
  onClarificationSubmit?: (contradictionId: string, clarification: string) => void;
  savedClarifications?: Record<string, string>;
  userClarifications?: Record<string, string>;
}

export const ContradictionsCard: React.FC<ContradictionsCardProps> = ({
  contradictionResult,
  onClarify,
  onClarificationSubmit,
  savedClarifications = {},
  userClarifications = {},
}) => {
  const [activeClarifications, setActiveClarifications] = useState<Record<string, string>>({
    ...savedClarifications,
    ...userClarifications,
  });

  const [customInputOpen, setCustomInputOpen] = useState<Record<string, boolean>>({});

  const handleSelectOption = (item: ContradictionItem, choiceValue: string, label: string) => {
    const text = `${label}: ${choiceValue}`;
    setActiveClarifications((prev) => ({ ...prev, [item.id]: text }));
    onClarify?.(item.id, text);
    onClarificationSubmit?.(item.id, text);
  };

  const handleCustomSubmit = (itemId: string) => {
    const val = activeClarifications[itemId]?.trim();
    if (!val) return;
    onClarify?.(itemId, val);
    onClarificationSubmit?.(itemId, val);
  };

  const hasContradictions = contradictionResult.hasContradictions && contradictionResult.contradictions.length > 0;

  return (
    <article
      className="glass-card-static animate-fade-in overflow-hidden"
      aria-labelledby="contradictions-heading"
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between flex-wrap gap-2"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div>
          <span
            className="text-[10px] font-mono font-semibold uppercase tracking-widest text-amber-400"
          >
            Module 08 · Clarity &amp; Consistency
          </span>
          <h3
            id="contradictions-heading"
            className="text-sm font-bold mt-0.5 text-white"
          >
            Discrepancy &amp; Timeline Verification
          </h3>
        </div>

        <span
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-mono font-semibold',
            hasContradictions
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
          )}
        >
          {hasContradictions
            ? `CLARIFICATION NEEDED (${contradictionResult.contradictions.length})`
            : '✓ FULLY CONSISTENT'}
        </span>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Calm Intro Banner */}
        <div className="rounded-xl p-4 bg-slate-900/50 border border-indigo-950/80 text-xs text-slate-300 leading-relaxed">
          {hasContradictions ? (
            <p>
              <strong className="text-white font-medium">Your timeline has details that benefit from clarification.</strong>{' '}
              {contradictionResult.summary ||
                'Resolving these differences early strengthens your legal grounding before official requests are prepared.'}
            </p>
          ) : (
            <p className="text-emerald-300 flex items-center gap-2">
              <span>✓</span>
              <span>All narrative facts, dates, and documents align with full internal consistency.</span>
            </p>
          )}
        </div>

        {/* Contradiction Cards */}
        {hasContradictions && (
          <div className="space-y-4">
            {contradictionResult.contradictions.map((contra) => {
              const currentResolution = activeClarifications[contra.id];
              const isResolved = Boolean(currentResolution);

              return (
                <div
                  key={contra.id}
                  className={clsx(
                    'rounded-2xl p-5 border transition-all duration-300 space-y-4',
                    isResolved
                      ? 'bg-slate-900/40 border-emerald-500/20'
                      : 'bg-slate-950/60 border-amber-500/20 hover:border-amber-500/35'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        {contra.field}
                      </h4>
                    </div>
                    {isResolved && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        RESOLVED
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {contra.explanation}
                  </p>

                  {/* Side-by-Side Comparison */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                      Comparing Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Statement / Source A */}
                      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                          Your statement ({contra.sourceA || 'Narrative'})
                        </span>
                        <p className="text-sm font-semibold text-white font-mono">
                          {contra.valueA}
                        </p>
                      </div>

                      {/* Document / Source B */}
                      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                        <span className="text-[10px] font-mono uppercase text-indigo-300 block font-semibold">
                          Document record ({contra.sourceB || 'Evidence'})
                        </span>
                        <p className="text-sm font-semibold text-indigo-100 font-mono">
                          {contra.valueB}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Which one is correct? Calm clarification picker */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                    <label
                      htmlFor={`clarify-input-${contra.id}`}
                      className="text-xs font-semibold text-slate-200 block"
                    >
                      Which one is correct?
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleSelectOption(contra, contra.valueA, `Statement (${contra.sourceA})`)
                        }
                        className={clsx(
                          'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all text-left flex items-center gap-1.5',
                          currentResolution?.includes(contra.valueA)
                            ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
                        )}
                      >
                        <span>✓</span>
                        <span>Use {contra.valueA}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleSelectOption(contra, contra.valueB, `Document (${contra.sourceB})`)
                        }
                        className={clsx(
                          'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all text-left flex items-center gap-1.5',
                          currentResolution?.includes(contra.valueB)
                            ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
                        )}
                      >
                        <span>✓</span>
                        <span>Use {contra.valueB}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCustomInputOpen((prev) => ({
                            ...prev,
                            [contra.id]: !prev[contra.id],
                          }))
                        }
                        className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
                      >
                        {customInputOpen[contra.id] ? 'Hide note' : 'Other clarification…'}
                      </button>
                    </div>

                    {/* Custom text clarification input */}
                    {customInputOpen[contra.id] && (
                      <div className="flex gap-2 pt-1 animate-fade-in">
                        <input
                          id={`clarify-input-${contra.id}`}
                          type="text"
                          placeholder={contra.clarificationNeeded || 'Describe the accurate details…'}
                          value={activeClarifications[contra.id] || ''}
                          onChange={(e) =>
                            setActiveClarifications((prev) => ({
                              ...prev,
                              [contra.id]: e.target.value,
                            }))
                          }
                          className="flex-1 rounded-xl px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleCustomSubmit(contra.id)}
                          disabled={!activeClarifications[contra.id]?.trim()}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    )}

                    {isResolved && (
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1">
                        <span>✓</span>
                        <span>Saved: {currentResolution}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
};
