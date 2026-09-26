/**
 * DomainCard — Renders AI Module 03 Domain & Jurisdiction Routing.
 * Premium dark glass card variant.
 */

'use client';

import type { DomainRoutingResult } from '@/types/ai';

interface DomainCardProps {
  routing?: DomainRoutingResult;
  domain?: DomainRoutingResult;
}

export function DomainCard({ routing, domain }: DomainCardProps) {
  const activeRouting = routing || domain;
  if (!activeRouting) return null;
  const confidencePct = Math.round(activeRouting.jurisdictionConfidence * 100);

  return (
    <article
      className="glass-card-static animate-fade-in overflow-hidden"
      aria-labelledby="domain-routing-heading"
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between flex-wrap gap-2"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div>
          <span
            className="text-[10px] font-mono font-semibold uppercase tracking-widest"
            style={{ color: 'var(--color-text-accent)' }}
          >
            Module 03 · Triage &amp; Jurisdiction
          </span>
          <h3
            id="domain-routing-heading"
            className="text-sm font-bold mt-0.5"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Applicable Domain &amp; Legal Framework
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Match:
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#a78bfa',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            {activeRouting.jurisdiction || 'Needs clarification'} ({confidencePct}%)
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Domain tags */}
        <div className="flex flex-wrap gap-2 items-center">
          <span
            className="rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            📁 {activeRouting.domain}
          </span>
          <span
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{
              background: 'rgba(139, 92, 246, 0.08)',
              color: '#a78bfa',
              border: '1px solid rgba(139, 92, 246, 0.15)',
            }}
          >
            ↳ {activeRouting.subDomain}
          </span>
        </div>

        {/* Reasoning */}
        <p
          className="text-sm leading-relaxed rounded-xl p-4"
          style={{
            background: 'rgba(99, 102, 241, 0.04)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          {activeRouting.reasoningSummary}
        </p>

        {/* Missing information */}
        {activeRouting.missingInformation.length > 0 && (
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(251, 191, 36, 0.05)',
              border: '1px solid rgba(251, 191, 36, 0.15)',
            }}
          >
            <h4
              className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"
              style={{ color: '#fbbf24' }}
            >
              <span>⚠️</span> Clarification needed
            </h4>
            <ul className="list-disc list-inside text-xs space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
              {activeRouting.missingInformation.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Urgency signals */}
        {activeRouting.urgencySignals.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center pt-1">
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Signals:</span>
            {activeRouting.urgencySignals.map((signal, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium"
                style={{
                  background: 'rgba(248, 113, 113, 0.08)',
                  color: '#f87171',
                  border: '1px solid rgba(248, 113, 113, 0.15)',
                }}
              >
                ⏱️ {signal}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
