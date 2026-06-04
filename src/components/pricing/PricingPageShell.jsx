// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import LandingFooter from '@/components/landing/LandingFooter';

export default function PricingPageShell({
  children,
  backHref = '/Landing',
  backLabel = '← Back to TentaOS',
  'data-testid': testId,
}) {
  return (
    <div
      data-testid={testId}
      className="min-h-screen bg-[#06060B] text-white/85 flex flex-col"
    >
      <header className="border-b border-white/[0.06] px-6 py-5 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link to={backHref} className="text-sm text-[#00E5FF]/90 hover:text-[#00E5FF] transition-colors">
            {backLabel}
          </Link>
          <nav className="flex items-center gap-4 text-xs text-white/35" aria-label="Legal">
            <Link to="/terms" className="hover:text-white/55">
              Terms
            </Link>
            <span className="text-white/15" aria-hidden>
              ·
            </span>
            <Link to="/refund" className="hover:text-white/55">
              Refund
            </Link>
            <span className="text-white/15" aria-hidden>
              ·
            </span>
            <Link to="/privacy" className="hover:text-white/55">
              Privacy
            </Link>
            <span className="text-white/15" aria-hidden>
              ·
            </span>
            <a href="mailto:support@tentaos.com" className="hover:text-white/55">
              support@tentaos.com
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">{children}</main>

      <LandingFooter />
    </div>
  );
}
