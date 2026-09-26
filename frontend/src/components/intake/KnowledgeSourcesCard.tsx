/**
 * KnowledgeSourcesCard — Renders AI Module 05 Live Knowledge Retrieval
 * with visible trust badges, official source links, and statutory rules.
 * Premium dark glass card variant.
 */

'use client';

import type { KnowledgeRetrievalResult } from '@/types/ai';

interface KnowledgeSourcesCardProps {
  knowledge?: KnowledgeRetrievalResult;
  retrieval?: KnowledgeRetrievalResult;
}

export function KnowledgeSourcesCard({ knowledge, retrieval }: KnowledgeSourcesCardProps) {
  const activeKnowledge = knowledge || retrieval;
  if (!activeKnowledge) return null;
  const isNoSource = activeKnowledge.status === 'no_verified_source';

  return (
    <article
      className="glass-card-static animate-fade-in overflow-hidden"
      aria-labelledby="knowledge-sources-heading"
    >
      <div
        className="px-5 py-4 flex items-center justify-between flex-wrap gap-2"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div>
          <span
            className="text-[10px] font-mono font-semibold uppercase tracking-widest"
            style={{ color: '#22d3ee' }}
          >
            Module 05 · Live Legal Retrieval
          </span>
          <h3
            id="knowledge-sources-heading"
            className="text-sm font-bold mt-0.5"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Authoritative Legal Rules &amp; Sources
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isNoSource ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-mono font-semibold"
              style={{
                background: 'rgba(156, 163, 196, 0.08)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
              }}
            >
              SOURCE NOT VERIFIED
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-mono font-semibold"
              style={{
                background: 'rgba(52, 211, 153, 0.08)',
                color: '#34d399',
                border: '1px solid rgba(52, 211, 153, 0.2)',
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-trust-green animate-pulse-soft" aria-hidden="true" />
              SOURCE FOUND
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Research Query Used */}
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span className="font-semibold uppercase tracking-wide">Search Query:</span>
          <code
            className="rounded-lg px-2.5 py-1 font-mono text-xs"
            style={{
              background: 'rgba(99, 102, 241, 0.06)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            {activeKnowledge.queryUsed}
          </code>
        </div>

        {/* If no verified source */}
        {isNoSource ? (
          <div
            className="rounded-xl p-4 text-sm"
            style={{
              background: 'rgba(156, 163, 196, 0.04)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <p className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>Notice: Specific authoritative source not verified.</p>
            <p className="text-xs leading-relaxed">
              Google Search grounding did not identify an undisputed statutory citation for this specific edge case.
              The platform refrains from fabricating legal citations.
            </p>
          </div>
        ) : (
          <>
            {/* Key Findings */}
            {activeKnowledge.keyFindings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  Key Legal Findings
                </h4>
                <ul className="space-y-1.5">
                  {activeKnowledge.keyFindings.map((finding, i) => (
                    <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <span className="text-brand-400 font-bold shrink-0">✓</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Applicable Rules */}
            {activeKnowledge.applicableRules.length > 0 && (
              <div
                className="rounded-xl p-4 space-y-2"
                style={{
                  background: 'rgba(34, 211, 238, 0.04)',
                  border: '1px solid rgba(34, 211, 238, 0.12)',
                }}
              >
                <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#22d3ee' }}>
                  Applicable Statutory Protections &amp; Requirements
                </h4>
                <ul className="space-y-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {activeKnowledge.applicableRules.map((rule, i) => (
                    <li key={i} className="flex gap-2">
                      <span style={{ color: '#22d3ee' }} className="font-bold">§</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verified Sources List */}
            {activeKnowledge.sources.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  Referenced Citations ({activeKnowledge.sources.length})
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {activeKnowledge.sources.map((source, i) => (
                    <div
                      key={i}
                      className="glass-card p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider rounded px-2 py-0.5"
                            style={{
                              background: 'rgba(99, 102, 241, 0.1)',
                              color: '#a78bfa',
                            }}
                          >
                            {source.sourceType}
                          </span>
                          {source.publisher && (
                            <span className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                              {source.publisher}
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
                          {source.title}
                        </h5>
                        <p className="mt-1 text-xs line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                          {source.summary}
                        </p>
                      </div>
                      <div
                        className="mt-2.5 pt-2 flex items-center justify-between"
                        style={{ borderTop: '1px solid var(--color-border-subtle)' }}
                      >
                        <span className="text-[10px] font-medium flex items-center gap-1 text-trust-green">
                          <span>✓</span> Verified Grounding
                        </span>
                        {source.url && source.url.startsWith('http') && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium inline-flex items-center gap-1 focus-visible:ring-1 rounded"
                            style={{ color: '#a78bfa' }}
                            aria-label={`Open source: ${source.title}`}
                          >
                            Open Source ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Limitations */}
            {activeKnowledge.limitations.length > 0 && (
              <div
                className="text-xs rounded-xl p-3"
                style={{
                  background: 'rgba(99, 102, 241, 0.03)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <strong style={{ color: 'var(--color-text-secondary)' }}>Procedural Limitations:</strong>{' '}
                {activeKnowledge.limitations.join('; ')}
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}
