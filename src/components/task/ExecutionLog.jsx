import React, { useState } from 'react';
import { Brain, Wrench, FileText, AlertCircle, Shield, ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const typeConfig = {
  think: { icon: Brain, color: 'text-blue-400', bg: 'bg-blue-500/10', line: 'bg-blue-500/20', label: 'Think' },
  tool_call: { icon: Wrench, color: 'text-purple-400', bg: 'bg-purple-500/10', line: 'bg-purple-500/20', label: 'Tool' },
  output: { icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', line: 'bg-emerald-500/20', label: 'Output' },
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', line: 'bg-red-500/20', label: 'Error' },
  approval: { icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10', line: 'bg-amber-500/20', label: 'Approval' },
  info: { icon: Brain, color: 'text-white/40', bg: 'bg-white/5', line: 'bg-white/10', label: 'Info' },
};

const levelColors = {
  error: 'border-l-red-500',
  warn: 'border-l-amber-500',
  info: 'border-l-transparent',
};

function LogEntry({ entry, index, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const config = typeConfig[entry.type] || typeConfig.info;
  const Icon = config.icon;
  const isLong = entry.detail && entry.detail.length > 120;
  const hasMetadata = entry.model || entry.tokens > 0 || entry.cost > 0 || entry.fallback;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      className={cn("relative flex gap-3 pb-4 last:pb-0 border-l-2 pl-4 ml-3", levelColors[entry.level] || 'border-l-transparent')}
    >
      {!isLast && <div className={cn("absolute left-[22px] top-8 bottom-0 w-px", config.line)} />}
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 -ml-[30px]", config.bg)}>
        <Icon className={cn("w-3.5 h-3.5", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-white/70">{entry.agent}</span>
          <span className="text-[10px] text-white/25">·</span>
          <span className="text-[11px] text-white/50">{entry.action}</span>
          {entry.timestamp && (
            <>
              <span className="text-[10px] text-white/15">·</span>
              <span className="text-[10px] text-white/20">{format(new Date(entry.timestamp), 'HH:mm:ss')}</span>
            </>
          )}
          {entry.level === 'error' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">ERROR</span>}
          {entry.level === 'warn' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">WARN</span>}
        </div>
        
        <div className="mt-1">
          <p className={cn("text-[12px] text-white/45 whitespace-pre-wrap leading-relaxed", !expanded && isLong && "line-clamp-2")}>
            {entry.detail}
          </p>
          {isLong && (
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 mt-1 text-[10px] text-blue-400/60 hover:text-blue-400 transition-colors">
              <ChevronDown className={cn("w-3 h-3 transition-transform", expanded && "rotate-180")} />
              {expanded ? 'Less' : 'More'}
            </button>
          )}
        </div>

        {hasMetadata && (
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/25">
            {entry.model && <span className="px-1.5 py-0.5 rounded bg-white/[0.04]">{entry.model}</span>}
            {entry.tokens > 0 && <span>{entry.tokens} tok</span>}
            {entry.cost > 0 && <span className="text-emerald-400/60">${entry.cost.toFixed(4)}</span>}
            {entry.fallback && <span className="text-amber-400/60">⚠ {entry.fallback}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ExecutionLog({ entries = [] }) {
  const [filterType, setFilterType] = useState('all');
  const [searchText, setSearchText] = useState('');

  const filtered = entries.filter(e => {
    if (filterType !== 'all' && e.type !== filterType) return false;
    if (searchText && !e.detail?.toLowerCase().includes(searchText.toLowerCase()) && !e.agent?.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const errorCount = entries.filter(e => e.level === 'error').length;
  const warnCount = entries.filter(e => e.level === 'warn').length;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white/60">Execution Log</h3>
          <span className="text-[10px] text-white/25">{entries.length} entries</span>
          {errorCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">{errorCount} errors</span>}
          {warnCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{warnCount} warnings</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
            {['all', 'output', 'tool_call', 'error'].map(t => (
              <button key={t} onClick={() => setFilterType(t)} className={cn(
                "px-2 py-1 rounded-md text-[10px] transition-all capitalize",
                filterType === t ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/50"
              )}>
                {t === 'all' ? 'All' : (typeConfig[t]?.label || t)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-0 max-h-[500px] overflow-y-auto pr-1">
        {filtered.map((entry, i) => (
          <LogEntry key={i} entry={entry} index={i} isLast={i === filtered.length - 1} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <Clock className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-xs text-white/30">{entries.length === 0 ? 'No log entries yet' : 'No matching entries'}</p>
          </div>
        )}
      </div>
    </div>
  );
}