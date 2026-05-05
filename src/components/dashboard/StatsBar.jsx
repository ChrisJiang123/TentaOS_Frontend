import React from 'react';
import { Activity, CheckCircle2, Clock, DollarSign, XCircle, Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function StatsBar({ tasks = [], approvals = [] }) {
  const running = tasks.filter(t => t.status === 'running' || t.status === 'planning').length;
  const awaitingApproval = tasks.filter(t => t.status === 'awaiting_approval').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const failed = tasks.filter(t => t.status === 'failed').length;
  const pending = approvals.filter(a => a.status === 'pending').length;
  const totalCost = tasks.reduce((sum, t) => sum + (t.actual_cost || 0), 0);
  const totalTokens = tasks.reduce((sum, t) => sum + (t.tokens_used || 0), 0);

  const stats = [
    { label: 'Active', value: String(running), icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10', pulse: running > 0 },
    { label: 'Completed', value: String(completed), icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Approvals', value: String(pending + awaitingApproval), icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10', pulse: (pending + awaitingApproval) > 0 },
    { label: 'Failed', value: String(failed), icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', hide: failed === 0 },
    { label: 'Tokens', value: totalTokens > 1000000 ? `${(totalTokens / 1000000).toFixed(1)}M` : totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(0)}K` : String(totalTokens), icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Cost', value: `$${totalCost.toFixed(2)}`, icon: DollarSign, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  const visibleStats = stats.filter(s => !s.hide);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {visibleStats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-200"
        >
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center relative", stat.bg)}>
            <stat.icon className={cn("w-5 h-5", stat.color)} />
            {stat.pulse && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            )}
          </div>
          <div>
            <p className="text-xl font-semibold text-white tabular-nums">{stat.value}</p>
            <p className="text-[11px] text-white/40">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}