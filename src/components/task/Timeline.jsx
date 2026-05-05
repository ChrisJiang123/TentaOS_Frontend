import React, { useState } from 'react';
import { Code2, FileText, Brain, Wrench, AlertCircle, ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const typeConfig = {
  think: { icon: Brain, color: 'text-blue-400', bg: 'bg-blue-500/10', line: 'bg-blue-500/20' },
  tool_call: { icon: Wrench, color: 'text-purple-400', bg: 'bg-purple-500/10', line: 'bg-purple-500/20' },
  output: { icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', line: 'bg-emerald-500/20' },
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', line: 'bg-red-500/20' },
};

function TimelineEvent({ event, index, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const config = typeConfig[event.type] || typeConfig.output;
  const Icon = config.icon;
  const isLong = event.detail && event.detail.length > 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative flex gap-4 pb-6 last:pb-0"
    >
      {/* Line */}
      {!isLast && (
        <div className={cn("absolute left-[15px] top-8 bottom-0 w-px", config.line)} />
      )}
      {/* Dot */}
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white/70">{event.agent}</span>
          <span className="text-[10px] text-white/25">·</span>
          <span className="text-xs text-white/40">{event.action}</span>
          {event.timestamp && (
            <>
              <span className="text-[10px] text-white/15">·</span>
              <span className="text-[10px] text-white/20">
                {format(new Date(event.timestamp), 'HH:mm:ss')}
              </span>
            </>
          )}
        </div>
        <div className="mt-1">
          <p className={cn(
            "text-xs text-white/50 whitespace-pre-wrap",
            !expanded && isLong && "line-clamp-2"
          )}>
            {event.detail}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-1 text-[11px] text-blue-400/60 hover:text-blue-400 transition-colors"
            >
              <ChevronDown className={cn("w-3 h-3 transition-transform", expanded && "rotate-180")} />
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Timeline({ events = [] }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-medium text-white/60">Execution Timeline</h3>
        <div className="flex items-center gap-3">
          {events.length > 0 && (
            <div className="flex items-center gap-2">
              {Object.entries(typeConfig).map(([type, cfg]) => {
                const count = events.filter(e => e.type === type).length;
                if (count === 0) return null;
                const Icon = cfg.icon;
                return (
                  <span key={type} className="flex items-center gap-1 text-[10px] text-white/25">
                    <Icon className={cn("w-3 h-3", cfg.color)} />{count}
                  </span>
                );
              })}
            </div>
          )}
          <span className="text-[11px] text-white/25">{events.length} events</span>
        </div>
      </div>
      <div className="space-y-0 max-h-[600px] overflow-y-auto pr-1">
        {events.map((event, i) => (
          <TimelineEvent
            key={i}
            event={event}
            index={i}
            isLast={i === events.length - 1}
          />
        ))}
        {events.length === 0 && (
          <div className="text-center py-10">
            <Clock className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-xs text-white/30">No events yet</p>
            <p className="text-[10px] text-white/15 mt-1">Events will appear as agents execute steps</p>
          </div>
        )}
      </div>
    </div>
  );
}