/**
 * DomainCard — Renders AI Module 03 Domain & Jurisdiction Routing.
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
      className="rounded-xl border border-neutral-200 bg-white shadow-sm animate-fade-in overflow-hidden"
      aria-labelledby="domain-routing-heading"
    >
      <div className="border-b border-neutral-100 bg-neutral-50/50 px-5 py-3.5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Module 03 · Triage &amp; Jurisdiction
          </span>
          <h3 id="domain-routing-heading" className="text-sm font-semibold text-neutral-800">
            Applicable Help Domain &amp; Legal Framework
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 font-medium">Jurisdiction match:</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            {activeRouting.jurisdiction} ({confidencePct}%)
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Domain tags */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-800">
            📁 {activeRouting.domain}
          </span>
          <span className="rounded-lg bg-brand-50 border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700">
            ↳ {activeRouting.subDomain}
          </span>
        </div>

        {/* Reasoning */}
        <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-lg p-3 border border-neutral-100">
          {activeRouting.reasoningSummary}
        </p>

        {/* Missing information if jurisdiction or sub-domain needs clarification */}
        {activeRouting.missingInformation.length > 0 && (
          <div className="rounded-lg bg-amber-50/60 border border-amber-200 p-3.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1.5">
              <span>⚠️</span> Clarification needed to confirm jurisdiction
            </h4>
            <ul className="list-disc list-inside text-xs text-amber-900 space-y-1">
              {activeRouting.missingInformation.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Urgency signals */}
        {activeRouting.urgencySignals.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center pt-1">
            <span className="text-xs font-medium text-neutral-500">Notice signals:</span>
            {activeRouting.urgencySignals.map((signal, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-xs text-red-700 font-medium"
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
