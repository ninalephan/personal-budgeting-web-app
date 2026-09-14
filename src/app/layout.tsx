import type { Metadata } from 'next'
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { Fraunces, Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

// Same pairing as the rest of the app: Fraunces for the wordmark/headlines,
// Inter for everything else.
const fraunces = Fraunces({
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
  subsets: ['latin'],
})

const inter = Inter({
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Balance',
  description: 'A shared ledger for two.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col site-body">
        <style>{`
          .site-body {
            --ink: #1B2430;
            --paper: #FBF7EF;
            --paper-2: #F3EEE3;
            --line: #E4DCC8;
            --brass: #C9A227;
            --teal: #3A6B72;
            --slate: #6B7280;

            background: var(--paper);
            color: var(--ink);
            font-family: var(--font-inter), -apple-system, sans-serif;
          }

          .site-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 40px; border-bottom: 1px solid var(--line);
            background: var(--paper);
          }
          .site-brand {
            font-family: var(--font-fraunces), Georgia, serif;
            font-style: italic; font-size: 20px; color: var(--ink); text-decoration: none;
          }
          .site-header-actions { display: flex; align-items: center; gap: 14px; }

          .site-header-actions button[data-clerk-sign-in] ,
          .site-signin-btn {
            background: transparent; border: none; color: var(--slate);
            font-family: var(--font-inter), sans-serif; font-size: 14px; font-weight: 500;
            cursor: pointer; padding: 8px 4px;
          }
          .site-signin-btn:hover { color: var(--ink); }

          .site-signup-btn {
            background: var(--brass); color: var(--ink); border: none;
            font-family: var(--font-inter), sans-serif; font-weight: 600; font-size: 14px;
            border-radius: 8px; padding: 9px 18px; cursor: pointer;
          }
          .site-signup-btn:hover { filter: brightness(0.95); }
        `}</style>

        <ClerkProvider>
          <header className="site-header">
            <Link href="/" className="site-brand">Balance</Link>
            <div className="site-header-actions">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="site-signin-btn">Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="site-signup-btn">Get started</button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
