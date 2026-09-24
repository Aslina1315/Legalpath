'use client';

import React from 'react';
import type { ResponseVerificationResult, ClaimVerificationStatus } from '@/types/ai';

interface VerifiedGuidanceCardProps {
  verification: ResponseVerificationResult;
}

const STATUS_BADGES: Record<ClaimVerificationStatus, { label: string; bg: string; text: string; border: string }> = {
  SUPPORTED: {
    label: 'Verified Claim',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-400',
    border: 'border-emerald-800/60',
  },
  PARTIALLY_SUPPORTED: {
    label: 'Partially Verified',
    bg: 'bg-amber-950/40',
    text: 'text-amber-400',
    border: 'border-amber-800/60',
  },
  UNCERTAIN: {
    label: 'Uncertain / Inconclusive',
    bg: 'bg-purple-950/40',
    text: 'text-purple-400',
    border: 'border-purple-800/60',
  },
  UNSUPPORTED: {
    label: 'Not Established',
    bg: 'bg-rose-950/40',
    text: 'text-rose-400',
    border: 'border-rose-800/60',
  },
};

export const VerifiedGuidanceCard: React.FC<VerifiedGuidanceCardProps> = ({ verification }) => {
  const trustPercent = Math.round((verification.overallTrustScore ?? 0) * 100);

  const trustColor =
    trustPercent >= 75 ? 'text-emerald-400' : trustPercent >= 50 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div
      className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl transition-all"
      aria-labelledby="verified-guidance-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 font-mono text-sm">
            09
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 id="verified-guidance-heading" className="text-lg font-semibold text-white">
                Verified Information & Trust Layer
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-cyan-950/50 text-cyan-300 border border-cyan-800/50">
                AUDITED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Every claim checked against retrieved legal sources and case facts
            </p>
          </div>
        </div>

        {/* Trust Score Gauge */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Verification Index</div>
            <div className={`text-xl font-bold font-mono ${trustColor}`}>{trustPercent}%</div>
          </div>
          <div className="w-10 h-10 relative flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-700"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={trustPercent >= 75 ? 'text-emerald-400' : trustPercent >= 50 ? 'text-amber-400' : 'text-rose-400'}
                strokeDasharray={`${trustPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Verified Synthesis */}
      <div className="mt-5 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-2">
          Verified Situation Summary
        </h4>
        <p className="text-sm text-slate-200 leading-relaxed">{verification.verifiedSummary}</p>
      </div>

      {/* Flagged Unsupported Claims Alert */}
      {verification.unsupportedClaimsFlagged && verification.unsupportedClaimsFlagged.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-rose-950/30 border border-rose-800/50">
          <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs uppercase tracking-wider font-mono mb-2">
            <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Unsupported Claims Flagged & Filtered
          </div>
          <p className="text-xs text-rose-200/80 mb-2">
            The following claims lacked verifiable primary legal authority or direct evidence support and were not treated as established:
          </p>
          <ul className="space-y-1 text-xs text-rose-200">
            {verification.unsupportedClaimsFlagged.map((claim, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-400 font-mono">•</span>
                <span>{claim}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Claim Breakdown */}
      <div className="mt-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-3">
          Claim-by-Claim Verification Audit ({verification.claims.length})
        </h4>

        <div className="space-y-3">
          {verification.claims.map((claim, idx) => {
            const badge = STATUS_BADGES[claim.status] || STATUS_BADGES.UNCERTAIN;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-slate-100">{claim.claim}</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">{claim.reasoning}</p>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className={claim.caseFactAlignment ? 'text-emerald-400' : 'text-amber-400'}>
                      {claim.caseFactAlignment ? '✓' : '✗'}
                    </span>{' '}
                    Case-Fact Consistent
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1">
                    <span className={claim.jurisdictionConsistency ? 'text-emerald-400' : 'text-amber-400'}>
                      {claim.jurisdictionConsistency ? '✓' : '✗'}
                    </span>{' '}
                    Jurisdiction Consistent
                  </span>

                  {claim.supportingSources && claim.supportingSources.length > 0 && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">
                        Sources: {claim.supportingSources.join(', ')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Epistemic disclaimer */}
      <div className="mt-5 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
        <span className="text-slate-300 font-semibold font-mono">Trust Standard: </span>
        {verification.disclaimer ||
          'Verification evaluates grounding in retrieved primary authorities and internal consistency. This does not constitute legal counsel or an attorney-client relationship.'}
      </div>
    </div>
  );
};
