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

  const { data: health } = useQuery({
    queryKey: ['engine-health'],
    queryFn: () => engineClient.getHealth(),
    refetchInterval: 10_000,
  });

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
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              {user?.full_name ? `${t('welcomeBack')}, ${user.full_name.split(' ')[0]}` : t('dashboard')}
            </h1>
            <p className="text-sm text-white/40 mt-1">{t('dashboardSubtitle')}</p>
            {health && (
              <p className="text-[11px] text-white/30 mt-1">
                引擎健康：{health.status ?? '—'}
                {health.browser != null && ` · 浏览器 ${String(health.browser)}`}
                {health.active_tasks != null && ` · 进行中 ${health.active_tasks}`}
              </p>
            )}
          </div>
          <ConnectionIndicator />
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
