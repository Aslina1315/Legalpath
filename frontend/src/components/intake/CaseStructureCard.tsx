/**
 * CaseStructureCard — renders AI Module 02 output.
 *
 * Shows:
 *   - Timeline of events
 *   - Entity map
 *   - Structured facts with confidence
 *   - Evidence available / missing
 */

'use client';

import type { CaseStructureResult } from '@/lib/ai/schemas';

// ─── Confidence bar ────────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80 ? 'bg-trust-green' : pct >= 50 ? 'bg-amber-400' : 'bg-neutral-300';

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="h-1.5 w-16 shrink-0 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="text-xs text-neutral-400 tabular-nums">{pct}%</span>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        <span aria-hidden="true">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface CaseStructureCardProps {
  structure: CaseStructureResult;
  generatedAt: string;
}

export function CaseStructureCard({ structure, generatedAt }: CaseStructureCardProps) {
  const time = new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <article
      className="rounded-xl border border-neutral-200 bg-white shadow-sm animate-fade-in"
      aria-label="Case structure — deeper AI analysis"
    >
      {/* Header */}
      <div className="border-b border-neutral-100 px-5 py-4">
        <p className="text-xs font-medium text-brand-600 uppercase tracking-wider mb-0.5">
          Deeper Analysis
        </p>
        <p className="text-sm text-neutral-500">
          Timeline, entities, and evidence gaps identified by AI
        </p>
      </div>

      <div className="divide-y divide-neutral-100">
        {/* Timeline */}
        {structure.timeline.length > 0 && (
          <Section title="Timeline of events" icon="📅">
            <ol className="space-y-4" aria-label="Timeline">
              {structure.timeline.map((event, i) => (
                <li key={i} className="flex gap-3">
                  {/* Connector */}
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-brand-400 bg-white" aria-hidden="true" />
                    {i < structure.timeline.length - 1 && (
                      <div className="w-px flex-1 bg-neutral-200" aria-hidden="true" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-1">
                    <p className="text-sm text-neutral-700 leading-snug">{event.description}</p>
                    {(event.date || event.approximateDate) && (
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {event.date ?? event.approximateDate}
                      </p>
                    )}
                    <div className="mt-1">
                      <ConfidenceBar value={event.confidence} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Entities */}
        {structure.entities.length > 0 && (
          <Section title="People & organisations" icon="👤">
            <ul className="space-y-2" aria-label="Entities">
              {structure.entities.map((entity, i) => (
                <li key={i} className="rounded-lg bg-neutral-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-neutral-800">{entity.name}</span>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 capitalize">
                      {entity.role.replace('_', ' ').toLowerCase()}
                    </span>
                  </div>
                  {entity.notes && (
                    <p className="mt-0.5 text-xs text-neutral-500">{entity.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Structured facts */}
        {structure.structuredFacts.length > 0 && (
          <Section title="Verifiable facts" icon="📋">
            <ul className="space-y-2.5" aria-label="Structured facts">
              {structure.structuredFacts.map((fact, i) => (
                <li key={i} className="flex flex-col gap-1">
                  <p className="text-sm text-neutral-700">{fact.text}</p>
                  <ConfidenceBar value={fact.confidence} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Evidence */}
        <Section title="Evidence" icon="🗂️">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Available */}
            <div>
              <p className="mb-2 text-xs font-medium text-trust-green">Available</p>
              {structure.evidenceAvailable.length > 0 ? (
                <ul className="space-y-1" aria-label="Evidence available">
                  {structure.evidenceAvailable.map((e, i) => (
                    <li key={i} className="flex gap-2 text-sm text-neutral-700">
                      <span className="text-trust-green shrink-0" aria-hidden="true">✓</span>
                      {e}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-400 italic">None mentioned</p>
              )}
            </div>

            {/* Missing */}
            <div>
              <p className="mb-2 text-xs font-medium text-amber-600">May be needed</p>
              {structure.evidenceMissing.length > 0 ? (
                <ul className="space-y-1" aria-label="Evidence that may be needed">
                  {structure.evidenceMissing.map((e, i) => (
                    <li key={i} className="flex gap-2 text-sm text-neutral-700">
                      <span className="text-amber-500 shrink-0" aria-hidden="true">!</span>
                      {e}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-400 italic">No obvious gaps identified</p>
              )}
            </div>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div className="rounded-b-xl bg-neutral-50 border-t border-neutral-100 px-5 py-3">
        <p className="text-xs text-neutral-400">
          AI-generated structure at {time}. Verify all details. Not legal advice.
        </p>
      </div>
    </article>
  );
}
