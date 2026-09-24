/**
 * Case view page — /case/[caseId]
 *
 * Shows the full case document from Firestore.
 * Protected: redirects to home if not authenticated.
 *
 * This is a client component because it needs auth state from the store.
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-base font-medium text-red-800">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-sm text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
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
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 animate-fade-in">
      {/* Back link */}
      <a
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
      >
        ← New case
      </a>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-brand-600 mb-1">
              Case · {caseData.caseId.slice(0, 8)}
            </p>
            <p className="text-xs text-neutral-400">Created {createdDate}</p>
          </div>
          <span className="rounded-full px-3 py-1 text-xs font-medium capitalize bg-neutral-100 text-neutral-600">
            {caseData.status.replace('_', ' ').toLowerCase()}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Original narrative */}
        <section
          className="rounded-xl border border-neutral-200 bg-white shadow-sm"
          aria-labelledby="narrative-heading"
        >
          <div className="border-b border-neutral-100 px-5 py-4">
            <h2 id="narrative-heading" className="text-sm font-semibold text-neutral-700">
              Your account
            </h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
              {caseData.narrative}
            </p>
          </div>
        </section>

        {/* Timeline */}
        {caseData.timeline && caseData.timeline.length > 0 && (
          <section
            className="rounded-xl border border-neutral-200 bg-white shadow-sm"
            aria-labelledby="timeline-heading"
          >
            <div className="border-b border-neutral-100 px-5 py-4">
              <h2 id="timeline-heading" className="text-sm font-semibold text-neutral-700">
                📅 Timeline
              </h2>
            </div>
            <ol className="px-5 py-4 space-y-4" aria-label="Timeline of events">
              {caseData.timeline.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-brand-400 bg-white" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-neutral-700">{event.description}</p>
                    {(event.date || event.approximateDate) && (
                      <p className="mt-0.5 text-xs text-neutral-400">
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
            className="rounded-xl border border-neutral-200 bg-white shadow-sm"
            aria-labelledby="entities-heading"
          >
            <div className="border-b border-neutral-100 px-5 py-4">
              <h2 id="entities-heading" className="text-sm font-semibold text-neutral-700">
                👤 People &amp; organisations
              </h2>
            </div>
            <ul className="px-5 py-4 space-y-2">
              {caseData.entities.map((entity) => (
                <li key={entity.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                  <span className="font-medium text-neutral-800">{entity.name}</span>
                  <span className="text-xs text-neutral-500 capitalize">
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
            className="rounded-xl border border-neutral-200 bg-white shadow-sm"
            aria-labelledby="facts-heading"
          >
            <div className="border-b border-neutral-100 px-5 py-4">
              <h2 id="facts-heading" className="text-sm font-semibold text-neutral-700">
                📋 Key facts
              </h2>
            </div>
            <ul className="px-5 py-4 space-y-2" aria-label="Structured facts">
              {caseData.structuredFacts.map((fact) => (
                <li key={fact.id} className="flex gap-2 text-sm text-neutral-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden="true" />
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
          <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">
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
            onClarificationSubmit={() => {}}
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
      </div>

      {/* Legal disclaimer */}
      <div className="mt-8 rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-4">
        <p className="text-xs text-neutral-500 leading-relaxed">
          <strong>Not legal advice.</strong> This platform provides AI-assisted legal information only.
          Always consult a qualified legal professional for advice specific to your situation.
        </p>
      </div>
    </div>
  );
}
