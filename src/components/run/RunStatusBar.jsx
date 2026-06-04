// @ts-nocheck
import React, { useState } from 'react';
import { Loader2, Square } from 'lucide-react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getTaskStatusConfig } from '@/lib/pipelineStatus';
import { getDisplayTaskStatus } from '@/lib/taskVerification';
import { cn } from '@/lib/utils';
import { useStrings } from '@/i18n/useStrings';

const TERMINAL_STATUSES = new Set([
  'completed',
  'failed',
  'completed_with_warnings',
  'cancelled',
]);

export default function RunStatusBar({ pipeline, mode, onStop, stopping }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { t } = useStrings();
  if (!pipeline) return null;

  const displayStatus = getDisplayTaskStatus(pipeline);
  const effectiveStatus =
    displayStatus === 'failed' ? 'failed' : displayStatus === 'completed_pending' ? 'running' : pipeline.status;

  if (mode === 'live' && TERMINAL_STATUSES.has(effectiveStatus)) {
    return null;
  }

  const statusCfg =
    displayStatus === 'completed_pending'
      ? { ...getTaskStatusConfig('running'), label: t('pendingVerification') }
      : getTaskStatusConfig(displayStatus === 'failed' ? 'failed' : pipeline.status);
  const StatusIcon = statusCfg.icon;
  const progress =
    pipeline.steps_total > 0
      ? Math.round((pipeline.steps_completed / pipeline.steps_total) * 100)
      : 0;
  const isLive = mode === 'live';
  const canStop =
    isLive &&
    ['running', 'planning', 'queued', 'awaiting_approval', 'paused'].includes(pipeline.status);

  const handleStop = async () => {
    setConfirmOpen(false);
    if (onStop) await onStop();
  };

  const stepTotal = pipeline.steps_total || pipeline.steps?.length || 0;

  return (
    <div
      className="sticky top-0 z-20 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3 mb-4 bg-[#06060B]/90 backdrop-blur-md border-b border-white/[0.06]"
      data-testid="run-status-bar"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-white truncate">{pipeline.title}</h1>
          <p className="text-xs text-white/40 truncate">{pipeline.intent}</p>
        </div>
        <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg', statusCfg.bg)}>
          <StatusIcon className={cn('w-4 h-4', statusCfg.color, statusCfg.spin && 'animate-spin')} />
          <span className={cn('text-sm font-medium', statusCfg.color)}>{statusCfg.label}</span>
        </div>
        <span className="text-xs text-white/40 font-mono">
          {t('stepProgress')} {pipeline.steps_completed}/{stepTotal}
          {progress > 0 && ` · ${progress}%`}
        </span>
        {mode === 'replay' && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
            {t('replay')}
          </span>
        )}
        {canStop && (
          <AlertDialog open={confirmOpen} onOpenChange={(o) => setConfirmOpen(o)}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/40 text-red-400 hover:bg-red-500/10 h-8"
                disabled={stopping}
                data-testid="run-stop-btn"
              >
                {stopping ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Square className="w-3.5 h-3.5 mr-1.5 fill-current" />
                )}
                {t('stop')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#13131A] border-white/10 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>{t('stopConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription className="text-white/50">
                  {t('stopConfirmDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-white/50">{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleStop}
                  className="bg-red-600 hover:bg-red-500"
                >
                  {t('confirmStop')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
