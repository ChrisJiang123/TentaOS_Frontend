// @ts-nocheck
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, Loader2, Wrench } from 'lucide-react';
import useSEO from '@/lib/useSEO';
import { cn } from '@/lib/utils';
import { fetchAgents } from '@/lib/controlPlaneApi';

export default function Agents() {
  useSEO({ title: 'Agents — TentaOS', description: 'Execution units registered on the Engine control plane.' });

  const { data, isLoading } = useQuery({
    queryKey: ['control-plane-agents'],
    queryFn: fetchAgents,
    retry: 0,
    staleTime: 60_000,
  });

  const agents = data?.items || [];
  const isFallback = data?.fallback;

  return (
    <div data-testid="agents-page" className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Bot className="w-6 h-6 text-[#38BDF8]" />
            <h1 className="text-2xl font-semibold text-white tracking-tight">Agents</h1>
          </div>
          <p className="text-sm text-white/40 mt-1">Registered execution units from GET /api/agents</p>
          {isLoading && (
            <p className="text-[11px] text-white/25 mt-2 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading agents…
            </p>
          )}
          {isFallback && !isLoading && (
            <p className="text-[11px] text-amber-300/80 mt-2">
              Engine /api/agents unavailable — showing static registry (no live task metrics).
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <article
              key={agent.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-base font-medium text-white">{agent.name}</h2>
                  <p className="text-xs text-white/45 mt-0.5">{agent.role}</p>
                </div>
                <span
                  className={cn(
                    'text-[10px] uppercase px-2 py-0.5 rounded-full border',
                    agent.status === 'active'
                      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                      : 'border-white/10 text-white/40 bg-white/[0.04]',
                  )}
                >
                  {agent.status || 'unknown'}
                </span>
              </div>
              <InfoBlock label="Model preference" value={agent.model_preference} />
              <InfoBlock label="Strengths" value={(agent.strengths || []).join(' · ') || '—'} />
              {(agent.tools || []).length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] text-white/35 mb-1.5 flex items-center gap-1">
                    <Wrench className="w-3 h-3" /> Tools
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.tools.map((tool) => (
                      <span
                        key={tool}
                        className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-white/50"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>

        {!isLoading && agents.length === 0 && (
          <p className="text-center text-sm text-white/30 py-12">No agents returned from Engine.</p>
        )}
      </div>
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div className="mt-2">
      <p className="text-[10px] text-white/35">{label}</p>
      <p className="text-xs text-white/65">{value || '—'}</p>
    </div>
  );
}
