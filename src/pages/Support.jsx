// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import useSEO from '@/lib/useSEO';
import LandingFooter from '@/components/landing/LandingFooter';

export default function Support() {
  useSEO({
    title: 'Support — TentaOS',
    description: 'Support and help for TentaOS.',
    keywords: 'TentaOS, support, help',
  });

  return (
    <div className="min-h-screen bg-[#06060B] text-white/85">
      <header className="border-b border-white/[0.06] px-6 py-5">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link to="/Landing" className="text-sm text-[#00E5FF]/90 hover:text-[#00E5FF] transition-colors">
            ← Back to TentaOS
          </Link>
          <div className="flex items-center gap-4 text-xs text-white/35">
            <Link to="/contact" className="hover:text-white/55">Contact</Link>
            <span className="text-white/15">·</span>
            <Link to="/refund" className="hover:text-white/55">Refund Policy</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 pb-20">
        <p className="text-[11px] uppercase tracking-wider text-white/35 mb-2">Support</p>
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Support</h1>
        <p className="text-sm text-white/45 mb-10">
          Need help with TentaOS? Email us and include screenshots or steps to reproduce if possible.
        </p>

        <div className="space-y-6 text-sm text-white/65 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-medium text-white">Email</h2>
            <p>
              <a href="mailto:support@tentaos.com" className="text-[#00E5FF]/90 hover:text-[#00E5FF]">
                support@tentaos.com
              </a>
            </p>
            <p className="text-white/45 text-xs">Typical response time: within 1–2 business days (placeholder).</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-white">Company</h2>
            <p>Wuhan Luojia Zhihui Technology Co., Ltd.</p>
            <p className="text-white/45 text-xs">Product: TentaOS</p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
