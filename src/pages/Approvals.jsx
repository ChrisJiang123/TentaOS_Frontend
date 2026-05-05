import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, AlertTriangle, CheckCircle2, XCircle, RotateCcw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import engineClient from '@/lib/engineClient';

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
              <span className="text-sm font-medium text-white">{approval.summary}</span>
            </div>
            <p className="text-xs text-white/40">Task: {approval.task_title}</p>
          </div>
          <div className={cn("px-2.5 py-1 rounded-md text-[11px] font-medium capitalize ring-1", risk.bg, risk.color, risk.ring)}>
            {approval.risk_level}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-white/30 mb-4 flex-wrap">
          <span>Agent: {approval.agent_name || 'Unknown'}</span>
          <span>·</span>
          <span className="capitalize">{approval.action_type?.replace('_', ' ') || 'action'}</span>
          {approval.created_date && (
            <>
              <span>·</span>
              <span>{new Date(approval.created_date).toLocaleString()}</span>
            </>
          )}
        </div>

        {/* Preview Toggle */}
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

        {/* Actions */}
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

  const { data: approvals = [] } = useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      const list = await engineClient.getApprovals();
      return Array.isArray(list) ? list : (list?.approvals || []);
    },
  });

  const updateApproval = useMutation({
    mutationFn: async ({ id, status }) => {
      // Engine API: POST /api/approvals/:id { approved, feedback }
      await engineClient.approveViaAPI(id, status === 'approved', '');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const filtered = approvals.filter(a => {
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'resolved') return a.status !== 'pending';
    return true;
  });

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="min-h-screen p-6 lg:p-8">
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
          {filtered.length === 0 && (
            <div className="text-center py-16 text-white/30">
              <Shield className="w-8 h-8 mx-auto mb-3 text-white/15" />
              <p className="text-sm">No {filter} approvals</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}