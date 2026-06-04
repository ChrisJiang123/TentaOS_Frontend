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
import { safeArray, safeText, policyRows, safeStringList } from '@/lib/safeRender';
import SafeJsonBlock from '@/components/common/SafeJsonBlock';

function safeSteps(raw) {
  if (Array.isArray(raw?.pipeline?.steps)) return raw.pipeline.steps;
  if (Array.isArray(raw?.steps)) return raw.steps;
  return [];
}

function safeResults(raw) {
  return Array.isArray(raw?.results) ? raw.results : [];
}

function safeLayers(cortex) {
  return safeArray(cortex?.layers);
}

function normalizeCortexView(raw) {
  const cortex = raw && typeof raw === 'object' ? raw : {};
  const summaryRaw = cortex.summary;
  const summary =
    summaryRaw && typeof summaryRaw === 'object' && !Array.isArray(summaryRaw) ? summaryRaw : {};

  const recentPipelines =
    safeArray(cortex.recent_pipelines).length > 0
      ? safeArray(cortex.recent_pipelines)
      : safeArray(summary.recent_pipelines);

  const recentEvents =
    safeArray(cortex.recent_events).length > 0
      ? safeArray(cortex.recent_events)
      : safeArray(summary.recent_events);

  return {
    protocol: safeText(cortex.protocol, 'Cortex Protocol'),
    summary,
    summaryNote: safeText(summary.note),
    summaryStatus: safeText(summary.status),
    version: safeText(summary.version ?? cortex.version),
    enabled: summary.enabled ?? cortex.enabled,
    activeCapsules: summary.active_capsules ?? summary.active_tasks ?? cortex.active_capsules,
    committedCapsules: summary.committed_capsules ?? cortex.committed_capsules,
    recentEventCount: typeof summary.recent_events === 'number' ? summary.recent_events : null,
    recentPipelineCount: typeof summary.recent_pipelines === 'number' ? summary.recent_pipelines : null,
    recentPipelines,
    recentEvents,
    layers: safeLayers(cortex),
    routingPolicy: cortex.routing_policy ?? cortex.routing,
    safetyPolicy: cortex.safety_policy ?? cortex.safety,
    raw: cortex,
  };
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

  const taskList = safeArray(tasks);
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
  const resultByStepId = buildResultByStepId(results);
  const selectedTask = taskList.find((t) => String(t?.id) === String(selectedId));

  const cortexQuery = useQuery({
    queryKey: ['cortex-info'],
    queryFn: fetchCortexInfo,
    retry: 0,
    staleTime: 60_000,
  });

  const cortexRaw =
    cortexQuery.data?.cortex && typeof cortexQuery.data.cortex === 'object'
      ? cortexQuery.data.cortex
      : {};
  const cortexView = useMemo(() => normalizeCortexView(cortexRaw), [cortexRaw]);
  const cortexFallback = Boolean(cortexQuery.data?.fallback);
  const showEmptyCta = recentTasks.length === 0 && !cortexQuery.isLoading;

  const routingItems = useMemo(() => {
    const fromPolicy = safeStringList(cortexView.routingPolicy);
    if (fromPolicy.length) return fromPolicy;
    return safeLayers(cortexRaw)
      .map((layer) => (typeof layer === 'object' ? safeText(layer?.description) : safeText(layer)))
      .filter((s) => s && s !== '—');
  }, [cortexView.routingPolicy, cortexRaw]);

  const safetyItems = useMemo(() => safeStringList(cortexView.safetyPolicy), [cortexView.safetyPolicy]);

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
          <CortexProtocolPanel view={cortexView} fallback={cortexFallback} className="mt-10 text-left" />
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
                      <p className="font-medium truncate">{safeText(task.title || task.goal, id)}</p>
                      <p className="text-[10px] text-white/35 mt-0.5 capitalize">{safeText(task.status)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <CortexProtocolPanel view={cortexView} fallback={cortexFallback} />
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selectedTask ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-white/40">Prompt / goal</p>
                    <p className="text-sm text-white mt-1">{safeText(selectedTask.goal || selectedTask.title)}</p>
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
                      const result = resultByStepId.get(sid);
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
                              <span className="capitalize">{safeText(step.status)}</span>
                              {step.model != null && <span>model: {safeText(step.model)}</span>}
                              {step.tool != null && <span>tool: {safeText(step.tool)}</span>}
                              {step.action != null && <span>action: {safeText(step.action)}</span>}
                            </div>
                            <p className="text-sm text-white/75">
                              {safeText(step.description || step.name || step.prompt)}
                            </p>
                            {result && (
                              <p className="text-xs text-emerald-300/70 mt-2 line-clamp-3">
                                {typeof result.output === 'string'
                                  ? result.output
                                  : safeText(result.message || result.summary, 'Step completed')}
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
              <PolicyPanel icon={GitBranch} title="Routing policy" policy={cortexView.routingPolicy} items={routingItems} />
              <PolicyPanel icon={Shield} title="Safety policy" policy={cortexView.safetyPolicy} items={safetyItems} />
            </div>

            {cortexView.recentPipelines.length > 0 && (
              <RecentPipelinesPanel pipelines={cortexView.recentPipelines} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CortexProtocolPanel({ view, fallback, className = '' }) {
  const summary = view?.summary ?? {};
  const hasSummaryObject = summary && typeof summary === 'object' && Object.keys(summary).length > 0;
  const summaryIsString = typeof view?.raw?.summary === 'string';
  const layers = view?.layers ?? [];

  return (
    <div className={cn('rounded-xl border border-white/[0.06] bg-white/[0.02] p-4', className)}>
      <p className="text-xs font-medium text-white/50 mb-2">
        {view?.protocol || 'Cortex Protocol'}
        {fallback && <span className="text-white/25 ml-2">(static)</span>}
      </p>

      {summaryIsString ? (
        <p className="text-xs text-white/45 leading-relaxed mb-3">{view.raw.summary}</p>
      ) : hasSummaryObject ? (
        <CortexSummaryFields view={view} className="mb-3" />
      ) : (
        <p className="text-xs text-white/45 leading-relaxed mb-3">
          Observable multi-step execution with approval gates.
        </p>
      )}

      {layers.slice(0, 4).map((layer, i) => {
        const name = typeof layer === 'object' && layer ? safeText(layer.name, `Layer ${i + 1}`) : `Layer ${i + 1}`;
        const desc =
          typeof layer === 'object' && layer ? safeText(layer.description) : safeText(layer);
        return (
          <div key={`${name}-${i}`} className="text-[11px] text-white/40 mb-1.5">
            <span className="text-white/60">{name}:</span> {desc}
          </div>
        );
      })}

      {import.meta.env.DEV && <SafeJsonBlock value={view?.raw} className="mt-3" />}
    </div>
  );
}

function CortexSummaryFields({ view, className = '' }) {
  const enabledLabel =
    view.enabled === true ? 'Yes' : view.enabled === false ? 'No' : safeText(view.enabled);

  return (
    <dl className={cn('grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[11px]', className)}>
      {view.version !== '—' && (
        <>
          <dt className="text-white/35">Version</dt>
          <dd className="text-white/60">{view.version}</dd>
        </>
      )}
      {view.enabled != null && (
        <>
          <dt className="text-white/35">Enabled</dt>
          <dd className="text-white/60">{enabledLabel}</dd>
        </>
      )}
      {view.summaryStatus !== '—' && (
        <>
          <dt className="text-white/35">Status</dt>
          <dd className="text-white/60">{view.summaryStatus}</dd>
        </>
      )}
      {view.activeCapsules != null && (
        <>
          <dt className="text-white/35">Active capsules</dt>
          <dd className="text-white/60">{safeText(view.activeCapsules)}</dd>
        </>
      )}
      {view.committedCapsules != null && (
        <>
          <dt className="text-white/35">Committed capsules</dt>
          <dd className="text-white/60">{safeText(view.committedCapsules)}</dd>
        </>
      )}
      {view.recentEventCount != null && (
        <>
          <dt className="text-white/35">Recent events</dt>
          <dd className="text-white/60">{view.recentEventCount}</dd>
        </>
      )}
      {view.recentPipelineCount != null && (
        <>
          <dt className="text-white/35">Recent pipelines</dt>
          <dd className="text-white/60">{view.recentPipelineCount}</dd>
        </>
      )}
      {view.summaryNote !== '—' && (
        <>
          <dt className="text-white/35">Note</dt>
          <dd className="text-white/60 col-span-1">{view.summaryNote}</dd>
        </>
      )}
    </dl>
  );
}

function PolicyPanel({ icon: Icon, title, policy, items }) {
  const rows = useMemo(() => policyRows(policy), [policy]);
  const list = safeArray(items).filter(Boolean);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-amber-400/80" />
        <p className="text-xs font-medium text-white/50">{title}</p>
      </div>

      {rows.length > 0 && typeof policy === 'object' && !Array.isArray(policy) ? (
        <dl className="space-y-1.5 mb-3">
          {rows.map(({ key, value }) => (
            <div key={key} className="text-[11px]">
              <span className="text-white/35 font-mono">{key.replace(/_/g, ' ')}: </span>
              <span className="text-white/55">{value}</span>
            </div>
          ))}
        </dl>
      ) : null}

      {list.length ? (
        <ul className="space-y-1.5 text-[11px] text-white/45">
          {list.map((item, i) => (
            <li key={i}>• {safeText(item)}</li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <p className="text-[11px] text-white/25">No data from Engine yet.</p>
      ) : null}
    </div>
  );
}

function RecentPipelinesPanel({ pipelines }) {
  const list = safeArray(pipelines);
  if (!list.length) return null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-xs font-medium text-white/50 mb-3">Recent pipelines (Engine)</p>
      <div className="space-y-2 max-h-64 overflow-auto">
        {list.map((pipe, i) => {
          if (!pipe || typeof pipe !== 'object') return null;
          const id = safeText(pipe.task_id || pipe.pipeline_id, `pipeline-${i}`);
          return (
            <div key={id} className="py-2 border-b border-white/[0.04] last:border-0">
              <p className="text-[11px] text-white/70 truncate">{safeText(pipe.prompt)}</p>
              <p className="text-[10px] text-white/35 mt-0.5">
                {safeText(pipe.status)} · {safeText(pipe.step_count)} steps
                {pipe.completed_at ? ` · ${safeText(pipe.completed_at)}` : ''}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
