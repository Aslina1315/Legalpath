/**
 * App Shell — full-height flex layout wrapper.
 * Provides consistent page structure.
 */

import { TopNav } from './TopNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopNav />
      <main
        id="main-content"
        className="flex-1"
        tabIndex={-1}
      >
        {children}
      </main>
      <footer className="border-t border-neutral-100 py-6">
        <p className="text-center text-xs text-neutral-400">
          This platform provides AI-assisted legal information, not legal advice. Always consult a qualified legal professional for your specific situation.
        </p>
      </footer>
    </div>
  );
}
