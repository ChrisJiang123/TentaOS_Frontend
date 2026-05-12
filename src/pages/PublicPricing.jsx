// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import useSEO from '@/lib/useSEO';
import { cn } from '@/lib/utils';
import LandingFooter from '@/components/landing/LandingFooter';
import { createCreemCheckout, fetchBillingMe, fetchUserMe } from '@/lib/billingAccountApi';
import { useQuery } from '@tanstack/react-query';

export default function PublicPricing() {
  useSEO({
    title: 'Pricing — TentaOS',
    description: 'TentaOS pricing: Free/Beta, Pro, Founder, and Credit Packs.',
    keywords: 'TentaOS pricing, plans, credits',
  });

  const [loadingKey, setLoadingKey] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  const me = useQuery({
    queryKey: ['users-me'],
    queryFn: () => fetchUserMe({ timeoutMs: 10_000 }),
    retry: 0,
    staleTime: 30_000,
  });
  const billing = useQuery({
    queryKey: ['billing-me'],
    queryFn: () => fetchBillingMe({ timeoutMs: 10_000 }),
    retry: 0,
    staleTime: 30_000,
  });

  const planStatus = useMemo(() => {
    const plan = billing.data?.plan ?? billing.data?.tier ?? 'free';
    const status = billing.data?.status ?? 'unknown';
    const credits = billing.data?.credits_balance;
    return { plan: String(plan), status: String(status), credits: credits == null ? null : Number(credits) };
  }, [billing.data]);

  const tiers = [
    {
      key: 'free_beta',
      name: 'Free / Beta',
      price: '$0',
      note: 'For early users and evaluation.',
      cta: { label: '加入 Beta', kind: 'contact' },
      highlight: false,
      features: ['Limited usage during beta', 'Core dashboard & monitoring', 'BYOK (bring your own key) support'],
    },
    {
      key: 'plan_pro',
      name: 'Pro',
      price: '$49',
      note: 'For individuals and professionals.',
      cta: { label: '订阅 Pro', kind: 'checkout' },
      highlight: true,
      features: ['Higher usage limits', 'Priority support', 'Advanced workflow features (as available)'],
    },
    {
      key: 'plan_founder',
      name: 'Founder',
      price: '$149',
      note: 'For early supporters and teams.',
      cta: { label: '订阅 Founder', kind: 'checkout' },
      highlight: false,
      features: ['Everything in Pro', 'Early feature access (as available)', 'Team-ready controls (as available)'],
    },
  ];

  const packs = [
    { key: 'credits_small', name: 'Credit Pack Small', desc: 'For occasional bursts', price: '$10' },
    { key: 'credits_medium', name: 'Credit Pack Medium', desc: 'Balanced usage', price: '$25' },
    { key: 'credits_large', name: 'Credit Pack Large', desc: 'Heavy usage', price: '$50' },
  ];

  async function startCheckout(productKey) {
    setCheckoutError('');
    setLoadingKey(productKey);
    try {
      const res = await createCreemCheckout({
        product: productKey,
        return_path: '/billing/success',
        cancel_path: '/billing/cancel',
      });
      const checkoutUrl = res.checkout_url || res.url || res.checkoutUrl;
      if (!checkoutUrl) throw new Error('后端未返回 checkout_url');
      window.location.href = String(checkoutUrl);
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div data-testid="pricing-page" className="min-h-screen bg-[#06060B] text-white/85">
      <header className="border-b border-white/[0.06] px-6 py-5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link to="/Landing" className="text-sm text-[#00E5FF]/90 hover:text-[#00E5FF] transition-colors">
            ← Back to TentaOS
          </Link>
          <div className="flex items-center gap-4 text-xs text-white/35">
            <Link to="/privacy" className="hover:text-white/55">Privacy</Link>
            <span className="text-white/15">·</span>
            <Link to="/terms" className="hover:text-white/55">Terms</Link>
            <span className="text-white/15">·</span>
            <Link to="/refund" className="hover:text-white/55">Refund</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 pb-20">
        <p className="text-[11px] uppercase tracking-wider text-white/35 mb-2">Pricing</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-3">Simple pricing</h1>
        <p className="text-sm text-white/45 mb-10 max-w-2xl">
          付款将通过第三方支付提供商 Creem 处理。我们不会在前端存储或展示完整卡信息。
        </p>

        {(me.isSuccess || billing.isSuccess) && (
          <div className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-xs text-white/40 mb-2">当前账户</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              <span className="text-white/85">
                {me.data?.email || me.data?.name || '未登录/匿名'}
              </span>
              <span className="text-white/15">·</span>
              <span>
                方案：<span className="text-white">{planStatus.plan}</span>
              </span>
              <span className="text-white/15">·</span>
              <span>
                状态：<span className="text-white">{planStatus.status}</span>
              </span>
              {planStatus.credits != null && (
                <>
                  <span className="text-white/15">·</span>
                  <span>
                    余额：<span className="text-white">{planStatus.credits.toLocaleString()} credits</span>
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {(billing.isError || me.isError) && (
          <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
            <p className="text-sm text-amber-300/90">
              计费或账户服务暂不可用（不会显示虚假的已付费状态）。你仍可浏览页面，稍后再试。
            </p>
            <p className="text-xs text-white/40 mt-2">
              {billing.error ? (billing.error instanceof Error ? billing.error.message : String(billing.error)) : ''}
            </p>
          </div>
        )}

        {checkoutError && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
            <p className="text-sm text-red-300/90">无法发起结账：{checkoutError}</p>
            <p className="text-xs text-white/40 mt-2">如果你刚刚取消了结账，可返回后重试。</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={cn(
                "rounded-2xl border p-6 bg-white/[0.02] border-white/[0.06] flex flex-col",
                t.highlight && "border-[#00E5FF]/35 bg-[#00E5FF]/[0.04]"
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">{t.name}</h2>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-white">{t.price}</div>
                  <div className="text-[11px] text-white/35">/month (placeholder)</div>
                </div>
              </div>
              <p className="text-sm text-white/45 mt-2">{t.note}</p>

              <ul className="mt-5 space-y-2 text-sm text-white/65">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {t.cta.kind === 'contact' ? (
                <Link
                  to="/contact"
                  className={cn(
                    "mt-6 inline-flex items-center justify-center h-10 rounded-xl text-sm font-medium transition-colors",
                    t.highlight
                      ? "bg-[#00E5FF] text-[#06060B] hover:bg-[#00E5FF]/90"
                      : "bg-white/[0.06] text-white hover:bg-white/[0.10] border border-white/[0.08]"
                  )}
                >
                  {t.cta.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => startCheckout(t.key)}
                  disabled={loadingKey === t.key}
                  className={cn(
                    "mt-6 inline-flex items-center justify-center h-10 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
                    t.highlight
                      ? "bg-[#00E5FF] text-[#06060B] hover:bg-[#00E5FF]/90"
                      : "bg-white/[0.06] text-white hover:bg-white/[0.10] border border-white/[0.08]"
                  )}
                >
                  {loadingKey === t.key ? '正在跳转结账…' : t.cta.label}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-white">Credit Packs</h2>
            <p className="text-xs text-white/35">
              购买积分包将跳转到 Creem 结账页面。若接口不可用，会显示“Billing 未接入”的错误提示。
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {packs.map((p) => (
              <div key={p.name} className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-sm text-white/70">{p.price}</p>
                </div>
                <p className="text-xs text-white/40 mt-1">{p.desc}</p>
                <button
                  type="button"
                  onClick={() => startCheckout(p.key)}
                  disabled={loadingKey === p.key}
                  className="text-xs text-[#00E5FF]/90 hover:text-[#00E5FF] inline-block mt-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingKey === p.key ? '正在跳转结账…' : '购买积分'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
