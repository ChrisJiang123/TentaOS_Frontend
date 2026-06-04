// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import useSEO from '@/lib/useSEO';
import LandingFooter from '@/components/landing/LandingFooter';

export default function BillingCancel() {
  useSEO({
    title: 'Checkout canceled — TentaOS',
    description: 'The checkout was canceled. You can retry anytime.',
    keywords: 'TentaOS billing cancel, checkout canceled',
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
            <Link to="/contact" className="hover:text-white/55">Support</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 pb-20">
        <p className="text-[11px] uppercase tracking-wider text-white/35 mb-2">Billing</p>
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Checkout canceled</h1>
        <p className="text-sm text-white/55 mb-8">
          你已取消本次支付流程。你可以随时回到 Pricing 页面重新发起结账，或联系支持团队协助处理。
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-sm font-medium bg-[#00E5FF] text-[#06060B] hover:bg-[#00E5FF]/90 transition-colors"
          >
            返回 Pricing
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-sm font-medium bg-white/[0.06] text-white hover:bg-white/[0.10] border border-white/[0.08] transition-colors"
          >
            联系支持
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

