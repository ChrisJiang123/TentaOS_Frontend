// @ts-nocheck
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cpu, Loader2 } from 'lucide-react';
import useSEO from '@/lib/useSEO';
import { cn } from '@/lib/utils';
import { fetchModels } from '@/lib/controlPlaneApi';

export default function Models() {
  useSEO({ title: 'Models — TentaOS', description: 'Model routing table from Engine control plane.' });

  const { data, isLoading } = useQuery({
    queryKey: ['control-plane-models'],
    queryFn: fetchModels,
    retry: 0,
    staleTime: 60_000,
  });

  const models = Array.isArray(data?.items) ? data.items.filter((m) => m && m.id) : [];
  const isFallback = data?.fallback;

  return (
    <div data-testid="models-page" className="min-h-screen p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Cpu className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-semibold text-white tracking-tight">Model Routing</h1>
          </div>
          <p className="text-sm text-white/40 mt-1">
            Routing metadata from GET /api/models — no live usage metrics on this page.
          </p>
          {isLoading && (
            <p className="text-[11px] text-white/25 mt-2 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading models…
            </p>
          )}
          {isFallback && !isLoading && (
            <p className="text-[11px] text-amber-300/80 mt-2">
              Engine /api/models unavailable — static routing reference only.
            </p>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] text-white/40 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Deploy</th>
                <th className="px-4 py-3 font-medium">Best for</th>
                <th className="px-4 py-3 font-medium">Tiers</th>
                <th className="px-4 py-3 font-medium">Routing</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="text-white/85 font-medium">{m.name}</p>
                    <p className="text-[10px] text-white/30">{m.is_active ? 'active route' : 'inactive'}</p>
                  </td>
                  <td className="px-4 py-3 text-white/55">{m.provider}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded capitalize', tierClass(m.deployment))}>
                      {m.deployment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/50 max-w-[180px]">
                    {(m.best_for || []).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-white/45 whitespace-nowrap">
                    speed: {m.speed_tier}
                    <br />
                    cost: {m.cost_tier}
                    <br />
                    ctx: {m.context_tier}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/45 max-w-[200px]">{m.routing_notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && models.length === 0 && (
          <p className="text-center text-sm text-white/30 py-12">No models returned from Engine.</p>
        )}
      </div>
    </div>
  );
}

function tierClass(deployment) {
  const d = String(deployment || '').toLowerCase();
  if (d === 'local') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  if (d === 'cloud') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
}
