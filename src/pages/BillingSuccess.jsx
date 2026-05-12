// @ts-nocheck
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useSEO from '@/lib/useSEO';
import LandingFooter from '@/components/landing/LandingFooter';
import { useQuery } from '@tanstack/react-query';
import { fetchBillingMe } from '@/lib/billingAccountApi';

function useQueryParams() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function BillingSuccess() {
  useSEO({
    title: 'Payment received — TentaOS',
    description: 'We are confirming your subscription and credits.',
    keywords: 'TentaOS billing success, payment confirmation',
  });

  const qp = useQueryParams();
  const checkout_id = qp.get('checkout_id') || qp.get('checkoutId');
  const order_id = qp.get('order_id') || qp.get('orderId');
  const customer_id = qp.get('customer_id') || qp.get('customerId');
  const product_id = qp.get('product_id') || qp.get('productId');
  const request_id = qp.get('request_id') || qp.get('requestId');

  const billing = useQuery({
    queryKey: ['billing-me', 'success-refresh'],
    queryFn: () => fetchBillingMe({ timeoutMs: 12_000 }),
    retry: 1,
    refetchInterval: 5000,
    staleTime: 0,
  });

  useEffect(() => {
    const t = setTimeout(() => billing.refetch(), 800);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#06060B] text-white/85">
      <header className="border-b border-white/[0.06] px-6 py-5">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link to="/Landing" className="text-sm text-[#00E5FF]/90 hover:text-[#00E5FF] transition-colors">
            ← Back to TentaOS
          </Link>
          <div className="flex items-center gap-4 text-xs text-white/35">
            <Link to="/billing" className="hover:text-white/55">Billing</Link>
            <span className="text-white/15">·</span>
            <Link to="/pricing" className="hover:text-white/55">Pricing</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 pb-20">
        <p className="text-[11px] uppercase tracking-wider text-white/35 mb-2">Billing</p>
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Payment received</h1>
        <p className="text-sm text-white/55 mb-8">
          我们正在确认你的订阅/积分状态。由于支付提供商 Webhook 处理可能需要几秒钟，请稍后刷新 Billing 页面查看最新状态。
        </p>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-xs text-white/50 space-y-2">
            <Row k="checkout_id" v={checkout_id} />
            <Row k="order_id" v={order_id} />
            <Row k="customer_id" v={customer_id} />
            <Row k="product_id" v={product_id} />
            <Row k="request_id" v={request_id} />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-black/30 p-5">
          <p className="text-xs text-white/50 mb-3">订阅状态刷新</p>
          {billing.isLoading && <p className="text-sm text-white/60">正在从 /api/billing/me 刷新…</p>}
          {billing.isError && (
            <p className="text-sm text-amber-400/90">
              暂时无法刷新计费状态：{billing.error instanceof Error ? billing.error.message : String(billing.error)}
              <span className="block text-xs text-white/40 mt-1">这不代表付款失败，可能只是计费服务暂不可用。</span>
            </p>
          )}
          {billing.data && (
            <div className="text-sm text-white/65 space-y-1">
              <p>
                当前方案：<span className="text-white">{String(billing.data.plan ?? billing.data.tier ?? '—')}</span>
              </p>
              <p>
                状态：<span className="text-white">{String(billing.data.status ?? '—')}</span>
              </p>
              {billing.data.credits_balance != null && (
                <p>
                  余额：<span className="text-white">{Number(billing.data.credits_balance || 0).toLocaleString()} credits</span>
                </p>
              )}
              <p className="text-xs text-white/35 mt-2">
                提示：前端不会直接授予积分或标记“已付款成功”，一切以后台确认状态为准。
              </p>
            </div>
          )}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/35">{k}</span>
      <span className="text-white/70 font-mono text-[11px] break-all text-right">{v || '—'}</span>
    </div>
  );
}

