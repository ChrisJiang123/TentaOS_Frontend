// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { GitFork, Loader2, Merge, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import { useStrings } from '@/i18n/useStrings';
import PipelineStepList from './PipelineStepList';

export default function ForkLanes({
  pipeline,
  mode,
  taskId,
  children,
  selectedStepId,
  onSelectStep,
  terminalBuffers,
  onResolveApproval,
  onRollback,
  rollingBack,
  onStartFork,
  onMergeFork,
  forking,
  merging,
}) {
  const { t } = useStrings();
  const forks = pipeline?.forks || [];
  const [mergeTarget, setMergeTarget] = useState(null);

  const winnerId = useMemo(() => {
    if (!forks.length) return null;
    const explicit = forks.find((f) => f.isWinner);
    if (explicit) return explicit.id;
    let best = null;
    let bestScore = -Infinity;
    forks.forEach((f) => {
      if (f.score != null && f.score > bestScore) {
        bestScore = f.score;
        best = f.id;
      }
    });
    return best;
  }, [forks]);

  if (!forks.length) {
    return <>{children}</>;
  }

  const handleMergeConfirm = async () => {
    const fid = mergeTarget;
    setMergeTarget(null);
    if (fid && onMergeFork) await onMergeFork(fid);
  };

  return (
    <div className="space-y-4" data-testid="fork-lanes">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-violet-500/20 bg-violet-500/[0.04]">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <GitFork className="w-4 h-4 text-violet-400" />
            {t('forkLanesTitle')} · {forks.length} {t('forkLanesCount')}
          </div>
          <p className="text-[11px] text-white/40 mt-1 line-clamp-1">{pipeline.intent}</p>
        </div>
        {mode === 'live' && onStartFork && (
          <Button
            size="sm"
            variant="outline"
            disabled={forking}
            onClick={onStartFork}
            className="border-violet-500/30 text-violet-300"
            data-testid="start-fork"
          >
            {forking ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <GitFork className="w-3.5 h-3.5 mr-2" />}
            {t('startFork')}
          </Button>
        )}
      </div>

      <div
        className={cn(
          'grid gap-4',
          forks.length === 1 ? 'grid-cols-1' : forks.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-3',
        )}
      >
        {forks.map((fork) => {
          const isWinner = fork.id === winnerId;
          const forkPipeline = {
            ...pipeline,
            steps: fork.pipeline?.steps || [],
            status: fork.pipeline?.status || pipeline.status,
          };
          return (
            <div
              key={fork.id}
              className={cn(
                'rounded-xl border p-3 space-y-3 min-w-0',
                isWinner ? 'border-emerald-500/40 bg-emerald-500/[0.04]' : 'border-white/[0.08] bg-white/[0.02]',
              )}
              data-testid={`fork-lane-${fork.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-white/90">{fork.strategy || fork.id}</p>
                  {fork.score != null && (
                    <p className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                      {isWinner && <Trophy className="w-3 h-3 text-amber-400" />}
                      Score: <span className="font-mono text-white/70">{fork.score}</span>
                    </p>
                  )}
                </div>
                {isWinner && mode === 'live' && onMergeFork && (
                  <Button
                    size="sm"
                    className="h-7 text-[10px] bg-emerald-600/80 hover:bg-emerald-500"
                    disabled={merging}
                    onClick={() => setMergeTarget(fork.id)}
                    data-testid="merge-fork-btn"
                  >
                    <Merge className="w-3 h-3 mr-1" />
                    {t('mergeFork')}
                  </Button>
                )}
              </div>

              <ForkScorecard steps={forkPipeline.steps} t={t} />

              <PipelineStepList
                pipeline={forkPipeline}
                mode={mode}
                selectedStepId={selectedStepId}
                onSelectStep={onSelectStep}
                terminalBuffers={terminalBuffers}
                onResolveApproval={onResolveApproval}
                onRollback={onRollback}
                rollingBack={rollingBack}
              />
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-white/30 text-center">{t('forkArchiveNote')}</p>

      <AlertDialog open={Boolean(mergeTarget)} onOpenChange={(o) => !o && setMergeTarget(null)}>
        <AlertDialogContent className="bg-[#13131A] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('mergeConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              {t('mergeConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-white/50">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleMergeConfirm} className="bg-emerald-600 hover:bg-emerald-500">
              {t('confirmMerge')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ForkScorecard({ steps, t }) {
  const checks = (steps || [])
    .filter((s) => s.verification?.result)
    .map((s) => ({
      title: s.title,
      result: s.verification.result,
      expression: s.verification.expression,
    }));

  if (!checks.length) {
    return (
      <div className="text-[10px] text-white/30 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
        {t('forkScorecardPending')}
      </div>
    );
  }

  const passed = checks.filter((c) => c.result === 'pass').length;

  return (
    <div
      className="text-[10px] px-2 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-1"
      data-testid="fork-scorecard"
    >
      <p className="text-white/50 font-medium">
        {t('forkScorecard')} · {passed}/{checks.length} pass
      </p>
      {checks.map((c, i) => (
        <p key={i} className={c.result === 'pass' ? 'text-emerald-400/90' : 'text-red-400/90'}>
          {c.result === 'pass' ? '✓' : '✗'} {c.expression || c.title}
        </p>
      ))}
    </div>
  );
}
