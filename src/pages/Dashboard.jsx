// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueries, useMutation } from '@tanstack/react-query';
import StatsBar from '../components/dashboard/StatsBar';
import TaskCard from '../components/dashboard/TaskCard';
import AgentSidebar from '../components/dashboard/AgentSidebar';
import WelcomeGuide from '../components/dashboard/WelcomeGuide';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import SearchBar from '../components/dashboard/SearchBar';
import QuickActions from '../components/dashboard/QuickActions';
import PipelineChat from '../components/pipeline/PipelineChat';
import LivePipelineCard from '../components/dashboard/LivePipelineCard';
import CostDashboard from '../components/dashboard/CostDashboard';
import TemplateSelector from '../components/dashboard/TemplateSelector';
import StepStream from '../components/dashboard/StepStream';
import EngineTaskMetrics from '../components/dashboard/EngineTaskMetrics';
import { useLanguage } from '@/lib/LanguageContext';
import engineClient from '@/lib/engineClient';
import ConnectionIndicator from '../components/engine/ConnectionIndicator';
import BrowserPreview from '../components/engine/BrowserPreview';
import TerminalOutput from '../components/engine/TerminalOutput';
import ApprovalDialog from '../components/engine/ApprovalDialog';
import EmergencyStop from '../components/engine/EmergencyStop';
import {
  normalizeEngineTask,
  mapEngineStatus,
  isActiveEngineStatus,
  parseTaskIdFromSubmitResponse,
} from '@/lib/engineTaskUtils';
import { getDashboardPanelBundle } from '@/lib/tentaosDashboardApi';

const ENGINE_TASKS_STORAGE_KEY = 'tentaos-engine-tasks-v1';

function loadPersistedTasks() {
  if (typeof window === 'undefined') return { ids: [], meta: {} };
  try {
    const raw = localStorage.getItem(ENGINE_TASKS_STORAGE_KEY);
    if (!raw) return { ids: [], meta: {} };
    const o = JSON.parse(raw);
    return { ids: Array.isArray(o.ids) ? o.ids : [], meta: o.meta && typeof o.meta === 'object' ? o.meta : {} };
  } catch {
    return { ids: [], meta: {} };
  }
}

