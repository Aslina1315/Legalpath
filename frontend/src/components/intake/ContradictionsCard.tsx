/**
 * ContradictionsCard — Renders AI Module 08 Contradiction Detector.
 *
 * Impartially surfaces factual clashes between narrative and documents,
 * providing the user an interactive form to clarify without silent assumptions.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ContradictionResult } from '@/types/ai';

interface ContradictionsCardProps {
  contradictionResult: ContradictionResult;
  onClarify?: (contradictionId: string, clarification: string) => void;
  onClarificationSubmit?: (contradictionId: string, clarification: string) => void;
  savedClarifications?: Record<string, string>;
  userClarifications?: Record<string, string>;
}

export function ContradictionsCard({
  contradictionResult,
  onClarify,
  onClarificationSubmit,
  savedClarifications = {},
  userClarifications = {},
}: ContradictionsCardProps) {
  const normalizedResult = contradictionResult;

  const [activeClarifications, setActiveClarifications] = useState<Record<string, string>>({
    ...savedClarifications,
    ...userClarifications,
  });

  function handleSaveClarification(id: string) {
    const text = activeClarifications[id];
    if (!text || !text.trim()) return;
    onClarify?.(id, text.trim());
    onClarificationSubmit?.(id, text.trim());
  }

  return (
    <article
      className="rounded-xl border border-neutral-200 bg-white shadow-sm animate-fade-in overflow-hidden"
      aria-labelledby="contradictions-heading"
    >
      <div className="border-b border-neutral-100 bg-neutral-50/50 px-5 py-3.5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
            Module 08 · Consistency Cross-Check
          </span>
          <h3 id="contradictions-heading" className="text-sm font-semibold text-neutral-800">
            Contradiction &amp; Discrepancy Detection
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            normalizedResult.hasContradictions
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {normalizedResult.hasContradictions
            ? `⚠️ ${normalizedResult.contradictions.length} Discrepancy Flagged`
            : '✓ Consistent'}
        </span>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-lg p-3 border border-neutral-100">
          {normalizedResult.summary}
        </p>

        {normalizedResult.hasContradictions ? (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Discrepancies Requiring Clarification
            </h4>
            {normalizedResult.contradictions.map((contra) => {
              const isResolved = Boolean(savedClarifications[contra.id]);

              return (
                <div
                  key={contra.id}
                  className={`rounded-lg border p-4 space-y-3 transition-colors ${
                    isResolved
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                      Field: {contra.field}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        contra.severity === 'HIGH'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {contra.severity} Severity
                    </span>
                  </div>

                  {/* Side-by-side comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-white p-2.5 border border-neutral-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                        Source A ({contra.sourceA})
                      </span>
                      <p className="font-medium text-neutral-800">{contra.valueA}</p>
                    </div>
                    <div className="rounded bg-white p-2.5 border border-neutral-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                        Source B ({contra.sourceB})
                      </span>
                      <p className="font-medium text-neutral-800">{contra.valueB}</p>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed">
                    <strong className="text-neutral-700">Explanation:</strong> {contra.explanation}
                  </p>

                  {/* Clarification prompt */}
                  <div className="pt-2 border-t border-neutral-200/60">
                    <label
                      htmlFor={`clarify-${contra.id}`}
                      className="text-xs font-semibold text-neutral-800 block mb-1"
                    >
                      💬 {contra.clarificationNeeded}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id={`clarify-${contra.id}`}
                        type="text"
                        placeholder="Provide your clarification..."
                        value={activeClarifications[contra.id] || ''}
                        onChange={(e) =>
                          setActiveClarifications((prev) => ({
                            ...prev,
                            [contra.id]: e.target.value,
                          }))
                        }
                        className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <Button
                        size="sm"
                        variant={isResolved ? 'outline' : 'primary'}
                        onClick={() => handleSaveClarification(contra.id)}
                        disabled={!activeClarifications[contra.id]?.trim()}
                      >
                        {isResolved ? 'Updated' : 'Submit'}
                      </Button>
                    </div>
                    {isResolved && (
                      <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                        <span>✓</span> Clarification recorded for case file.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
            ✓ Full internal consistency: narrative statements correspond with verified facts and documents.
          </div>
        )}
      </div>
    </article>
  );
}
