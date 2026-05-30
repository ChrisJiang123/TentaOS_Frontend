// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Workflow, ArrowRight, Shield, GitBranch } from 'lucide-react';
import useSEO from '@/lib/useSEO';
import { cn } from '@/lib/utils';
import { useEngineTasks } from '@/hooks/useEngineTasks';
import { engineTaskStore } from '@/lib/engineTaskStore';
import { buildResultByStepId } from '@/lib/engineTaskUtils';
import { fetchCortexInfo } from '@/lib/controlPlaneApi';
import { formatMs, formatCostShort } from '@/lib/formatNumbers';

function safeSteps(raw) {
  if (Array.isArray(raw?.pipeline?.steps)) return raw.pipeline.steps;
  if (Array.isArray(raw?.steps)) return raw.steps;
  return [];
}

function safeResults(raw) {
  return Array.isArray(raw?.results) ? raw.results : [];
}

function safeLayers(cortex) {
  return Array.isArray(cortex?.layers) ? cortex.layers : [];
}

function safeStringList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return [];
}

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

  const taskList = Array.isArray(tasks) ? tasks : [];
  const recentTasks = useMemo(() => taskList.slice(0, 12), [taskList]);

  useEffect(() => {
    if (!selectedId && recentTasks.length > 0) {
      const firstId = recentTasks[0]?.id;
      if (firstId) setSelectedId(String(firstId));
    }
  }, [recentTasks, selectedId]);

  const record = selectedId ? engineTaskStore.getTaskRecord(selectedId) : null;
  const raw = record?.raw && typeof record.raw === 'object' ? record.raw : {};
  const steps = safeSteps(raw);
  const results = safeResults(raw);
  const resultByStep = buildResultByStepId(results);
  const selectedTask = taskList.find((t) => String(t?.id) === String(selectedId));

  const cortexQuery = useQuery({
    queryKey: ['cortex-info'],
    queryFn: fetchCortexInfo,
    retry: 0,
    staleTime: 60_000,
  });

  const cortex = cortexQuery.data?.cortex && typeof cortexQuery.data.cortex === 'object'
    ? cortexQuery.data.cortex
    : {};
  const cortexFallback = Boolean(cortexQuery.data?.fallback);
  const showEmptyCta = recentTasks.length === 0 && !cortexQuery.isLoading;

  if (showEmptyCta) {
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

  const routingItems =
    safeStringList(cortex.routing).length > 0
      ? safeStringList(cortex.routing)
      : safeLayers(cortex).map((l) => (typeof l === 'object' ? l?.description : String(l))).filter(Boolean);

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
                {recentTasks.map((task) => {
                  const id = task?.id != null ? String(task.id) : '';
                  if (!id) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedId(id)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors',
                        selectedId === id
                          ? 'border-sky-400/30 bg-sky-500/[0.08] text-white'
                          : 'border-white/[0.06] bg-white/[0.02] text-white/60 hover:bg-white/[0.04]',
                      )}
                    >
                      <p className="font-medium truncate">{task.title || task.goal || id}</p>
                      <p className="text-[10px] text-white/35 mt-0.5 capitalize">{task.status || '—'}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <CortexProtocolPanel cortex={cortex} fallback={cortexFallback} />
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selectedTask ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-white/40">Prompt / goal</p>
                    <p className="text-sm text-white mt-1">{selectedTask.goal || selectedTask.title || '—'}</p>
                  </div>
                  {selectedId && (
                    <Link
                      to={`/TaskDetail?id=${encodeURIComponent(selectedId)}`}
                      className="text-xs text-sky-400 hover:text-sky-300"
                    >
                      Open TaskDetail →
                    </Link>
                  )}
                </div>

                {steps.length === 0 ? (
                  <p className="text-sm text-white/35">No pipeline steps returned yet.</p>
                ) : (
                  <div className="space-y-3">
                    {steps.map((step, i) => {
                      if (!step || typeof step !== 'object') return null;
                      const sid = String(step.step_id ?? step.id ?? i);
                      const result = resultByStep.get(sid);
                      return (
                        <div
                          key={`${sid}-${i}`}
                          className="flex gap-3 p-3 rounded-lg border border-white/[0.06] bg-black/20"
                        >
                          <div className="w-7 h-7 rounded-full bg-sky-500/15 text-sky-300 text-xs font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-2 text-[11px] text-white/45 mb-1">
                              <span className="font-mono">{sid}</span>
                              <span className="capitalize">{step.status || '—'}</span>
                              {step.model && <span>model: {String(step.model)}</span>}
                              {step.tool && <span>tool: {String(step.tool)}</span>}
                              {step.action && <span>action: {String(step.action)}</span>}
                            </div>
                            <p className="text-sm text-white/75">
                              {step.description || step.name || step.prompt || '—'}
                            </p>
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

                {raw.output != null && raw.output !== '' && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <p className="text-xs text-white/40 mb-2">Final output</p>
                    <pre className="text-xs text-white/65 whitespace-pre-wrap font-mono max-h-40 overflow-auto">
                      {typeof raw.output === 'string' ? raw.output : JSON.stringify(raw.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-white/35">
                Select a task from the list, or{' '}
                <Link to="/Dashboard" className="text-sky-400 hover:text-sky-300">
                  run one on the Dashboard
                </Link>
                .
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Panel icon={GitBranch} title="Routing notes" items={routingItems} />
              <Panel icon={Shield} title="Safety gates" items={safeStringList(cortex.safety)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CortexProtocolPanel({ cortex, fallback, className = '' }) {
  const layers = safeLayers(cortex);
  return (
    <div className={cn('rounded-xl border border-white/[0.06] bg-white/[0.02] p-4', className)}>
      <p className="text-xs font-medium text-white/50 mb-2">
        {cortex.protocol || 'Cortex Protocol'}
        {fallback && <span className="text-white/25 ml-2">(static)</span>}
      </p>
      <p className="text-xs text-white/45 leading-relaxed mb-3">
        {cortex.summary || 'Observable multi-step execution with approval gates.'}
      </p>
      {layers.slice(0, 4).map((layer, i) => {
        const name = typeof layer === 'object' && layer ? layer.name : `Layer ${i + 1}`;
        const desc = typeof layer === 'object' && layer ? layer.description : String(layer ?? '');
        return (
          <div key={`${name}-${i}`} className="text-[11px] text-white/40 mb-1.5">
            <span className="text-white/60">{name}:</span> {desc || '—'}
          </div>
        );
      })}
    </div>
  );
}

function Panel({ icon: Icon, title, items }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-amber-400/80" />
        <p className="text-xs font-medium text-white/50">{title}</p>
      </div>
      {list.length ? (
        <ul className="space-y-1.5 text-[11px] text-white/45">
          {list.map((item, i) => (
            <li key={i}>• {typeof item === 'string' ? item : item?.description || item?.name || '—'}</li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-white/25">No data from Engine yet.</p>
      )}
    </div>
  );
}
