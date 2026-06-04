// @ts-nocheck
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, Activity, Clock, DollarSign, GitFork } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { fetchMetrics } from '@/lib/metricsApi';
import { cn } from '@/lib/utils';
import { useStrings } from '@/i18n/useStrings';

export default function Metrics() {
  const { t } = useStrings();
  const [range, setRange] = useState('7d');
  const RANGES = [
    { id: '7d', label: t('metricsRange7d') },
    { id: '30d', label: t('metricsRange30d') },
  ];

  const { data, isLoading, isError } = useQuery({
    queryKey: ['metrics', range],
    queryFn: () => fetchMetrics(range),
    staleTime: 60_000,
  });

  const series = data?.series || [];
  const reliability = data?.reliability || {};
  const sourceLabel =
    data?.source === 'engine' ? t('metricsSourceEngine') : t('metricsSourceLocal');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      data-testid="metrics-page"
      className="min-h-screen p-6 lg:p-8"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-6 h-6 text-[#00E5FF]" />
              <h1 className="text-2xl font-semibold text-white">{t('metricsTitle')}</h1>
            </div>
            <p className="text-sm text-white/40">
              {t('metricsSubtitle')} ({sourceLabel})
            </p>
          </div>
          <div className="flex gap-2">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs border transition-colors',
                  range === r.id
                    ? 'bg-[#00E5FF]/15 border-[#00E5FF]/30 text-[#00E5FF]'
                    : 'border-white/10 text-white/40 hover:text-white/60',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && <p className="text-sm text-white/40">{t('metricsLoading')}</p>}
        {isError && !data && (
          <p className="text-sm text-red-400/90">{t('metricsLoadError')}</p>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <KpiCard icon={Activity} label={t('metricsSuccessRate')} value={`${data?.success_rate ?? '—'}%`} />
          <KpiCard icon={Clock} label={t('metricsAvgLatency')} value={`${data?.avg_latency_ms ?? '—'} ms`} />
          <KpiCard icon={DollarSign} label={t('metricsTotalCost')} value={`$${data?.total_cost ?? '—'}`} />
          <KpiCard icon={GitFork} label={t('metricsForkWinRate')} value={`${data?.fork_win_rate ?? 0}%`} />
        </div>

        <ChartCard title={t('metricsSuccessTrend')} data={series} dataKey="success_rate" suffix="%" t={t} />
        <ChartCard title={t('metricsCostTrend')} data={series} dataKey="cost" prefix="$" t={t} />
        <ChartCard title={t('metricsLatencyTrend')} data={series} dataKey="latency_ms" suffix=" ms" t={t} />

        <div className="mt-8 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-sm font-medium text-white mb-4">{t('metricsReliability')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-white/40 text-xs">{t('metricsLongTaskSuccess')}</p>
              <p className="text-white font-mono mt-1">
                {reliability.long_task_success_rate ?? data?.success_rate ?? '—'}%
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs">{t('metricsTimeoutRate')}</p>
              <p className="text-white font-mono mt-1">{reliability.timeout_rate ?? '—'}%</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">{t('metricsAvgRetries')}</p>
              <p className="text-white font-mono mt-1">{reliability.retry_count_avg ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function KpiCard({ icon: Icon, label, value }) {
  return (
    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <Icon className="w-4 h-4 text-white/40 mb-2" />
      <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-semibold text-white mt-1">{value}</p>
    </div>
  );
}

function ChartCard({ title, data, dataKey, prefix = '', suffix = '', t }) {
  return (
    <div className="mb-6 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <h3 className="text-xs text-white/50 mb-4">{title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: '#13131A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontSize: 11,
              }}
            />
            <Line type="monotone" dataKey={dataKey} stroke="#00E5FF" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-white/25 mt-2">
        {t('metricsHoverHint')} {prefix}
        {dataKey}
        {suffix}
      </p>
    </div>
  );
}
