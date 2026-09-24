/**
 * EvidenceGapsCard — Renders AI Module 07 Evidence Gap Detector
 * highlighting missing documents, dates, and communications needed to substantiate claims.
 */

'use client';

import type { EvidenceGapResult } from '@/types/ai';

interface EvidenceGapsCardProps {
  gapResult: EvidenceGapResult;
}

export function EvidenceGapsCard({ gapResult }: EvidenceGapsCardProps) {
  const completenessPct = Math.round(gapResult.overallCompleteness * 100);

  return (
    <article
      className="rounded-xl border border-neutral-200 bg-white shadow-sm animate-fade-in overflow-hidden"
      aria-labelledby="evidence-gaps-heading"
    >
      <div className="border-b border-neutral-100 bg-neutral-50/50 px-5 py-3.5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
            Module 07 · Evidentiary Audit
          </span>
          <h3 id="evidence-gaps-heading" className="text-sm font-semibold text-neutral-800">
            Evidence Gap Detection
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 font-medium">Completeness:</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-16 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  completenessPct >= 75 ? 'bg-emerald-500' : completenessPct >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${completenessPct}%` }}
                aria-hidden="true"
              />
            </div>
            <span className="text-xs font-mono font-semibold text-neutral-700">{completenessPct}%</span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Overview summary */}
        <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-lg p-3 border border-neutral-100">
          {gapResult.summary}
        </p>

        {/* Gaps List */}
        {gapResult.gaps.length > 0 ? (
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Identified Evidentiary Gaps ({gapResult.gaps.length})
            </h4>
            <div className="space-y-2">
              {gapResult.gaps.map((gap) => (
                <div
                  key={gap.id}
                  className="rounded-lg border border-neutral-200 bg-white p-3.5 transition-shadow hover:shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                      <span className="text-rose-500 font-bold" aria-hidden="true">!</span>
                      {gap.description}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        gap.importance === 'HIGH'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : gap.importance === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {gap.importance} Priority
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed">
                    <strong className="text-neutral-700">Why it matters:</strong> {gap.whyItMatters}
                  </p>

                  <div className="rounded bg-neutral-50 px-2.5 py-1.5 border border-neutral-100 text-xs text-neutral-700 flex items-start gap-1.5">
                    <span className="text-brand-500 font-bold shrink-0">↳</span>
                    <span>
                      <strong className="font-medium text-neutral-900">Recommended step:</strong>{' '}
                      {gap.suggestedClarification}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
            ✓ No critical factual or document gaps detected for this stage of dispute.
          </div>
        )}
      </div>
    </article>
  );
}
