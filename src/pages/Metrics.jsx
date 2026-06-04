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

const RANGES = [
  { id: '7d', label: '近 7 天' },
  { id: '30d', label: '近 30 天' },
];

export default function Metrics() {
  const [range, setRange] = useState('7d');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['metrics', range],
    queryFn: () => fetchMetrics(range),
    staleTime: 60_000,
  });

  const series = data?.series || [];
  const reliability = data?.reliability || {};

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
              <h1 className="text-2xl font-semibold text-white">可观测</h1>
            </div>
            <p className="text-sm text-white/40">
              成功率、延迟、成本与可靠性（{data?.source === 'engine' ? 'Engine' : '本地估算'}）
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

        {isLoading && <p className="text-sm text-white/40">加载指标…</p>}
        {isError && !data && (
          <p className="text-sm text-red-400/90">无法加载指标，请确认 Engine 可达</p>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <KpiCard
            icon={Activity}
            label="成功率"
            value={`${data?.success_rate ?? '—'}%`}
          />
          <KpiCard icon={Clock} label="平均延迟" value={`${data?.avg_latency_ms ?? '—'} ms`} />
          <KpiCard icon={DollarSign} label="累计成本" value={`$${data?.total_cost ?? '—'}`} />
          <KpiCard icon={GitFork} label="Fork 胜率" value={`${data?.fork_win_rate ?? 0}%`} />
        </div>

        <ChartCard title="成功率趋势" data={series} dataKey="success_rate" suffix="%" />
        <ChartCard title="成本趋势" data={series} dataKey="cost" prefix="$" />
        <ChartCard title="延迟趋势" data={series} dataKey="latency_ms" suffix=" ms" />

        <div className="mt-8 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-sm font-medium text-white mb-4">可靠性（Phase 18）</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-white/40 text-xs">长任务成功率</p>
              <p className="text-white font-mono mt-1">
                {reliability.long_task_success_rate ?? data?.success_rate ?? '—'}%
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs">超时率</p>
              <p className="text-white font-mono mt-1">{reliability.timeout_rate ?? '—'}%</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">平均重试</p>
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

function ChartCard({ title, data, dataKey, prefix = '', suffix = '' }) {
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
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#00E5FF"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-white/25 mt-2">
        悬停查看每日 {prefix}
        {dataKey}
        {suffix}
      </p>
    </div>
  );
}
