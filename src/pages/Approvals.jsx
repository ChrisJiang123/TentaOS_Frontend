// @ts-nocheck
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, CheckCircle2, XCircle, RotateCcw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import engineClient from '@/lib/engineClient';
import { useToast } from '@/components/ui/use-toast';
import { APPROVAL_ACTION_EXAMPLES } from '@/data/controlPlaneFallbacks';

const riskConfig = {
  low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10', ring: 'ring-orange-500/20' },
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', ring: 'ring-red-500/20' },
};

const actionIcons = {
  send_email: '📧',
  publish: '🚀',
  spend: '💰',
  delete: '🗑',
  external_write: '✏️',
  execute_code: '⚡',
};

function ApprovalCard({ approval, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const risk = riskConfig[approval.risk_level] || riskConfig.medium;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{actionIcons[approval.action_type] || '⚡'}</span>
              <span className="text-sm font-medium text-white">{approval.summary || 'Approval request'}</span>
            </div>
            <p className="text-xs text-white/40">Task: {approval.task_title || '—'}</p>
          </div>
          <div className={cn("px-2.5 py-1 rounded-md text-[11px] font-medium capitalize ring-1", risk.bg, risk.color, risk.ring)}>
            {approval.risk_level || 'medium'}
          </div>
        </div>

        {(approval.expected_impact?.files?.length > 0 ||
          approval.expected_impact?.commands?.length > 0) && (
          <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3 mb-3 text-[11px] font-mono">
            <p className="text-white/40 text-[10px] mb-2">预期影响</p>
            {(approval.expected_impact.files || []).map((f) => (
              <p key={f} className="text-cyan-300/80">
                file: {f}
              </p>
            ))}
            {(approval.expected_impact.commands || []).map((c) => (
              <p key={c} className="text-amber-200/80">
                $ {c}
              </p>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-white/30 mb-4 flex-wrap">
          <span>Agent: {approval.agent_name || approval.agent || 'Unknown'}</span>
          <span>·</span>
          <span className="capitalize">
            {approval.action || approval.action_type?.replace('_', ' ') || 'action'}
          </span>
          {approval.created_date && (
            <>
              <span>·</span>
              <span>{new Date(approval.created_date).toLocaleString()}</span>
            </>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors mb-4"
        >
          <ChevronDown className={cn("w-3 h-3 transition-transform", expanded && "rotate-180")} />
          {expanded ? 'Hide' : 'Show'} preview
        </button>

        <AnimatePresence>
          {expanded && approval.preview_data && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <pre className="bg-black/30 border border-white/[0.06] rounded-lg p-4 text-xs text-white/60 font-mono whitespace-pre-wrap mb-4 max-h-48 overflow-auto">
                {approval.preview_data}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>

        {approval.status === 'pending' && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onAction(approval.id, 'approved')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs px-4"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(approval.id, 'rejected')}
              className="border-red-500/20 text-red-400 hover:bg-red-500/10 h-8 text-xs px-4"
            >
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(approval.id, 'revision_requested')}
              className="border-white/10 text-white/50 hover:bg-white/5 h-8 text-xs px-4"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Revise
            </Button>
          </div>
        )}

        {approval.status !== 'pending' && (
          <div className={cn("px-3 py-2 rounded-lg text-xs font-medium capitalize", 
            approval.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
            approval.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
            'bg-amber-500/10 text-amber-400'
          )}>
            {approval.status?.replace('_', ' ')}
            {approval.decided_by && <span className="text-white/30 ml-2">by {approval.decided_by}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Approvals() {
  const [filter, setFilter] = useState('pending');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: approvalsPayload, isLoading, isError } = useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      try {
        const list = await engineClient.getApprovals();
        const items = Array.isArray(list) ? list : (list?.approvals || []);
        return { items: Array.isArray(items) ? items : [], source: 'engine' };
      } catch (e) {
        return {
          items: [],
          source: 'unavailable',
          error: e instanceof Error ? e.message : String(e),
        };
      }
    },
    retry: 0,
    staleTime: 30_000,
    refetchInterval: 10_000,
  });

  const approvals = approvalsPayload?.items || [];
  const apiUnavailable = approvalsPayload?.source === 'unavailable';

  const updateApproval = useMutation({
    mutationFn: async ({ id, status }) => {
      await engineClient.approveViaAPI(id, status === 'approved', '');
      return { source: 'engine' };
    },
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approvals-badge'] });
      queryClient.invalidateQueries({ queryKey: ['approvals-badge-mobile'] });
      toast({ title: '已发送到 Engine', description: `Approval: ${vars.id}` });
    },
    onError: (e) => {
      toast({
        title: '审批失败',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      });
    },
  });

  const filtered = approvals.filter(a => {
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'resolved') return a.status !== 'pending';
    return true;
  });

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div data-testid="approvals-page" className="min-h-screen p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-semibold text-white tracking-tight">Approval Center</h1>
            {pendingCount > 0 && (
              <span className="bg-amber-500/20 text-amber-400 text-xs font-medium px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
          <p className="text-sm text-white/40 mt-1">Review and approve agent actions before execution</p>
          {isLoading && <p className="text-[11px] text-white/25 mt-1">Loading approvals…</p>}
          {!isLoading && apiUnavailable && (
            <p className="text-[11px] text-white/30 mt-1">
              Engine approvals API unavailable — showing empty queue (no mock data).
              {approvalsPayload?.error ? ` (${approvalsPayload.error})` : ''}
            </p>
          )}
          {isError && (
            <p className="text-[11px] text-red-400/80 mt-1">Failed to load approvals.</p>
          )}
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="bg-white/[0.04] border border-white/[0.06]">
            <TabsTrigger value="pending" className="text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/50">
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/50">
              Resolved
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/50">
              All
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(approval => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onAction={(id, status) => updateApproval.mutate({ id, status })}
              />
            ))}
          </AnimatePresence>
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12 text-white/30">
              <Shield className="w-8 h-8 mx-auto mb-3 text-white/15" />
              <p className="text-sm">No {filter} approvals</p>
              <p className="text-xs text-white/35 mt-2 max-w-md mx-auto">
                When agents request high-risk actions, they appear here for approve / reject / revise.
              </p>
              {filter === 'pending' && (
                <div className="mt-8 text-left max-w-lg mx-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-[11px] text-white/40 mb-3 uppercase tracking-wide">
                    Example action types (reference only — not pending items)
                  </p>
                  <ul className="space-y-2">
                    {APPROVAL_ACTION_EXAMPLES.map((ex) => (
                      <li key={ex.type} className="text-xs text-white/50 flex gap-2">
                        <span className={cn(
                          'shrink-0 text-[10px] uppercase px-1.5 py-0.5 rounded',
                          ex.risk === 'critical' ? 'bg-red-500/10 text-red-400' :
                          ex.risk === 'high' ? 'bg-orange-500/10 text-orange-400' :
                          'bg-amber-500/10 text-amber-400',
                        )}>
                          {ex.risk}
                        </span>
                        <span>
                          <strong className="text-white/65">{ex.label}:</strong> {ex.example}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {apiUnavailable && (
                <p className="text-xs text-white/20 mt-4">Engine approvals API unreachable.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
