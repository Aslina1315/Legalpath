import { IntakeForm } from '@/components/intake/IntakeForm';
import { BRAND } from '@/tokens/design';

export default function HomePage() {
  return (
    <section
      className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 animate-fade-in"
      aria-labelledby="hero-heading"
    >
      {/* Hero */}
      <div className="mb-12 space-y-4">
        <h1
          id="hero-heading"
          className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl"
          style={{ lineHeight: '1.15' }}
        >
          Tell us what{' '}
          <span className="text-brand-600">happened.</span>
        </h1>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-xl">
          {BRAND.tagline}
        </p>
      </div>

      {/* Intake form */}
      <IntakeForm />

      {/* Trust statement */}
      <div className="mt-12 flex items-start gap-3 rounded-lg bg-neutral-50 px-4 py-4">
        <span className="mt-0.5 text-trust-green" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </span>
        <p className="text-sm text-neutral-600">
          <strong className="font-semibold text-neutral-800">Your information is private.</strong>{' '}
          What you share is used only to help structure your situation. We never share your details with third parties.
        </p>
      </div>
    </section>
  );
}
