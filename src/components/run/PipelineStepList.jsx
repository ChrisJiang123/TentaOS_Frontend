// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import {
  Terminal,
  Globe,
  FileText,
  Cpu,
  Shield,
  Flag,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStepStatusConfig } from '@/lib/pipelineStatus';
import { stepVerificationLabel } from '@/lib/taskVerification';
import { useStrings } from '@/i18n/useStrings';
import StepApprovalInline from './StepApprovalInline';

const TOOL_ICONS = {
  terminal: Terminal,
  browser: Globe,
  file: FileText,
  model: Cpu,
};

const RISK_BORDER = {
  low: 'border-white/[0.06]',
  medium: 'border-amber-500/25',
  high: 'border-red-500/40',
};

export default function PipelineStepList({
  pipeline,
  mode,
  selectedStepId,
  onSelectStep,
  terminalBuffers = {},
  onResolveApproval,
  onRollback,
  rollingBack,
}) {
  const { t, lang } = useStrings();
  const runningRef = useRef(null);

  useEffect(() => {
    if (mode !== 'live') return;
    runningRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [pipeline?.steps?.map((s) => s.status).join(','), mode]);

  if (!pipeline?.steps?.length) {
    return (
      <div className="rounded-xl border border-white/[0.06] p-8 text-center text-sm text-white/35">
        {t('noSteps')}
      </div>
    );
  }

  return (
    <ol className="space-y-2" data-testid="pipeline-step-list">
      {pipeline.steps.map((step, i) => {
        const ToolIcon = TOOL_ICONS[step.tool] || Terminal;
        const statusCfg = getStepStatusConfig(step.status);
        const StatusIcon = statusCfg.icon;
        const selected = selectedStepId === step.id;
        const isRunning = step.status === 'running';
        const vLabel = stepVerificationLabel(step, lang);
        const approval = step._approval;
        const autoRule = step._autoApproved;

        return (
          <li key={step.id}>
            <button
              type="button"
              ref={isRunning ? runningRef : null}
              onClick={() => onSelectStep(step.id)}
              className={cn(
                'w-full text-left rounded-xl border p-4 transition-all',
                RISK_BORDER[step.risk] || RISK_BORDER.low,
                selected ? 'ring-2 ring-blue-500/30 bg-blue-500/[0.04]' : 'bg-white/[0.02] hover:bg-white/[0.04]',
                isRunning && 'shadow-[0_0_20px_rgba(59,130,246,0.08)]',
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-white/25 w-5">{i + 1}</span>
                <div className={cn('p-1.5 rounded-lg', statusCfg.bg)}>
                  <StatusIcon
                    className={cn('w-4 h-4', statusCfg.color, statusCfg.spin && 'animate-spin')}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <ToolIcon className="w-3.5 h-3.5 text-blue-400/80" />
                    <span className="text-sm font-medium text-white">{step.title}</span>
                    {step.risk === 'high' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/25">
                        {t('highRiskNeedsApproval')}
                      </span>
                    )}
                    {autoRule && (
                      <span className="text-[10px] text-emerald-400/80">
                        {t('autoApproved')} ({autoRule})
                      </span>
                    )}
                  </div>
                  {step.verification?.expression && (
                    <p className="text-[11px] text-white/40">
                      {t('verifyPrefix')} {step.verification.expression}
                    </p>
                  )}
                  {vLabel && (
                    <p
                      className={cn(
                        'text-[11px] mt-1 font-medium',
                        vLabel.icon === 'pass' && 'text-emerald-400',
                        vLabel.icon === 'fail' && 'text-red-400',
                        vLabel.icon === 'pending' && 'text-amber-400/80',
                      )}
                    >
                      {vLabel.text}
                    </p>
                  )}
                  {step.checkpointId && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-[10px] text-cyan-400/80">
                        <Flag className="w-3 h-3" />
                        {t('checkpoint')} {step.checkpointId}
                      </span>
                      {mode === 'live' && onRollback && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRollback(step.checkpointId);
                          }}
                          disabled={rollingBack}
                          className="text-[10px] text-white/40 hover:text-amber-300 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          {t('rollbackToHere')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {terminalBuffers[step.id] && (
                <pre className="mt-3 ml-8 text-[10px] font-mono text-white/35 max-h-24 overflow-auto bg-black/30 rounded-lg p-2">
                  {terminalBuffers[step.id].slice(-800)}
                </pre>
              )}
            </button>
            {approval && step.status === 'awaiting_approval' && (
              <div className="mt-2 ml-8">
                <StepApprovalInline approval={approval} onResolve={onResolveApproval} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
