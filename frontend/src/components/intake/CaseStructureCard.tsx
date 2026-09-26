/**
 * CaseStructureCard — renders AI Module 02 output.
 * Premium dark glass card variant.
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
    pct >= 80 ? 'bg-trust-green' : pct >= 50 ? 'bg-trust-amber' : 'bg-neutral-500';

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className="h-1.5 w-16 shrink-0 rounded-full overflow-hidden"
        style={{ background: 'rgba(99, 102, 241, 0.1)' }}
      >
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{pct}%</span>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <h3
        className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-text-muted)' }}
      >
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
      className="glass-card-static animate-fade-in"
      aria-label="Case structure — deeper AI analysis"
    >
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <p
          className="text-[10px] font-mono font-semibold uppercase tracking-widest mb-1"
          style={{ color: 'var(--color-text-accent)' }}
        >
          Deeper Analysis
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Timeline, entities, and evidence gaps identified by AI
        </p>
      </div>

      <div>
        {/* Timeline */}
        {structure.timeline.length > 0 && (
          <>
            <Section title="Timeline of events" icon="📅">
              <ol className="space-y-4" aria-label="Timeline">
                {structure.timeline.map((event, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          border: '2px solid #818cf8',
                          background: 'var(--color-bg-elevated)',
                        }}
                        aria-hidden="true"
                      />
                      {i < structure.timeline.length - 1 && (
                        <div className="w-px flex-1" style={{ background: 'var(--color-border)' }} aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-sm leading-snug" style={{ color: 'var(--color-text-primary)' }}>{event.description}</p>
                      {(event.date || event.approximateDate) && (
                        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
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
            <div style={{ borderBottom: '1px solid var(--color-border-subtle)' }} />
          </>
        )}

        {/* Entities */}
        {structure.entities.length > 0 && (
          <>
            <Section title="People & organisations" icon="👤">
              <ul className="space-y-2" aria-label="Entities">
                {structure.entities.map((entity, i) => (
                  <li
                    key={i}
                    className="rounded-xl px-4 py-2.5"
                    style={{
                      background: 'rgba(99, 102, 241, 0.04)',
                      border: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{entity.name}</span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                        style={{
                          background: 'rgba(139, 92, 246, 0.1)',
                          color: '#a78bfa',
                        }}
                      >
                        {entity.role.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                    {entity.notes && (
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>{entity.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
            <div style={{ borderBottom: '1px solid var(--color-border-subtle)' }} />
          </>
        )}

        {/* Structured facts */}
        {structure.structuredFacts.length > 0 && (
          <>
            <Section title="Verifiable facts" icon="📋">
              <ul className="space-y-3" aria-label="Structured facts">
                {structure.structuredFacts.map((fact, i) => (
                  <li key={i} className="flex flex-col gap-1">
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{fact.text}</p>
                    <ConfidenceBar value={fact.confidence} />
                  </li>
                ))}
              </ul>
            </Section>
            <div style={{ borderBottom: '1px solid var(--color-border-subtle)' }} />
          </>
        )}

        {/* Evidence */}
        <Section title="Evidence" icon="🗂️">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium text-trust-green">Available</p>
              {structure.evidenceAvailable.length > 0 ? (
                <ul className="space-y-1" aria-label="Evidence available">
                  {structure.evidenceAvailable.map((e, i) => (
                    <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <span className="text-trust-green shrink-0" aria-hidden="true">✓</span>
                      {e}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>None mentioned</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-trust-amber">May be needed</p>
              {structure.evidenceMissing.length > 0 ? (
                <ul className="space-y-1" aria-label="Evidence that may be needed">
                  {structure.evidenceMissing.map((e, i) => (
                    <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <span className="text-trust-amber shrink-0" aria-hidden="true">!</span>
                      {e}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>No obvious gaps identified</p>
              )}
            </div>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div
        className="rounded-b-2xl px-5 py-3"
        style={{
          background: 'rgba(99, 102, 241, 0.03)',
          borderTop: '1px solid var(--color-border-subtle)',
        }}
      >
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          AI-generated structure at {time}. Verify all details. Not legal advice.
        </p>
      </div>
    </article>
  );
}
