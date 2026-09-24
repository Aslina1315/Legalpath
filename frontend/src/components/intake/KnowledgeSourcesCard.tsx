/**
 * KnowledgeSourcesCard — Renders AI Module 05 Live Knowledge Retrieval
 * with visible trust badges, official source links, and statutory rules.
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
      className="rounded-xl border border-neutral-200 bg-white shadow-sm animate-fade-in overflow-hidden"
      aria-labelledby="knowledge-sources-heading"
    >
      <div className="border-b border-neutral-100 bg-neutral-50/50 px-5 py-3.5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">
            Module 05 · Live Legal Retrieval
          </span>
          <h3 id="knowledge-sources-heading" className="text-sm font-semibold text-neutral-800">
            Authoritative Legal Rules &amp; Sources
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isNoSource ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
              ⚪ No verified source found
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-soft" aria-hidden="true" />
              Live Grounded
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Research Query Used */}
        <div className="text-xs text-neutral-500 flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wide text-neutral-400">Search Query:</span>
          <code className="bg-neutral-100 rounded px-2 py-0.5 text-neutral-700 font-mono">
            {activeKnowledge.queryUsed}
          </code>
        </div>

        {/* If no verified source */}
        {isNoSource ? (
          <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4 text-sm text-neutral-600">
            <p className="font-medium text-neutral-800 mb-1">Notice: Specific authoritative source not verified.</p>
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
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Key Legal Findings
                </h4>
                <ul className="space-y-1.5">
                  {activeKnowledge.keyFindings.map((finding, i) => (
                    <li key={i} className="flex gap-2 text-sm text-neutral-700">
                      <span className="text-brand-500 font-bold shrink-0">✓</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Applicable Rules */}
            {activeKnowledge.applicableRules.length > 0 && (
              <div className="rounded-lg bg-sky-50/50 border border-sky-100 p-3.5 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-sky-800">
                  Applicable Statutory Protections &amp; Requirements
                </h4>
                <ul className="space-y-1 text-xs text-sky-950">
                  {activeKnowledge.applicableRules.map((rule, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-sky-500 font-bold">§</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verified Sources List */}
            {activeKnowledge.sources.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Referenced Authoritative Citations ({activeKnowledge.sources.length})
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {activeKnowledge.sources.map((source, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 flex flex-col justify-between hover:border-brand-300 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 rounded px-1.5 py-0.5">
                            {source.sourceType}
                          </span>
                          {source.publisher && (
                            <span className="text-[11px] text-neutral-400 truncate">
                              {source.publisher}
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs font-semibold text-neutral-800 leading-snug line-clamp-2">
                          {source.title}
                        </h5>
                        <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
                          {source.summary}
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <span>✓</span> Verified Grounding
                        </span>
                        {source.url && source.url.startsWith('http') && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-600 font-medium hover:underline inline-flex items-center gap-1 focus-visible:ring-1 rounded"
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
              <div className="text-xs text-neutral-500 bg-neutral-50 rounded-lg p-2.5 border border-neutral-100">
                <strong className="text-neutral-700">Procedural Limitations:</strong>{' '}
                {activeKnowledge.limitations.join('; ')}
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}
