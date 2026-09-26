'use client';

import React from 'react';
import { resolveHumanHelpResources } from '@/lib/ai/humanHelpModule';
import type { HumanHelpBridgeResult } from '@/types/ai';

interface HumanHelpBridgeCardProps {
  jurisdiction?: string;
  reasoning?: string;
  domain?: string;
  forceOpen?: boolean;
}

export const HumanHelpBridgeCard: React.FC<HumanHelpBridgeCardProps> = ({
  jurisdiction,
  reasoning,
  domain,
}) => {
  const helpData: HumanHelpBridgeResult = resolveHumanHelpResources({
    jurisdiction,
    reasoning,
    domain,
  });

  return (
    <section
      className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-600/40 shadow-xl space-y-5 animate-fade-in"
      aria-labelledby="human-help-heading"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 text-xl">
          🤝
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Human Help Bridge
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {helpData.jurisdiction}
            </span>
          </div>
          <h3 id="human-help-heading" className="text-base font-bold text-white tracking-tight">
            AI may not be enough for this situation.
          </h3>
          <p className="text-sm font-medium text-amber-300">
            Explore official or human legal assistance
          </p>
          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {helpData.recommendedReason || helpData.headline}
          </p>
        </div>
      </div>

      {/* Location notification if general */}
      {helpData.locationNotice && (
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2">
          <span className="text-slate-400">ℹ️</span>
          <span>{helpData.locationNotice}</span>
        </div>
      )}

      {/* Official Verified Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {helpData.officialResources.map((res) => (
          <div
            key={res.id}
            className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-colors flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-white group-hover:text-amber-300">
                  {res.name}
                </h4>
                <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  OFFICIAL
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {res.description}
              </p>
              {res.telephone && (
                <div className="text-xs text-amber-300 font-mono flex items-center gap-1.5">
                  <span>📞</span>
                  <span>{res.telephone}</span>
                </div>
              )}
              {res.eligibilityNote && (
                <p className="text-[11px] text-slate-400 italic">
                  Note: {res.eligibilityNote}
                </p>
              )}
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">
                Coverage: {res.coverageArea}
              </span>
              <a
                href={res.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
              >
                Access Portal
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Non-lawyer, no-marketplace disclaimer */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
        <strong>Trust &amp; Neutrality Notice:</strong> {helpData.nonAdvocateDisclaimer}
      </div>
    </section>
  );
};
