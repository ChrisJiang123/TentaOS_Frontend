// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, FileText, Loader2 } from 'lucide-react';
import LiveStepView from '../components/task/LiveStepView';
import ExecutionLog from '../components/task/ExecutionLog';
import EngineTaskDebugPanel from '../components/debug/EngineTaskDebugPanel';
import TaskPanelErrorBoundary from '../components/debug/TaskPanelErrorBoundary';
import { cn } from '@/lib/utils';
import { formatMs } from '@/lib/formatNumbers';
import { useEngineTask } from '@/hooks/useEngineTasks';
import { engineTaskStore } from '@/lib/engineTaskStore';
import { buildResultByStepId } from '@/lib/engineTaskUtils';

const statusColors = {
  queued: 'bg-white/10 text-white/50',
  planning: 'bg-blue-500/10 text-blue-400',
  running: 'bg-blue-500/10 text-blue-400',
  paused: 'bg-amber-500/10 text-amber-400',
  awaiting_approval: 'bg-orange-500/10 text-orange-400',
  completed: 'bg-emerald-500/10 text-emerald-400',
  failed: 'bg-red-500/10 text-red-400',
  cancelled: 'bg-white/10 text-white/40',
};

function formatOutput(value) {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function normalizeExecutionEntries(rawResults) {
  if (!Array.isArray(rawResults) || rawResults.length === 0) return [];
  if (rawResults[0]?.action || rawResults[0]?.type) return rawResults;
  return rawResults.map((r, i) => ({
    type: 'output',
    agent: r.agent || r.role || 'Agent',
    action: r.step_id ? `Step ${r.step_id}` : `Result ${i + 1}`,
    detail:
      typeof r.output === 'string'
        ? r.output
        : r.message || r.summary || JSON.stringify(r, null, 2),
    timestamp: r.timestamp || r.completed_at,
    cost: r.cost ?? r.cost_usd,
    tokens: r.tokens ?? r.tokens_used,
  }));
}

function TaskDetailBody({ taskId, task, record, debug, listDebug, loadState, loadError }) {
  const raw = record?.raw || {};
  const backendId = raw.task_id || raw.id || task?.id;
  const steps = raw.pipeline?.steps || [];
  const resultByStepId = buildResultByStepId(raw.results);
  const outputText = formatOutput(raw.output ?? task?.output);
  const resultsText = formatOutput(raw.results ?? task?.results);
  const hasSteps = steps.length > 0 || (task?.workflow_nodes && task.workflow_nodes.length > 0);
  const nodes = task?.workflow_nodes?.length ? task.workflow_nodes : [];
  const executionEntries = normalizeExecutionEntries(raw.execution_log || raw.results);

  if (!taskId) {
    return (
      <StateShell title="Missing task ID" message="Use /TaskDetail?id=&lt;backend_task_id&gt;">
        <EngineTaskDebugPanel debug={debug} listDebug={listDebug} record={record} />
      </StateShell>
    );
  }

  if (loadState === 'loading' && !task) {
    return (
      <StateShell title="Loading task…" spinning>
        <EngineTaskDebugPanel debug={debug} listDebug={listDebug} record={record} />
      </StateShell>
    );
  }

  if (loadState === 'error') {
    return (
      <StateShell title="Network error" message={loadError || record?.pollError || 'Could not reach Engine'} error>
        <EngineTaskDebugPanel debug={debug} listDebug={listDebug} record={record} />
      </StateShell>
    );
  }

  if (loadState === 'not_found' && !task) {
    return (
      <StateShell title="Task not found or expired" message={`No data for ${taskId}`}>
        <EngineTaskDebugPanel debug={debug} listDebug={listDebug} record={record} />
      </StateShell>
    );
  }

  if (!task) {
    return (
      <StateShell title="Loading task…" spinning>
        <EngineTaskDebugPanel debug={debug} listDebug={listDebug} record={record} />
      </StateShell>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/Dashboard"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white">{task.title}</h1>
          <p className="text-sm text-white/40 mt-1">{task.goal}</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 text-xs">
          <span className={cn('px-3 py-1.5 rounded-lg capitalize font-medium', statusColors[task.status])}>
            {raw.status || task.status}
          </span>
          <MetaChip label="id" value={backendId || '—'} />
          <MetaChip label="pipeline_id" value={raw.pipeline_id || '—'} />
          <MetaChip label="steps" value={String(steps.length || nodes.length || '—')} />
        </div>

        {hasSteps && nodes.length > 0 && (
          <div className="mb-6">
            <LiveStepView nodes={nodes} />
          </div>
        )}

        {steps.length > 0 && (
          <div className="mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-white/50 mb-3">Pipeline steps (raw)</p>
            <div className="space-y-2">
              {steps.map((step, i) => {
                const sid = String(step.step_id ?? step.id ?? i);
                const result = resultByStepId.get(sid);
                const duration = result?.duration_ms ?? step.duration_ms;
                return (
                  <div key={sid} className="text-[11px] font-mono text-white/45 flex flex-wrap gap-x-4 gap-y-1">
                    <span>{sid}</span>
                    <span>{step.status || '—'}</span>
                    <span>duration: {formatMs(duration)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {task.status === 'completed' && !hasSteps && (
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
            Completed but no pipeline steps in response.
          </div>
        )}

        {outputText && (
          <div className="mb-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 text-emerald-300/90 text-sm font-medium mb-3">
              <FileText className="w-4 h-4" />
              Completed output
            </div>
            <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono max-h-96 overflow-auto">
              {outputText}
            </pre>
          </div>
        )}

        {resultsText && typeof raw.results !== 'string' && (
          <div className="mb-6 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <p className="text-sm font-medium text-white/60 mb-2">Results</p>
            <pre className="text-xs text-white/60 whitespace-pre-wrap font-mono max-h-64 overflow-auto">
              {resultsText}
            </pre>
          </div>
        )}

        {!outputText && !hasSteps && (
          <div className="mb-6 text-sm text-white/35 rounded-xl border border-white/[0.06] p-4">
            No steps or output yet.{' '}
            {['running', 'planning', 'queued'].includes(task.status) && 'Polling every 1–2s…'}
          </div>
        )}

        <ExecutionLog entries={executionEntries} />

        <EngineTaskDebugPanel debug={debug} listDebug={listDebug} record={record} />
      </div>
    </motion.div>
  );
}

export default function TaskDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('id');
  const [loadState, setLoadState] = useState('idle');
  const [loadError, setLoadError] = useState(null);

  const { task, record, debug, listDebug } = useEngineTask(taskId);

  useEffect(() => {
    if (!taskId) return;
    setLoadState('loading');
    setLoadError(null);
    engineTaskStore
      .ensureTaskLoaded(taskId)
      .then((rec) => {
        if (!rec?.raw && rec?.pollError) {
          setLoadState('not_found');
        } else if (rec?.raw) {
          setLoadState('ready');
        } else {
          setLoadState('not_found');
        }
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : String(err));
        setLoadState('error');
      });
  }, [taskId]);

  useEffect(() => {
    if (task && loadState === 'loading') {
      setLoadState('ready');
    }
  }, [task, loadState]);

  return (
    <TaskPanelErrorBoundary title="Task detail render error">
      <TaskDetailBody
        taskId={taskId}
        task={task}
        record={record}
        debug={debug}
        listDebug={listDebug}
        loadState={loadState}
        loadError={loadError}
      />
    </TaskPanelErrorBoundary>
  );
}

function MetaChip({ label, value }) {
  return (
    <span className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-white/45 font-mono">
      {label}: {value}
    </span>
  );
}

function StateShell({ title, message, children, spinning, error }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md mb-6">
        {spinning ? (
          <Loader2 className="w-7 h-7 mx-auto mb-3 text-blue-400 animate-spin" />
        ) : (
          <AlertCircle
            className={cn('w-8 h-8 mx-auto mb-3', error ? 'text-red-400/80' : 'text-amber-400/80')}
          />
        )}
        <p className="text-sm text-white/70">{title}</p>
        {message && <p className="text-xs text-white/35 mt-2">{message}</p>}
        <Link to="/Dashboard" className="text-blue-400 text-sm mt-4 inline-block hover:underline">
          Back to Dashboard
        </Link>
      </div>
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
