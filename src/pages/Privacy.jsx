// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import useSEO from '@/lib/useSEO';
import LandingFooter from '@/components/landing/LandingFooter';

const LAST_UPDATED = 'May 12, 2026';

export default function Privacy() {
  useSEO({
    title: 'Privacy Policy — TentaOS',
    description:
      'Privacy Policy for TentaOS by Wuhan Luojia Zhihui Technology Co., Ltd.',
    keywords: 'TentaOS, privacy policy',
  });

  return (
    <div className="min-h-screen bg-[#06060B] text-white/85">
      <header className="border-b border-white/[0.06] px-6 py-5">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link to="/Landing" className="text-sm text-[#00E5FF]/90 hover:text-[#00E5FF] transition-colors">
            ← Back to TentaOS
          </Link>
          <div className="flex items-center gap-4 text-xs text-white/35">
            <Link to="/terms" className="hover:text-white/55">Terms of Service</Link>
            <span className="text-white/15">·</span>
            <Link to="/refund" className="hover:text-white/55">Refund Policy</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 pb-20">
        <p className="text-[11px] uppercase tracking-wider text-white/35 mb-2">Legal</p>
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-white/45 mb-10">
          Wuhan Luojia Zhihui Technology Co., Ltd. (“we”, “us”) operates TentaOS (“Product”).
          <span className="block mt-1">Last updated: {LAST_UPDATED}</span>
        </p>

        <div className="space-y-10 text-sm text-white/65 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-medium text-white">1. What data we collect</h2>
            <p>
              We may collect account identifiers you provide (such as name and email), usage data related to the Product
              (for example feature interactions and diagnostics necessary to operate the service), technical data (such as
              browser type, device type, and approximate region derived from IP for security and reliability), and content
              you submit through the Product where needed to deliver functionality you request.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-medium text-white">2. How we use data</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide, operate, maintain, and improve TentaOS;</li>
              <li>Authenticate accounts and secure our systems;</li>
              <li>Respond to support requests and communicate service-related notices;</li>
              <li>Analyze aggregated usage to improve performance and user experience;</li>
              <li>Comply with legal obligations and enforce our Terms of Service.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-medium text-white">3. Cookies and analytics</h2>
            <p>
              We may use cookies and similar technologies that are strictly necessary for the site to function, and — where
              applicable — analytics tools (for example Vercel Analytics or comparable services) to understand traffic and
              reliability in aggregate form. You can control cookie preferences through your browser settings; disabling
              certain cookies may limit parts of the Product.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-medium text-white">4. Payments</h2>
            <p>
              Payments are processed by third-party payment providers. TentaOS does not store full card details.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-medium text-white">5. Contact</h2>
            <p>
              Questions about this Privacy Policy:{' '}
              <a href="mailto:support@tentaos.com" className="text-[#00E5FF]/90 hover:text-[#00E5FF]">
                support@tentaos.com
              </a>
              .
            </p>
            <p className="text-white/45 text-xs">
              Company: Wuhan Luojia Zhihui Technology Co., Ltd. · Product: TentaOS
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