export default function Dashboard() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const persisted = loadPersistedTasks();
  const [trackedIds, setTrackedIds] = useState(persisted.ids);
  const [taskMeta, setTaskMeta] = useState(persisted.meta);
  const [approvalMode, setApprovalMode] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      ENGINE_TASKS_STORAGE_KEY,
      JSON.stringify({ ids: trackedIds, meta: taskMeta }),
    );
  }, [trackedIds, taskMeta]);

  const registerEngineTask = useCallback((taskId, goal, pipeline = null) => {
    const created_date = new Date().toISOString();
    setTrackedIds((prev) => [taskId, ...prev.filter((id) => id !== taskId)].slice(0, 50));
    setTaskMeta((prev) => ({
      ...prev,
      [taskId]: { goal, created_date, pipeline },
    }));
  }, []);

  useEffect(() => {
    engineClient.connect();
    return () => engineClient.disconnect();
  }, []);

  useEffect(() => {
    return engineClient.on('task_started', (d) => {
      const tid = d.task_id || d.taskId;
      if (!tid) return;
      const msg = d.message || d.input || d.goal || '';
      setTrackedIds((prev) => {
        if (prev.includes(tid)) return prev;
        return [tid, ...prev].slice(0, 50);
      });
      setTaskMeta((prev) => {
        if (prev[tid]) return prev;
        return {
          ...prev,
          [tid]: { goal: msg, created_date: new Date().toISOString(), pipeline: null },
        };
      });
    });
  }, []);

  const { data: health, isLoading: healthLoading, isError: healthQueryError, error: healthError } = useQuery({
    queryKey: ['engine-health'],
    queryFn: () => engineClient.getHealth(),
    refetchInterval: 10_000,
    retry: 1,
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['dashboard-panel'],
    queryFn: async () => {
      const b = await getDashboardPanelBundle();
      const errors = [b.overview.error, b.cortex.error, b.tentacles.error, b.traces.error, b.cost.error].filter(Boolean);
      const allEngine = [b.overview, b.cortex, b.tentacles, b.traces, b.cost].every((x) => x.source === 'engine');
      return {
        token_saved_pct: b.overview.data.token_saved_pct,
        cost_saved_pct: b.overview.data.cost_saved_pct,
        active_tasks: b.overview.data.active_tasks,
        unsafe_actions_blocked: b.overview.data.unsafe_actions_blocked,
        avg_reflex_latency_ms: b.overview.data.avg_reflex_latency_ms,
        cortex_state: b.cortex.data,
        tentacle_runtime: b.tentacles.data,
        recent_traces: b.traces.data.traces,
        cost_series_7d: b.cost.data.series,
        _source: allEngine ? 'engine' : 'mock',
        _errors: errors,
      };
    },
    refetchInterval: 20_000,
  });
  const overviewErrors = overview?._errors ?? [];

  const taskQueries = useQueries({
    queries: trackedIds.map((id) => ({
      queryKey: ['engine-task', id],
      queryFn: () => engineClient.getTask(id),
      enabled: Boolean(id),
      refetchInterval: (q) => {
        const data = q.state.data;
        if (!data) return 2000;
        const st = mapEngineStatus(data.status);
        return isActiveEngineStatus(st) ? 2000 : false;
      },
    })),
  });

  const tasks = trackedIds
    .map((id, i) => normalizeEngineTask(taskQueries[i]?.data, { ...taskMeta[id], taskId: id }))
    .filter(Boolean);

  const agents = [];

  const pendingApprovalsCount = health?.pending_approvals ?? 0;
  const syntheticApprovals = Array.from({ length: pendingApprovalsCount }, (_, i) => ({
    id: `engine-pending-${i}`,
    status: 'pending',
  }));

  const templateLaunch = useMutation({
    mutationFn: async ({ goal, pipeline }) => {
      const res = await engineClient.submitTask(goal);
      return { res, goal, pipeline };
    },
    onSuccess: ({ res, goal, pipeline }) => {
      const tid = parseTaskIdFromSubmitResponse(res);
      if (tid) registerEngineTask(tid, goal, pipeline);
      toast({
        title: '已提交到 TentaOS Engine',
        description: tid ? `任务 ID: ${tid}` : '请查看任务列表',
      });
    },
    onError: (e) => {
      toast({
        title: '模板提交失败',
        description: e instanceof Error ? e.message : String(e),
      });
    },
  });

  const filteredTasks = tasks.filter((task) => {
    const statusMatch =
      filter === 'all'
        ? true
        : filter === 'active'
          ? ['running', 'planning', 'paused', 'awaiting_approval', 'queued'].includes(task.status)
          : filter === 'completed'
            ? task.status === 'completed'
            : filter === 'failed'
              ? task.status === 'failed' || task.status === 'cancelled'
              : true;
    const searchMatch =
      !search ||
      task.title?.toLowerCase().includes(search.toLowerCase()) ||
      task.goal?.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  const failedCount = tasks.filter((task) => task.status === 'failed' || task.status === 'cancelled').length;

  return (
    <div data-testid="dashboard-page" className="min-h-screen p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              {user?.full_name ? `${t('welcomeBack')}, ${user.full_name.split(' ')[0]}` : t('dashboard')}
            </h1>
            <p className="text-sm text-white/40 mt-1">{t('dashboardSubtitle')}</p>
            {healthQueryError && (
              <p className="text-[11px] text-amber-400/90 mt-1" data-testid="dashboard-health-error">
                引擎健康检查失败：{healthError instanceof Error ? healthError.message : String(healthError)}（仪表盘其余数据仍可用）
              </p>
            )}
            {!healthQueryError && healthLoading && (
              <p className="text-[11px] text-white/30 mt-1" data-testid="dashboard-health-loading">
                正在拉取引擎健康…
              </p>
            )}
            {!healthQueryError && health && (
              <p className="text-[11px] text-white/30 mt-1">
                引擎健康：{health.status ?? '—'}
                {health.browser != null && ` · 浏览器 ${String(health.browser)}`}
                {health.active_tasks != null && ` · 进行中 ${health.active_tasks}`}
                {health.pending_approvals != null && ` · 待审批 ${health.pending_approvals}`}
                {health.ws_clients != null && ` · ws_clients ${health.ws_clients}`}
              </p>
            )}
          </div>
          <ConnectionIndicator />
        </div>

        {/* Cortex overview (API if available, else mock) */}
        <div
          className="mb-6"
          data-testid="dashboard-overview"
          data-overview-loading={overviewLoading ? 'true' : 'false'}
          data-overview-source={overview?._source || ''}
        >
          {overviewLoading && (
            <p className="text-[11px] text-white/35 mb-2" data-testid="dashboard-overview-loading">
              Loading overview…
            </p>
          )}
          {overviewErrors.length > 0 && (
            <p className="text-[11px] text-red-400/90 mb-2" data-testid="dashboard-overview-error">
              {overviewErrors.slice(0, 3).join(' · ')}
              {overviewErrors.length > 3 ? ` (+${overviewErrors.length - 3} more)` : ''}
            </p>
          )}
          {overview?._source === 'mock' && !overviewLoading && (
            <p className="text-[11px] text-white/30 mb-2" data-testid="dashboard-overview-fallback">
              Using mock overview (Engine <code className="text-white/50">GET /api/dashboard/overview</code> unavailable or blocked).
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div
              className="bg-[#151E2E] border border-[rgba(148,163,184,0.16)] rounded-2xl p-4"
              data-testid="dashboard-kpi-token-saved"
            >
              <p className="text-xs text-white/40">Token Saved</p>
              <p className="text-2xl font-semibold text-[#34D399] mt-1">
                {overviewLoading ? '—' : `${overview?.token_saved_pct ?? 60}%`}
              </p>
              <p className="text-[11px] text-white/30 mt-1">Cortex compression ratio</p>
            </div>
            <div
              className="bg-[#151E2E] border border-[rgba(148,163,184,0.16)] rounded-2xl p-4"
              data-testid="dashboard-kpi-cost-saved"
            >
              <p className="text-xs text-white/40">Cost Saved</p>
              <p className="text-2xl font-semibold text-[#34D399] mt-1">
                {overviewLoading ? '—' : `${overview?.cost_saved_pct ?? 60}%`}
              </p>
              <p className="text-[11px] text-white/30 mt-1">Estimated vs baseline</p>
            </div>
            <div
              className="bg-[#151E2E] border border-[rgba(148,163,184,0.16)] rounded-2xl p-4"
              data-testid="dashboard-kpi-unsafe-blocked"
            >
              <p className="text-xs text-white/40">Unsafe Actions Blocked</p>
              <p className="text-2xl font-semibold text-[#FBBF24] mt-1">
                {overviewLoading ? '—' : (overview?.unsafe_actions_blocked ?? 0)}
              </p>
              <p className="text-[11px] text-white/30 mt-1">Human approval / coherence gate</p>
            </div>
            <div
              className="bg-[#151E2E] border border-[rgba(148,163,184,0.16)] rounded-2xl p-4"
              data-testid="dashboard-kpi-latency"
            >
              <p className="text-xs text-white/40">Average Reflex Latency</p>
              <p className="text-2xl font-semibold text-[#38BDF8] mt-1">
                {overviewLoading ? '—' : `${overview?.avg_reflex_latency_ms ?? 180}ms`}
              </p>
              <p className="text-[11px] text-white/30 mt-1">Per transition capsule</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="dashboard-cortex-tentacle">
            <div
              className="bg-[#151E2E] border border-[rgba(148,163,184,0.16)] rounded-2xl p-4"
              data-testid="dashboard-cortex-state"
            >
              <p className="text-xs text-white/40">Cortex State</p>
              <p className="text-sm text-white/85 mt-2">
                <span className="text-white/50">Version</span>{' '}
                <span data-testid="dashboard-cortex-version">{overview?.cortex_state?.version ?? '—'}</span>
                <span className="text-white/30 mx-2">·</span>
                <span className="text-white/50">Status</span>{' '}
                <span data-testid="dashboard-cortex-status">{overview?.cortex_state?.status ?? '—'}</span>
                <span className="text-white/30 mx-2">·</span>
                <span className="text-white/50">Risk</span>{' '}
                <span data-testid="dashboard-cortex-risk">{overview?.cortex_state?.risk ?? '—'}</span>
              </p>
              <p className="text-[11px] text-white/35 mt-2">
                Active tasks:{' '}
                <span data-testid="dashboard-active-tasks">{overviewLoading ? '—' : (overview?.active_tasks ?? '—')}</span>
              </p>
            </div>
            <div
              className="bg-[#151E2E] border border-[rgba(148,163,184,0.16)] rounded-2xl p-4"
              data-testid="dashboard-tentacle-runtime"
            >
              <p className="text-xs text-white/40">Tentacle Runtime</p>
              <p className="text-sm text-white/85 mt-2">
                <span className="text-white/50">WS clients</span>{' '}
                <span data-testid="dashboard-tentacle-ws">{overview?.tentacle_runtime?.ws_clients ?? '—'}</span>
                <span className="text-white/30 mx-2">·</span>
                <span className="text-white/50">Pending approvals</span>{' '}
                <span data-testid="dashboard-tentacle-approvals">{overview?.tentacle_runtime?.pending_approvals ?? '—'}</span>
              </p>
              <p className="text-[11px] text-white/35 mt-2">
                Last heartbeat:{' '}
                <span data-testid="dashboard-tentacle-heartbeat">
                  {overviewLoading
                    ? '—'
                    : overview?.tentacle_runtime?.last_heartbeat_ms_ago != null
                      ? `${overview.tentacle_runtime.last_heartbeat_ms_ago} ms ago`
                      : '—'}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
            <div
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
              data-testid="dashboard-trace-timeline"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white/70">Recent Trace Timeline</p>
                <p className="text-[11px] text-white/30">
                  {overview?._source === 'engine' ? 'Engine' : 'Mock'}
                  {overviewErrors.length ? ' · Error' : ''}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                {(overview?.recent_traces || []).slice(0, 6).map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <span
                      className={
                        t.severity === 'success'
                          ? 'w-2 h-2 rounded-full bg-emerald-400'
                          : t.severity === 'warning'
                            ? 'w-2 h-2 rounded-full bg-amber-400'
                            : t.severity === 'critical'
                              ? 'w-2 h-2 rounded-full bg-red-400'
                              : 'w-2 h-2 rounded-full bg-white/30'
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 truncate">{t.label}</p>
                      <p className="text-[10px] text-white/30">
                        {new Date(t.ts).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {(overview?.recent_traces || []).length === 0 && (
                  <p className="text-xs text-white/30">No traces yet.</p>
                )}
              </div>
            </div>

            <div
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
              data-testid="dashboard-cost-chart"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white/70">Cost Saving (last 7 days)</p>
                <p className="text-[11px] text-white/30">mini chart</p>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-2 items-end h-24">
                {(overview?.cost_series_7d || []).slice(0, 7).map((d) => {
                  const spent = Number(d.spent || 0);
                  const saved = Number(d.saved || 0);
                  const max = Math.max(spent + saved, 0.001);
                  return (
                    <div key={d.day} className="flex flex-col items-center justify-end gap-1">
                      <div className="w-full flex flex-col justify-end h-20">
                        <div
                          className="w-full rounded-sm bg-emerald-400/70"
                          style={{ height: `${Math.round((saved / max) * 100)}%` }}
                        />
                        <div
                          className="w-full rounded-sm bg-white/20 mt-1"
                          style={{ height: `${Math.round((spent / max) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/30">{d.day}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-white/30 mt-3">
                Green = saved, gray = spent.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <StatsBar tasks={tasks} approvals={syntheticApprovals} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div className="space-y-6">
            <QuickActions onNewTask={() => document.querySelector('textarea')?.focus()} />

            <TemplateSelector
              isSubmitting={templateLaunch.isPending}
              onSelect={(goal, pipeline) => templateLaunch.mutate({ goal, pipeline })}
            />

            <EngineTaskMetrics tasks={tasks} />

            <PipelineChat
              onEngineTaskSubmitted={(taskId, message, pipeline) => {
                registerEngineTask(taskId, message, pipeline);
                toast({ title: '任务已提交到 Engine', description: `ID: ${taskId}` });
              }}
              approvalMode={approvalMode}
              onApprovalToggle={setApprovalMode}
            />

            <StepStream />

            {tasks
              .filter((task) => ['running', 'planning', 'awaiting_approval'].includes(task.status))
              .map((task) => (
                <LivePipelineCard key={task.id} task={task} />
              ))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BrowserPreview />
              <TerminalOutput />
            </div>

            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <Tabs value={filter} onValueChange={setFilter}>
                  <TabsList className="bg-white/[0.04] border border-white/[0.06]">
                    <TabsTrigger
                      value="all"
                      className="text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/50"
                    >
                      {t('allFilter')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="active"
                      className="text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/50"
                    >
                      {t('activeFilter')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="completed"
                      className="text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/50"
                    >
                      {t('completedFilter')}
                    </TabsTrigger>
                    {failedCount > 0 && (
                      <TabsTrigger
                        value="failed"
                        className="text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-red-400 text-white/50"
                      >
                        {t('failedFilter')} ({failedCount})
                      </TabsTrigger>
                    )}
                  </TabsList>
                </Tabs>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <SearchBar value={search} onChange={setSearch} />
                  <span className="text-xs text-white/30 whitespace-nowrap">
                    {filteredTasks.length} {t('tasks')}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {filteredTasks.length === 0 && tasks.length === 0 && <WelcomeGuide />}
                {filteredTasks.length === 0 && tasks.length > 0 && (
                  <div className="text-center py-16 text-white/30">
                    <p className="text-sm">{t('noTasksMatch')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:block space-y-6">
            <CostDashboard tasks={tasks} />
            <AgentSidebar agents={agents} />
          </div>
        </div>
      </div>

      <ApprovalDialog />
      <EmergencyStop />
    </div>
  );
}
