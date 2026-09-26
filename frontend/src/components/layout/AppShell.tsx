/**
 * App Shell — Premium dark full-height layout wrapper.
 * Provides consistent page structure with ambient background.
 */

import { TopNav } from './TopNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Ambient gradient orb — top */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-30"
        style={{
          background: 'radial-gradient(ellipse, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.05) 40%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Ambient gradient orb — bottom right */}
      <div
        className="pointer-events-none fixed bottom-0 right-0 w-[500px] h-[500px] opacity-20"
        style={{
          background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.12) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <TopNav />
      <main
        id="main-content"
        className="relative z-10 flex-1"
        tabIndex={-1}
      >
        {children}
      </main>
      <footer className="relative z-10 border-t py-8" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
          This platform provides AI-assisted legal information, not legal advice. Always consult a qualified legal professional for your specific situation.
        </p>
      </footer>
    </div>
  );
}
