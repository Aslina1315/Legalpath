/**
 * CaseResultCard — renders the structured output from AI Module 01.
 *
 * Displays:
 *   - Summary sentence
 *   - Legal domains detected
 *   - Key facts extracted
 *   - Entities identified
 *   - Urgency level (with appropriate visual weight)
 *   - Clarification questions (if any)
 *
 * Emphasises that this is an AI interpretation, not legal advice.
 */

'use client';

import type { CaseIntakeResult } from '@/lib/ai/schemas';

// ─── Urgency Badge ─────────────────────────────────────────────────────────────

const URGENCY_CONFIG = {
  HIGH: {
    label: 'Urgent',
    className: 'bg-red-100 text-red-800 border border-red-200',
    icon: '⚠️',
  },
  MEDIUM: {
    label: 'Moderate',
    className: 'bg-amber-50 text-amber-800 border border-amber-200',
    icon: '🕐',
  },
  LOW: {
    label: 'Low urgency',
    className: 'bg-green-50 text-green-800 border border-green-200',
    icon: '✓',
  },
  UNKNOWN: {
    label: 'Urgency unclear',
    className: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
    icon: '?',
  },
} as const;

function UrgencyBadge({ level }: { level: CaseIntakeResult['urgencyLevel'] }) {
  const config = URGENCY_CONFIG[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.className}`}
      aria-label={`Urgency: ${config.label}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Pill tag list ─────────────────────────────────────────────────────────────

function PillList({ items, colorClass = 'bg-brand-50 text-brand-700' }: { items: string[]; colorClass?: string }) {
  if (!items.length) return <p className="text-sm text-neutral-400 italic">None identified</p>;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="items">
      {items.map((item) => (
        <li
          key={item}
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${colorClass}`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface CaseResultCardProps {
  result: CaseIntakeResult;
  /** ISO timestamp of when the AI generated this */
  generatedAt: string;
  /** AI model used */
  model?: string;
}

export function CaseResultCard({ result, generatedAt, model }: CaseResultCardProps) {
  const formattedTime = new Date(generatedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article
      className="rounded-xl border border-neutral-200 bg-white shadow-sm animate-fade-in"
      aria-label="Your situation — AI interpretation"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4">
        <div>
          <p className="text-xs font-medium text-brand-600 uppercase tracking-wider mb-1">
            AI Interpretation
          </p>
          <h2 className="text-base font-semibold text-neutral-900 leading-snug">
            {result.summary}
          </h2>
        </div>
        <UrgencyBadge level={result.urgencyLevel} />
      </div>

      {/* Body */}
      <div className="divide-y divide-neutral-100">
        {/* Legal domains */}
        <div className="px-5 py-4">
          <Section title="Likely legal area">
            <PillList items={result.legalDomains} colorClass="bg-brand-50 text-brand-700" />
          </Section>
        </div>

        {/* Jurisdiction */}
        {result.detectedJurisdiction && (
          <div className="px-5 py-4">
            <Section title="Jurisdiction detected">
              <p className="text-sm text-neutral-700">{result.detectedJurisdiction}</p>
            </Section>
          </div>
        )}

        {/* Key facts */}
        {result.keyFacts.length > 0 && (
          <div className="px-5 py-4">
            <Section title="Key facts">
              <ul className="space-y-1.5" aria-label="Key facts extracted from your narrative">
                {result.keyFacts.map((fact, i) => (
                  <li key={i} className="flex gap-2 text-sm text-neutral-700">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden="true" />
                    {fact}
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        )}

        {/* Entities */}
        {result.entities.length > 0 && (
          <div className="px-5 py-4">
            <Section title="People and organisations involved">
              <ul className="space-y-1" aria-label="Entities identified">
                {result.entities.map((entity, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-neutral-800">{entity.name}</span>
                    <span className="text-neutral-400">·</span>
                    <span className="text-neutral-500 capitalize">{entity.role}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        )}

        {/* Clarification questions */}
        {result.clarificationNeeded.length > 0 && (
          <div className="px-5 py-4">
            <Section title="We may need to clarify">
              <ul className="space-y-2" aria-label="Clarification questions">
                {result.clarificationNeeded.map((q, i) => (
                  <li key={i} className="flex gap-2 text-sm text-neutral-700">
                    <span className="text-brand-500 font-bold shrink-0" aria-hidden="true">?</span>
                    {q}
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        )}
      </div>

      {/* Footer — AI disclaimer */}
      <div className="rounded-b-xl bg-neutral-50 border-t border-neutral-100 px-5 py-3">
        <p className="text-xs text-neutral-400 leading-relaxed">
          <strong className="text-neutral-500">Not legal advice.</strong>{' '}
          This is an AI interpretation of what you shared, generated at {formattedTime}
          {model ? ` using ${model}` : ''}. It may contain errors — always verify with a qualified professional.
        </p>
      </div>
    </article>
  );
}
