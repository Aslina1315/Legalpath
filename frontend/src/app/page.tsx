/**
 * HomePage — Premium AI Legal Access Landing Experience.
 *
 * Requirements:
 * - Headline:
 *     "Understand what happened.
 *      Know what to do next."
 * - Supporting text:
 *     "Tell us your situation in your own words. We'll help organize the details,
 *      check current information, review your evidence, and build a clear next-step path."
 * - Primary interaction: Large premium conversational input surface via <IntakeForm />
 * - Refined editorial typography & subtle depth
 */

'use client';

import { IntakeForm } from '@/components/intake/IntakeForm';
import { useAppStore } from '@/store/useAppStore';
import { getTranslation } from '@/lib/i18n';

export default function HomePage() {
  const { language } = useAppStore();
  const t = getTranslation(language);

  return (
    <section
      className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20 animate-fade-in"
      aria-labelledby="hero-heading"
    >
      {/* ═══ Editorial Hero Header ═══ */}
      <div className="mb-12 sm:mb-16 space-y-6 text-center max-w-3xl mx-auto">
        {/* Subtle Intelligence Beacon Badge */}
        <div className="flex justify-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-mono font-semibold tracking-wider uppercase"
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              color: 'var(--color-text-accent)',
              border: '1px solid rgba(129, 140, 248, 0.2)',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            AI-POWERED LEGAL INTELLIGENCE
          </span>
        </div>

        {/* Editorial Headline */}
        <h1
          id="hero-heading"
          className="editorial-headline text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white font-editorial"
        >
          <span className="block">{t.headlineLine1}</span>
          <span
            className="block mt-1 font-serif italic"
            style={{
              background: 'linear-gradient(135deg, #c7d2fe 0%, #818cf8 60%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t.headlineLine2}
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="mx-auto max-w-2xl text-base sm:text-lg leading-relaxed text-slate-300">
          {t.subText}
        </p>
      </div>

      {/* ═══ Conversational Intake & Living Journey Experience ═══ */}
      <IntakeForm />
    </section>
  );
}
