// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import useSEO from '@/lib/useSEO';

/**
 * Early-access placeholder for routes not yet wired to Engine APIs.
 * No mock data, no polling, no broken API calls.
 */
export default function ComingSoonPage({
  title,
  description,
  icon: Icon,
  testId,
  seoTitle,
  seoDescription,
}) {
  useSEO({
    title: seoTitle || `${title} — TentaOS`,
    description: seoDescription || description,
  });

  return (
    <div
      data-testid={testId}
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 lg:p-8"
    >
      <div className="text-center max-w-md">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
          {Icon ? <Icon className="w-7 h-7 text-white/25" /> : <Sparkles className="w-7 h-7 text-white/25" />}
        </div>
        <span className="inline-block text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/[0.06] text-white/35 mb-4">
          Coming Soon · Early Access
        </span>
        <h1 className="text-xl font-semibold text-white mb-2">{title}</h1>
        <p className="text-sm text-white/45 leading-relaxed">{description}</p>
        <p className="text-xs text-white/30 mt-4">
          Demo tasks run from the Dashboard. No sample data is shown on this page.
        </p>
        <Link
          to="/Dashboard"
          className="inline-block mt-6 text-sm text-[#00E5FF]/90 hover:text-[#00E5FF] font-medium"
        >
          Go to Dashboard →
        </Link>
      </div>
    </div>
  );
}
