/**
 * EvidenceGapsCard — Renders AI Module 07 Evidence Gap Detector.
 * Premium dark glass card variant.
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
      className="glass-card-static animate-fade-in overflow-hidden"
      aria-labelledby="evidence-gaps-heading"
    >
      <div
        className="px-5 py-4 flex items-center justify-between flex-wrap gap-2"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div>
          <span
            className="text-[10px] font-mono font-semibold uppercase tracking-widest"
            style={{ color: '#a78bfa' }}
          >
            Module 07 · Evidentiary Audit
          </span>
          <h3
            id="evidence-gaps-heading"
            className="text-sm font-bold mt-0.5"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Evidence Gap Detection
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Completeness:</span>
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-16 rounded-full overflow-hidden"
              style={{ background: 'rgba(99, 102, 241, 0.1)' }}
            >
              <div
                className={`h-full rounded-full transition-all ${
                  completenessPct >= 75 ? 'bg-trust-green' : completenessPct >= 45 ? 'bg-trust-amber' : 'bg-trust-red'
                }`}
                style={{ width: `${completenessPct}%` }}
                aria-hidden="true"
              />
            </div>
            <span className="text-xs font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>{completenessPct}%</span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <p
          className="text-sm leading-relaxed rounded-xl p-4"
          style={{
            background: 'rgba(99, 102, 241, 0.04)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          {gapResult.summary}
        </p>

        {gapResult.gaps.length > 0 ? (
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Identified Gaps ({gapResult.gaps.length})
            </h4>
            <div className="space-y-2">
              {gapResult.gaps.map((gap) => (
                <div
                  key={gap.id}
                  className="glass-card p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
                      <span className="text-trust-red font-bold" aria-hidden="true">!</span>
                      {gap.description}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                      style={{
                        background: gap.importance === 'HIGH'
                          ? 'rgba(248, 113, 113, 0.1)'
                          : gap.importance === 'MEDIUM'
                          ? 'rgba(251, 191, 36, 0.1)'
                          : 'rgba(99, 102, 241, 0.06)',
                        color: gap.importance === 'HIGH'
                          ? '#f87171'
                          : gap.importance === 'MEDIUM'
                          ? '#fbbf24'
                          : 'var(--color-text-muted)',
                        border: `1px solid ${
                          gap.importance === 'HIGH'
                            ? 'rgba(248, 113, 113, 0.2)'
                            : gap.importance === 'MEDIUM'
                            ? 'rgba(251, 191, 36, 0.2)'
                            : 'var(--color-border)'
                        }`,
                      }}
                    >
                      {gap.importance} Priority
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Why it matters:</strong> {gap.whyItMatters}
                  </p>

                  <div
                    className="rounded-lg px-3 py-2 text-xs flex items-start gap-1.5"
                    style={{
                      background: 'rgba(99, 102, 241, 0.04)',
                      border: '1px solid var(--color-border-subtle)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <span style={{ color: '#a78bfa' }} className="font-bold shrink-0">↳</span>
                    <span>
                      <strong className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Recommended step:</strong>{' '}
                      {gap.suggestedClarification}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl p-3 text-xs"
            style={{
              background: 'rgba(52, 211, 153, 0.06)',
              border: '1px solid rgba(52, 211, 153, 0.15)',
              color: '#34d399',
            }}
          >
            ✓ No critical factual or document gaps detected for this stage.
          </div>
        )}
      </div>
    </article>
  );
}
