import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import StatsBar from '../components/dashboard/StatsBar';
import TaskCard from '../components/dashboard/TaskCard';
import AgentSidebar from '../components/dashboard/AgentSidebar';
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
import EngineTaskDebugPanel from '../components/debug/EngineTaskDebugPanel';
import TaskPanelErrorBoundary from '../components/debug/TaskPanelErrorBoundary';
import { useLanguage } from '@/lib/LanguageContext';
import { useStrings } from '@/i18n/useStrings';
import engineClient from '@/lib/engineClient';
import ConnectionGate from '../components/engine/ConnectionGate';
import ConnectionIndicator from '../components/engine/ConnectionIndicator';
import BrowserPreview from '../components/engine/BrowserPreview';
import TerminalOutput from '../components/engine/TerminalOutput';
import ApprovalDialog from '../components/engine/ApprovalDialog';
import { submitEngineTask } from '@/lib/submitEngineTask';
import { useEngineTasks } from '@/hooks/useEngineTasks';
import { engineTaskStore } from '@/lib/engineTaskStore';

export default function Dashboard() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const { t: tNav } = useLanguage();
  const { t } = useStrings();
  const [approvalMode, setApprovalMode] = useState(false);

  const { tasks, listDebug, debug } = useEngineTasks();

  useEffect(() => {
    engineTaskStore.refreshList().catch((err) => {
      console.error('[Dashboard] refreshList failed', err);
    });
    const interval = setInterval(() => {
      engineTaskStore.refreshList().catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const { data: health } = useQuery({
    queryKey: ['engine-health'],
    queryFn: () => engineClient.getHealth(),
    refetchInterval: 10_000,
  });

  const templateLaunch = useMutation({
    mutationFn: async ({ goal, pipeline }) => {
      const { res, taskId } = await submitEngineTask(goal);
      return { res, taskId, goal, pipeline };
    },
    onSuccess: ({ taskId }) => {
      toast({
        title: t('toastTaskSubmitted'),
        description: taskId ? `${t('toastTaskSubmittedDesc')} (${taskId})` : t('toastTaskSubmittedDesc'),
      });
    },
    onError: (e) => {
      toast({
        variant: 'destructive',
        title: t('toastSubmitFailed'),
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
  const agents = [];
  const pendingApprovalsCount = health?.pending_approvals ?? 0;
  const syntheticApprovals = Array.from({ length: pendingApprovalsCount }, (_, i) => ({
    id: `engine-pending-${i}`,
    status: 'pending',
  }));

  return (
    <ConnectionGate onConnected={() => engineTaskStore.refreshList()}>
      <div className="min-h-screen p-6 lg:p-8" data-testid="dashboard-page">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                {user?.full_name ? `${tNav('welcomeBack')}, ${user.full_name.split(' ')[0]}` : tNav('dashboard')}
              </h1>
              <p className="text-sm text-white/40 mt-1">{tNav('dashboardSubtitle')}</p>
              {health && (
                <p className="text-[11px] text-white/30 mt-1">
                  {t('engineHealth')}: {health.status ?? '—'}
                  {health.active_tasks != null && ` · active ${health.active_tasks}`}
                  {health.pending_approvals != null && ` · approvals ${health.pending_approvals}`}
                </p>
              )}
              {listDebug.loading && !listDebug.lastFetchAt && (
                <p className="text-[11px] text-white/25 mt-1">{t('loadingTasks')}</p>
              )}
            </div>
            <ConnectionIndicator />
          </div>

          <TaskPanelErrorBoundary title="Dashboard task panel render error">
          <div className="mb-6">
            <StatsBar tasks={tasks} approvals={syntheticApprovals} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            <div className="space-y-6">
              <PipelineChat
                onEngineTaskSubmitted={async () => {
                  await engineTaskStore.refreshList().catch(() => {});
                }}
                approvalMode={approvalMode}
                onApprovalToggle={setApprovalMode}
              />

              {tasks.length === 0 && (
                <p className="text-center text-[11px] text-white/30 -mt-2">
                  {t('dashboardEmptyHint')}
                </p>
              )}

              <QuickActions onNewTask={() => document.querySelector('[data-testid="command-bar"] textarea')?.focus()} />

              <TemplateSelector
                isSubmitting={templateLaunch.isPending}
                onSelect={(goal, pipeline) => templateLaunch.mutate({ goal, pipeline })}
              />

              <EngineTaskMetrics tasks={tasks} />

              <StepStream />

              {tasks
                .filter((task) => ['running', 'planning', 'awaiting_approval', 'queued'].includes(task.status))
                .map((task) => (
                  <LivePipelineCard key={task.id} task={task} />
                ))}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BrowserPreview />
                <TerminalOutput />
              </div>

              <div data-testid="runs-list">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-white/70">{t('dashboardRuns')}</h2>
                  <span className="text-[10px] text-white/30">{t('dashboardRunsRefresh')}</span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <Tabs value={filter} onValueChange={setFilter}>
                    <TabsList className="bg-white/[0.04] border border-white/[0.06]">
                      <TabsTrigger value="all" className="text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/50">
                        {tNav('allFilter')}
                      </TabsTrigger>
                      <TabsTrigger value="active" className="text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/50">
                        {tNav('activeFilter')}
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/50">
                        {tNav('completedFilter')}
                      </TabsTrigger>
                      {failedCount > 0 && (
                        <TabsTrigger value="failed" className="text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-red-400 text-white/50">
                          {tNav('failedFilter')} ({failedCount})
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </Tabs>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <SearchBar value={search} onChange={setSearch} />
                    <span className="text-xs text-white/30 whitespace-nowrap">
                      {filteredTasks.length} {tNav('tasks')}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {filteredTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {filteredTasks.length === 0 && tasks.length > 0 && (
                    <div className="text-center py-16 text-white/30">
                      <p className="text-sm">{tNav('noTasksMatch')}</p>
                    </div>
                  )}
                  {filteredTasks.length === 0 && tasks.length === 0 && (
                    <div className="text-center py-10 px-4 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01]">
                      <p className="text-sm text-white/50 mb-2">{t('dashboardNoTasksTitle')}</p>
                      <p className="text-xs text-white/35 mb-4">{t('dashboardNoTasksBody')}</p>
                      <button
                        type="button"
                        className="text-xs text-blue-400 hover:text-blue-300"
                        onClick={() =>
                          document.querySelector('[data-testid="command-bar"] textarea')?.focus()
                        }
                      >
                        {t('dashboardFocusCommandBar')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {import.meta.env.DEV && (
                <EngineTaskDebugPanel debug={debug} listDebug={listDebug} record={null} />
              )}
            </div>

            <div className="hidden lg:block space-y-6">
              <CostDashboard tasks={tasks} />
              <AgentSidebar agents={agents} />
            </div>
          </div>
          </TaskPanelErrorBoundary>
        </div>

        <ApprovalDialog />
      </div>
    </ConnectionGate>
  );
}
