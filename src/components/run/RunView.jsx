// @ts-nocheck
import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ConnectionIndicator from '@/components/engine/ConnectionIndicator';
import { usePipelineRuntime } from '@/hooks/usePipelineRuntime';
import RunStatusBar from './RunStatusBar';
import PipelineStepList from './PipelineStepList';
import EvidencePanel from './EvidencePanel';
import VerificationSummaryCard from './VerificationSummaryCard';
import ForkLanes from './ForkLanes';
import Timeline, { buildTimelineEvents } from './Timeline';

export default function RunView({ taskId, mode = 'live' }) {
  const { toast } = useToast();
  const {
    runtime,
    pipeline,
    selectStep,
    stopTask,
    rollback,
    loadDiff,
    resolveApproval,
    screenshotUrl,
    startFork,
    mergeFork,
    timelineExtras,
    forking,
    merging,
  } = usePipelineRuntime(taskId, mode);

  const [rollbackTarget, setRollbackTarget] = React.useState(null);
  const [timelineIndex, setTimelineIndex] = React.useState(0);

  const timelineEvents = useMemo(() => {
    if (!pipeline) return [];
    return buildTimelineEvents(pipeline, timelineExtras?.() || {});
  }, [pipeline, timelineExtras]);

  useEffect(() => {
    if (timelineEvents.length && timelineIndex >= timelineEvents.length) {
      setTimelineIndex(0);
    }
  }, [timelineEvents.length, timelineIndex]);

  const selectedStep = useMemo(() => {
    if (!pipeline?.steps) return null;
    const id = runtime?.selectedStepId;
    return pipeline.steps.find((s) => s.id === id) || pipeline.steps[0];
  }, [pipeline, runtime?.selectedStepId]);

  const terminalText = selectedStep
    ? runtime?.terminalBuffers?.[selectedStep.id] || ''
    : '';

  const handleRollback = async () => {
    const cp = rollbackTarget;
    setRollbackTarget(null);
    if (!cp) return;
    try {
      await rollback(cp);
      toast({ title: '已回滚', description: `检查点 ${cp}` });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: '回滚失败',
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  if (!taskId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/50 text-sm">
        缺少任务 ID，请使用 /TaskDetail?id=…
      </div>
    );
  }

  if (runtime?.loadState === 'loading' && !pipeline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-sm text-white/40">加载运行视图…</p>
      </div>
    );
  }

  if (runtime?.loadState === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-white/60">{runtime.error}</p>
        <Link to="/Dashboard" className="text-blue-400 text-sm hover:underline">
          返回 Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="run-view">
      <div className="px-6 lg:px-8 pt-6 flex items-center justify-between gap-4">
        <Link
          to="/Dashboard"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          返回 Runs
        </Link>
        <ConnectionIndicator />
      </div>

      <RunStatusBar
        pipeline={pipeline}
        mode={mode}
        onStop={stopTask}
        stopping={runtime?.stopping}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-12">
        <VerificationSummaryCard
          pipeline={pipeline}
          onViewDiff={() => {
            loadDiff();
            selectStep(selectedStep?.id);
          }}
        />

        {(mode === 'replay' || pipeline?.status === 'completed') && timelineEvents.length > 0 && (
          <Timeline
            events={timelineEvents}
            selectedIndex={timelineIndex}
            mode={mode}
            onSelect={(idx, ev) => {
              setTimelineIndex(idx);
              if (ev?.stepId) selectStep(ev.stepId);
            }}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <ForkLanes
            pipeline={pipeline}
            mode={mode}
            taskId={taskId}
            selectedStepId={runtime?.selectedStepId}
            onSelectStep={selectStep}
            terminalBuffers={runtime?.terminalBuffers}
            onResolveApproval={resolveApproval}
            onRollback={(cp) => setRollbackTarget(cp)}
            rollingBack={runtime?.rollingBack}
            onStartFork={() =>
              startFork(['conservative', 'aggressive']).catch((err) =>
                toast({
                  variant: 'destructive',
                  title: 'Fork 失败',
                  description: err instanceof Error ? err.message : String(err),
                }),
              )
            }
            onMergeFork={(forkId) =>
              mergeFork(forkId).catch((err) =>
                toast({
                  variant: 'destructive',
                  title: '合并失败',
                  description: err instanceof Error ? err.message : String(err),
                }),
              )
            }
            forking={forking}
            merging={merging}
          >
            <PipelineStepList
              pipeline={pipeline}
              mode={mode}
              selectedStepId={runtime?.selectedStepId}
              onSelectStep={selectStep}
              terminalBuffers={runtime?.terminalBuffers}
              onResolveApproval={resolveApproval}
              onRollback={(cp) => setRollbackTarget(cp)}
              rollingBack={runtime?.rollingBack}
            />
          </ForkLanes>
          <EvidencePanel
            taskId={taskId}
            step={selectedStep}
            terminalText={terminalText}
            screenshotUrl={selectedStep ? screenshotUrl(selectedStep.id) : null}
            diffFiles={runtime?.diffFiles}
            diffLoading={runtime?.diffLoading}
            mode={mode}
          />
        </div>
      </div>

      <AlertDialog open={Boolean(rollbackTarget)} onOpenChange={(o) => !o && setRollbackTarget(null)}>
        <AlertDialogContent className="bg-[#13131A] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>回滚到此检查点？</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              工作区与任务状态将回退到检查点 {rollbackTarget}。此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-white/50">取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRollback} className="bg-amber-600 hover:bg-amber-500">
              确认回滚
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
