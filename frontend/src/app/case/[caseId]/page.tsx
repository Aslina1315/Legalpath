/**
 * Case view page — /case/[caseId]
 * Premium dark variant.
 *
 * Shows the full case document from Firestore.
 * Protected: redirects to home if not authenticated.
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCaseById } from '@/lib/firebase/firestore';
import { useAppStore } from '@/store/useAppStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DomainCard } from '@/components/intake/DomainCard';
import { KnowledgeSourcesCard } from '@/components/intake/KnowledgeSourcesCard';
import { EvidenceGapsCard } from '@/components/intake/EvidenceGapsCard';
import { ContradictionsCard } from '@/components/intake/ContradictionsCard';
import { VerifiedGuidanceCard } from '@/components/intake/VerifiedGuidanceCard';
import { ActionPathCard } from '@/components/intake/ActionPathCard';
import { HumanHelpBridgeCard } from '@/components/intake/HumanHelpBridgeCard';
import type { Case } from '@/types/case';

export default function CasePage() {
  const params = useParams();
  const router = useRouter();
  const { user, authLoading } = useAppStore();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const caseId = params?.caseId as string;

  useEffect(() => {
    // Wait for auth to resolve
    if (authLoading) return;

    // Redirect unauthenticated users
    if (!user) {
      router.replace('/');
      return;
    }

    if (!caseId) {
      setError('Invalid case ID.');
      setLoading(false);
      return;
    }

    getCaseById(caseId)
      .then((data) => {
        if (!data) {
          setError('Case not found.');
          return;
        }
        // Security: only allow the case owner to view
        if (data.userId !== user.uid) {
          setError('You do not have access to this case.');
          return;
        }
        setCaseData(data);
      })
      .catch(() => setError('Failed to load case. Please try again.'))
      .finally(() => setLoading(false));
  }, [caseId, user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-label="Loading case">
        <LoadingSpinner size="lg" label="Loading your case…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div
          className="glass-card-static p-6 text-center"
        >
          <p className="text-base font-medium text-trust-red">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            style={{ color: '#a78bfa' }}
          >
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  if (!caseData) return null;

  const createdDate = new Date(caseData.timestamps.createdAt).toLocaleDateString([], {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 animate-fade-in">
      {/* Back link */}
      <a
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
        style={{ color: 'var(--color-text-muted)' }}
      >
        ← New case
      </a>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-[10px] font-mono font-semibold uppercase tracking-widest mb-1"
              style={{ color: 'var(--color-text-accent)' }}
            >
              Case · {caseData.caseId.slice(0, 8)}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Created {createdDate}</p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold capitalize"
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              color: '#a78bfa',
              border: '1px solid rgba(99, 102, 241, 0.15)',
            }}
          >
            {caseData.status.replace('_', ' ').toLowerCase()}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Original narrative */}
        <section
          className="glass-card-static"
          aria-labelledby="narrative-heading"
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <h2 id="narrative-heading" className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Your account
            </h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
              {caseData.narrative}
            </p>
          </div>
        </section>

        {/* Timeline */}
        {caseData.timeline && caseData.timeline.length > 0 && (
          <section
            className="glass-card-static"
            aria-labelledby="timeline-heading"
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 id="timeline-heading" className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                📅 Timeline
              </h2>
            </div>
            <ol className="px-5 py-4 space-y-4" aria-label="Timeline of events">
              {caseData.timeline.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <div
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ border: '2px solid #818cf8', background: 'var(--color-bg-elevated)' }}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{event.description}</p>
                    {(event.date || event.approximateDate) && (
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {event.date ?? event.approximateDate}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Entities */}
        {caseData.entities && caseData.entities.length > 0 && (
          <section
            className="glass-card-static"
            aria-labelledby="entities-heading"
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 id="entities-heading" className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                👤 People &amp; organisations
              </h2>
            </div>
            <ul className="px-5 py-4 space-y-2">
              {caseData.entities.map((entity) => (
                <li
                  key={entity.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm"
                  style={{
                    background: 'rgba(99, 102, 241, 0.04)',
                    border: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{entity.name}</span>
                  <span
                    className="text-xs capitalize"
                    style={{ color: '#a78bfa' }}
                  >
                    {entity.role.replace('_', ' ').toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Structured facts */}
        {caseData.structuredFacts && caseData.structuredFacts.length > 0 && (
          <section
            className="glass-card-static"
            aria-labelledby="facts-heading"
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 id="facts-heading" className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                📋 Key facts
              </h2>
            </div>
            <ul className="px-5 py-4 space-y-2" aria-label="Structured facts">
              {caseData.structuredFacts.map((fact) => (
                <li key={fact.id} className="flex gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#818cf8' }} aria-hidden="true" />
                  {fact.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Jurisdiction & Domain */}
        {caseData.domainRouting ? (
          <DomainCard domain={caseData.domainRouting} />
        ) : caseData.jurisdiction ? (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'rgba(99, 102, 241, 0.06)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              color: '#a78bfa',
            }}
          >
            <strong>Jurisdiction detected:</strong> {caseData.jurisdiction}
          </div>
        ) : null}

        {/* Live Knowledge Retrieval */}
        {caseData.knowledgeRetrieval && (
          <KnowledgeSourcesCard retrieval={caseData.knowledgeRetrieval} />
        )}

        {/* Evidence Gaps */}
        {caseData.evidenceGaps && (
          <EvidenceGapsCard gapResult={caseData.evidenceGaps} />
        )}

        {/* Contradictions */}
        {caseData.contradictions && (
          <ContradictionsCard
            contradictionResult={caseData.contradictions}
            userClarifications={{}}
            onClarificationSubmit={() => { }}
          />
        )}

        {/* Verified Guidance */}
        {caseData.responseVerification && (
          <VerifiedGuidanceCard verification={caseData.responseVerification} />
        )}

        {/* Action Path */}
        {caseData.actionPath && (
          <ActionPathCard actionPath={caseData.actionPath} />
        )}

        {/* Human Help Bridge */}
        {caseData.actionPath?.humanHelpRecommended && (
          <HumanHelpBridgeCard
            jurisdiction={caseData.domainRouting?.jurisdiction ?? caseData.jurisdiction ?? undefined}
            reasoning={caseData.actionPath.humanHelpReasoning ?? undefined}
            domain={caseData.domainRouting?.domain}
          />
        )}

        {/* Generated Formal Document */}
        {caseData.generatedDocument && (
          <section
            className="glass-card-static p-6 space-y-4"
            aria-labelledby="saved-doc-heading"
          >
            <div
              className="flex flex-wrap items-center justify-between gap-2 pb-3"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div>
                <span
                  className="text-[10px] font-mono uppercase tracking-widest font-semibold"
                  style={{ color: 'var(--color-text-accent)' }}
                >
                  Saved Document Draft
                </span>
                <h2
                  id="saved-doc-heading"
                  className="text-base font-bold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {caseData.generatedDocument.title}
                </h2>
              </div>
              {caseData.beforeSendReview && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold"
                  style={{
                    background:
                      caseData.beforeSendReview.verdict === 'READY'
                        ? 'rgba(52, 211, 153, 0.08)'
                        : caseData.beforeSendReview.verdict === 'NEEDS_REVIEW'
                        ? 'rgba(251, 191, 36, 0.08)'
                        : 'rgba(248, 113, 113, 0.08)',
                    color:
                      caseData.beforeSendReview.verdict === 'READY'
                        ? '#34d399'
                        : caseData.beforeSendReview.verdict === 'NEEDS_REVIEW'
                        ? '#fbbf24'
                        : '#f87171',
                    border: `1px solid ${
                      caseData.beforeSendReview.verdict === 'READY'
                        ? 'rgba(52, 211, 153, 0.2)'
                        : caseData.beforeSendReview.verdict === 'NEEDS_REVIEW'
                        ? 'rgba(251, 191, 36, 0.2)'
                        : 'rgba(248, 113, 113, 0.2)'
                    }`,
                  }}
                >
                  Review: {caseData.beforeSendReview.verdict}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {caseData.generatedDocument.sections.map((sec) => (
                <div
                  key={sec.id}
                  className="p-3 rounded-xl space-y-1"
                  style={{
                    background: 'rgba(99, 102, 241, 0.03)',
                    border: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{sec.heading}</span>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{sec.category}</span>
                  </div>
                  <p
                    className="text-xs whitespace-pre-wrap leading-relaxed"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Legal disclaimer */}
      <div
        className="mt-8 rounded-xl px-4 py-4"
        style={{
          background: 'rgba(99, 102, 241, 0.03)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <strong style={{ color: 'var(--color-text-secondary)' }}>Not legal advice.</strong> This platform provides AI-assisted legal information only.
          Always consult a qualified legal professional for advice specific to your situation.
        </p>
      </div>
    </div>
  );
}
