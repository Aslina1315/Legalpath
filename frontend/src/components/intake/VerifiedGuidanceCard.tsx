/**
 * VerifiedGuidanceCard — Trust Layer & Source Verification (AI Module 09).
 *
 * Core Principles:
 * - Designed as an authentic Trust Layer.
 * - Shows clear epistemic statuses:
 *     ✓ Supported by source
 *     ⚠ Partially supported
 *     ? Needs clarification
 * - Allows the user to expand each claim to inspect the supporting source,
 *   jurisdiction consistency, and factual alignment.
 * - Does NOT use a single meaningless numerical score as the primary signal.
 */

'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import type { ResponseVerificationResult, ClaimVerification, ClaimVerificationStatus } from '@/types/ai';

interface VerifiedGuidanceCardProps {
  verification: ResponseVerificationResult;
}

export const VerifiedGuidanceCard: React.FC<VerifiedGuidanceCardProps> = ({ verification }) => {
  const [expandedClaimIdx, setExpandedClaimIdx] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNCERTAIN'>('ALL');

  const supportedCount = verification.claims.filter((c) => c.status === 'SUPPORTED').length;
  const partialCount = verification.claims.filter((c) => c.status === 'PARTIALLY_SUPPORTED').length;
  const uncertainCount = verification.claims.filter(
    (c) => c.status === 'UNCERTAIN' || c.status === 'UNSUPPORTED'
  ).length;

  const filteredClaims = verification.claims.filter((c) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'UNCERTAIN') return c.status === 'UNCERTAIN' || c.status === 'UNSUPPORTED';
    return c.status === statusFilter;
  });

  const getStatusBadge = (status: ClaimVerificationStatus) => {
    switch (status) {
      case 'SUPPORTED':
        return {
          icon: '✓',
          label: 'Supported by source',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
          dotClass: 'bg-emerald-400',
        };
      case 'PARTIALLY_SUPPORTED':
        return {
          icon: '⚠',
          label: 'Partially supported',
          badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
          dotClass: 'bg-amber-400',
        };
      case 'UNCERTAIN':
      case 'UNSUPPORTED':
      default:
        return {
          icon: '?',
          label: 'Needs clarification',
          badgeClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25',
          dotClass: 'bg-indigo-400',
        };
    }
  };

  const toggleExpand = (idx: number) => {
    setExpandedClaimIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <article
      className="glass-card-static animate-fade-in overflow-hidden"
      aria-labelledby="verified-guidance-heading"
    >
      {/* Header */}
      <div
        className="px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center font-mono text-xs font-bold text-cyan-400 shrink-0">
            09
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                id="verified-guidance-heading"
                className="text-sm font-bold text-white tracking-tight"
              >
                Verified Information &amp; Trust Layer
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                SOURCE-GROUNDED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Every factual assertion checked against primary authorities and your evidence
            </p>
          </div>
        </div>

        {/* Audit Status Strip (Not a single fake trust score) */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
            <span>✓</span> {supportedCount} supported
          </span>
          {partialCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300">
              <span>⚠</span> {partialCount} partial
            </span>
          )}
          {uncertainCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-300">
              <span>?</span> {uncertainCount} needs clarification
            </span>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Verified Situation Summary */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-950/80 space-y-1.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
            Verified Synthesis
          </span>
          <p className="text-sm text-slate-200 leading-relaxed">
            {verification.verifiedSummary}
          </p>
        </div>

        {/* Flagged Unsupported Claims Notice if any */}
        {verification.unsupportedClaimsFlagged && verification.unsupportedClaimsFlagged.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
              <span>⚠</span> Claims Requiring Corroboration
            </div>
            <p className="text-xs text-slate-300">
              The following assertions were flagged because primary statutory citations could not be established without your confirmation:
            </p>
            <ul className="space-y-1 text-xs text-amber-200/80">
              {verification.unsupportedClaimsFlagged.map((claim, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-mono">•</span>
                  <span>{claim}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Claim-by-Claim Verification Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Claim-by-Claim Verification ({verification.claims.length})
            </h4>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={clsx(
                  'px-2.5 py-1 rounded-lg transition-colors',
                  statusFilter === 'ALL'
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                )}
              >
                All ({verification.claims.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('SUPPORTED')}
                className={clsx(
                  'px-2.5 py-1 rounded-lg transition-colors',
                  statusFilter === 'SUPPORTED'
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                )}
              >
                Supported ({supportedCount})
              </button>
              {partialCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('PARTIALLY_SUPPORTED')}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg transition-colors',
                    statusFilter === 'PARTIALLY_SUPPORTED'
                      ? 'bg-amber-600 text-white font-medium'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  )}
                >
                  Partial ({partialCount})
                </button>
              )}
              {uncertainCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('UNCERTAIN')}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg transition-colors',
                    statusFilter === 'UNCERTAIN'
                      ? 'bg-indigo-700 text-white font-medium'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  )}
                >
                  Clarification ({uncertainCount})
                </button>
              )}
            </div>
          </div>

          {/* Interactive Claims List with Expandable Source Grounding */}
          <div className="space-y-2.5">
            {filteredClaims.map((claim, idx) => {
              const badge = getStatusBadge(claim.status);
              const isExpanded = expandedClaimIdx === idx;

              return (
                <div
                  key={idx}
                  className={clsx(
                    'rounded-xl border transition-all duration-200 overflow-hidden',
                    isExpanded
                      ? 'bg-slate-900/80 border-indigo-500/40 shadow-md'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                  )}
                >
                  {/* Clickable Claim Row */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(idx)}
                    className="w-full text-left p-4 flex items-start justify-between gap-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                    aria-expanded={isExpanded}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border',
                            badge.badgeClass
                          )}
                        >
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>

                        {claim.supportingSources && claim.supportingSources.length > 0 && (
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/30">
                            {claim.supportingSources.length} source{claim.supportingSources.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-medium text-slate-100 pt-1">
                        {claim.claim}
                      </p>
                    </div>

                    <span className="text-slate-500 text-xs font-mono shrink-0 pt-1">
                      {isExpanded ? '▲ Hide' : '▼ Inspect source'}
                    </span>
                  </button>

                  {/* Expandable Supporting Source & Audit Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-800/80 text-xs animate-fade-in">
                      {/* Grounding Reasoning */}
                      <div className="space-y-1 pt-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                          Legal &amp; Evidentiary Reasoning
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          {claim.reasoning}
                        </p>
                      </div>

                      {/* Supporting Authorities */}
                      {claim.supportingSources && claim.supportingSources.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold block">
                            Grounding Authorities / Citations
                          </span>
                          <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                            {claim.supportingSources.map((src, i) => (
                              <li key={i} className="flex items-center gap-2 p-2 rounded-lg bg-cyan-950/20 border border-cyan-800/25">
                                <span className="text-cyan-400">§</span>
                                <span className="truncate">{src}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Alignment Indicators */}
                      <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800/60">
                        <span className="flex items-center gap-1.5">
                          <span className={claim.caseFactAlignment ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                            {claim.caseFactAlignment ? '✓' : '!'}
                          </span>
                          Case Fact Alignment: {claim.caseFactAlignment ? 'Confirmed' : 'Pending'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className={claim.jurisdictionConsistency ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                            {claim.jurisdictionConsistency ? '✓' : '!'}
                          </span>
                          Jurisdiction Consistency: {claim.jurisdictionConsistency ? 'Valid' : 'Unconfirmed'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Epistemic Integrity Notice */}
        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-indigo-950/60 text-[11px] text-slate-400 leading-relaxed font-mono">
          <strong className="text-slate-300">Trust Standard:</strong>{' '}
          {verification.disclaimer ||
            'Each claim is evaluated against retrieved primary statutes and your documented statements. Claims lacking authoritative grounding are flagged.'}
        </div>
      </div>
    </article>
  );
};
