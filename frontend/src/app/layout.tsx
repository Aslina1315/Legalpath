import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { FirebaseProvider } from '@/components/providers/FirebaseProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { AppShell } from '@/components/layout/AppShell';
import { BRAND } from '@/tokens/design';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: BRAND.name,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.shortDescription,
  robots: { index: false, follow: false }, // Private during development
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="antialiased">
        {/* Skip to main content — keyboard accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <FirebaseProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
