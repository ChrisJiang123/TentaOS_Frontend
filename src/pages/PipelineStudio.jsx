// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Workflow, ArrowRight, Shield, GitBranch, Loader2 } from 'lucide-react';
import useSEO from '@/lib/useSEO';
import { cn } from '@/lib/utils';
import { useEngineTasks } from '@/hooks/useEngineTasks';
import { engineTaskStore } from '@/lib/engineTaskStore';
import { buildResultByStepId } from '@/lib/engineTaskUtils';
import { fetchCortexInfo } from '@/lib/controlPlaneApi';
import { formatMs, formatCostShort } from '@/lib/formatNumbers';

export default function PipelineStudio() {
  const { tasks } = useEngineTasks();
  const [selectedId, setSelectedId] = useState('');

  useSEO({
    title: 'Cortex Pipeline — TentaOS',
    description: 'Observe prompt → steps → results from recent Engine tasks.',
  });

  useEffect(() => {
    engineTaskStore.refreshList().catch(() => {});
  }, []);

  const recentTasks = useMemo(() => tasks.slice(0, 12), [tasks]);

  useEffect(() => {
    if (!selectedId && recentTasks.length) {
      setSelectedId(recentTasks[0].id);
    }
  }, [recentTasks, selectedId]);

  const record = selectedId ? engineTaskStore.getTaskRecord(selectedId) : null;
  const raw = record?.raw || {};
  const steps = raw.pipeline?.steps || [];
  const resultByStep = buildResultByStepId(raw.results);
  const selectedTask = tasks.find((t) => t.id === selectedId);

  const cortexQuery = useQuery({
    queryKey: ['cortex-info'],
    queryFn: fetchCortexInfo,
    retry: 0,
    staleTime: 60_000,
  });

  const cortex = cortexQuery.data?.cortex || {};
  const cortexFallback = cortexQuery.data?.fallback;

  if (!recentTasks.length && !cortexQuery.isLoading) {
    return (
      <div data-testid="pipeline-studio-page" className="min-h-screen p-6 lg:p-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <Workflow className="w-12 h-12 mx-auto mb-4 text-white/15" />
          <h1 className="text-xl font-semibold text-white mb-2">Cortex Pipeline</h1>
          <p className="text-sm text-white/45 mb-6">
            Run a task from the Dashboard to see prompt → steps → model/tool → result here.
          </p>
          <Link
            to="/Dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#00E5FF] text-[#06060B] text-sm font-medium"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <CortexProtocolPanel cortex={cortex} fallback={cortexFallback} className="mt-10 text-left" />
        </div>
      </div>
    );
  }

  return (
    <div data-testid="pipeline-studio-page" className="min-h-screen p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Workflow className="w-6 h-6 text-sky-400" />
            <h1 className="text-2xl font-semibold text-white tracking-tight">Cortex Pipeline</h1>
          </div>
          <p className="text-sm text-white/40 mt-1">
            Recent Engine tasks — prompt, planned steps, tool/model actions, and results.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs font-medium text-white/50 mb-3">Recent tasks</p>
              <div className="space-y-2 max-h-[420px] overflow-auto">
                {recentTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedId(task.id)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors',
                      selectedId === task.id
                        ? 'border-sky-400/30 bg-sky-500/[0.08] text-white'
                        : 'border-white/[0.06] bg-white/[0.02] text-white/60 hover:bg-white/[0.04]',
                    )}
                  >
                    <p className="font-medium truncate">{task.title || task.goal || task.id}</p>
                    <p className="text-[10px] text-white/35 mt-0.5 capitalize">{task.status}</p>
                  </button>
                ))}
              </div>
            </div>
            <CortexProtocolPanel cortex={cortex} fallback={cortexFallback} />
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selectedTask && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-white/40">Prompt / goal</p>
                    <p className="text-sm text-white mt-1">{selectedTask.goal || selectedTask.title}</p>
                  </div>
                  <Link
                    to={`/TaskDetail?id=${encodeURIComponent(selectedId)}`}
                    className="text-xs text-sky-400 hover:text-sky-300"
                  >
                    Open TaskDetail →
                  </Link>
                </div>

                {steps.length === 0 ? (
                  <p className="text-sm text-white/35">No pipeline.steps on this task yet.</p>
                ) : (
                  <div className="space-y-3">
                    {steps.map((step, i) => {
                      const sid = String(step.step_id ?? step.id ?? i);
                      const result = resultByStep.get(sid);
                      return (
                        <div
                          key={sid}
                          className="flex gap-3 p-3 rounded-lg border border-white/[0.06] bg-black/20"
                        >
                          <div className="w-7 h-7 rounded-full bg-sky-500/15 text-sky-300 text-xs font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-2 text-[11px] text-white/45 mb-1">
                              <span className="font-mono">{sid}</span>
                              <span className="capitalize">{step.status || '—'}</span>
                              {step.model && <span>model: {step.model}</span>}
                              {step.tool && <span>tool: {step.tool}</span>}
                              {step.action && <span>action: {step.action}</span>}
                            </div>
                            <p className="text-sm text-white/75">{step.description || step.name || step.prompt || '—'}</p>
                            {result && (
                              <p className="text-xs text-emerald-300/70 mt-2 line-clamp-3">
                                {typeof result.output === 'string'
                                  ? result.output
                                  : result.message || result.summary || 'Step completed'}
                              </p>
                            )}
                            <div className="flex gap-3 mt-2 text-[10px] text-white/30">
                              <span>{formatMs(result?.duration_ms ?? step.duration_ms)}</span>
                              {(result?.cost != null || result?.cost_usd != null) && (
                                <span>{formatCostShort(result?.cost ?? result?.cost_usd, 4)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {raw.output && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <p className="text-xs text-white/40 mb-2">Final output</p>
                    <pre className="text-xs text-white/65 whitespace-pre-wrap font-mono max-h-40 overflow-auto">
                      {typeof raw.output === 'string' ? raw.output : JSON.stringify(raw.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Panel icon={GitBranch} title="Routing notes" items={cortex.routing || cortex.layers?.map((l) => l.description) || []} />
              <Panel icon={Shield} title="Safety gates" items={cortex.safety || []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CortexProtocolPanel({ cortex, fallback, className = '' }) {
  return (
    <div className={cn('rounded-xl border border-white/[0.06] bg-white/[0.02] p-4', className)}>
      <p className="text-xs font-medium text-white/50 mb-2">
        {cortex.protocol || 'Cortex Protocol'}
        {fallback && <span className="text-white/25 ml-2">(static)</span>}
      </p>
      <p className="text-xs text-white/45 leading-relaxed mb-3">{cortex.summary || 'Observable multi-step execution with approval gates.'}</p>
      {(cortex.layers || []).slice(0, 4).map((layer) => (
        <div key={layer.name} className="text-[11px] text-white/40 mb-1.5">
          <span className="text-white/60">{layer.name}:</span> {layer.description}
        </div>
      ))}
    </div>
  );
}

function Panel({ icon: Icon, title, items }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-amber-400/80" />
        <p className="text-xs font-medium text-white/50">{title}</p>
      </div>
      {list.length ? (
        <ul className="space-y-1.5 text-[11px] text-white/45">
          {list.map((item, i) => (
            <li key={i}>• {typeof item === 'string' ? item : item.description || item.name}</li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-white/25">No data from Engine yet.</p>
      )}
    </div>
  );
}
