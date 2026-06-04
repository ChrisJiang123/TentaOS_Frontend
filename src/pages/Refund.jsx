// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import useSEO from '@/lib/useSEO';
import LandingFooter from '@/components/landing/LandingFooter';

const LAST_UPDATED = 'May 12, 2026';

export default function Refund() {
  useSEO({
    title: 'Refund Policy — TentaOS',
    description: 'Refund Policy for TentaOS by Wuhan Luojia Zhihui Technology Co., Ltd.',
    keywords: 'TentaOS, refund policy, cancellation',
  });

  return (
    <div className="min-h-screen bg-[#06060B] text-white/85">
      <header className="border-b border-white/[0.06] px-6 py-5">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link to="/Landing" className="text-sm text-[#00E5FF]/90 hover:text-[#00E5FF] transition-colors">
            ← Back to TentaOS
          </Link>
          <div className="flex items-center gap-4 text-xs text-white/35">
            <Link to="/pricing" className="hover:text-white/55">Pricing</Link>
            <span className="text-white/15">·</span>
            <Link to="/support" className="hover:text-white/55">Support</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 pb-20">
        <p className="text-[11px] uppercase tracking-wider text-white/35 mb-2">Legal</p>
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Refund Policy</h1>
        <p className="text-sm text-white/45 mb-10">
          This Refund Policy applies to TentaOS offered by Wuhan Luojia Zhihui Technology Co., Ltd.
          <span className="block mt-1">Last updated: {LAST_UPDATED}</span>
        </p>

        <div className="space-y-10 text-sm text-white/65 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-medium text-white">1. Subscription cancellation</h2>
            <p>
              You can cancel your subscription at any time. After cancellation, your subscription will remain active until
              the end of the current billing period, and you will not be charged for the next period.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-medium text-white">2. Refunds</h2>
            <p>
              We aim to be fair and transparent. If you believe you were charged in error, or you experienced a material
              service issue, please contact support and we will review your request on a case-by-case basis.
            </p>
            <p>
              For monthly subscriptions, refund requests should generally be submitted within a reasonable time after the
              charge. Approved refunds (if any) may be prorated and may exclude usage already consumed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-medium text-white">3. Credit packs (if applicable)</h2>
            <p>
              If TentaOS offers prepaid credit packs, unused credits may be eligible for a refund only where required by
              law or explicitly stated at the time of purchase. Credits that have been used are not refundable.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-medium text-white">4. Contact</h2>
            <p>
              For refund questions, contact{' '}
              <a href="mailto:support@tentaos.com" className="text-[#00E5FF]/90 hover:text-[#00E5FF]">
                support@tentaos.com
              </a>
              . Please include your account email and any relevant invoice/receipt details.
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
