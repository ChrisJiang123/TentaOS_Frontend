// @ts-nocheck
import React, { useState } from 'react';
import { Webhook, Upload, Clock, Database, Hand, ChevronRight, Zap, Activity } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import moment from 'moment';

const triggerMeta = {
  webhook:       { icon: Webhook,  color: '#3B82F6' },
  file_upload:   { icon: Upload,   color: '#10B981' },
  schedule:      { icon: Clock,    color: '#F59E0B' },
  entity_change: { icon: Database, color: '#8B5CF6' },
  manual:        { icon: Hand,     color: '#EC4899' },
};

export default function TriggerCard({ trigger, onToggle, onFire }) {
  const [expanded, setExpanded] = useState(false);
  const meta = triggerMeta[trigger.trigger_type] || triggerMeta.manual;
  const Icon = meta.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden", !trigger.is_active && "opacity-50")}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: meta.color + '15' }}>
          <Icon className="w-5 h-5" style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white truncate">{trigger.name}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ backgroundColor: meta.color + '15', color: meta.color }}>
              {trigger.trigger_type?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-white/40 mt-0.5 truncate">{trigger.task_template?.goal || trigger.condition || 'No description'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-white/50">{trigger.trigger_count || 0} fires</p>
            <p className="text-[10px] text-white/30">{trigger.last_triggered ? moment(trigger.last_triggered).fromNow() : 'Never'}</p>
          </div>
          <Switch checked={trigger.is_active} onCheckedChange={() => onToggle(trigger)} onClick={(e) => e.stopPropagation()} />
          <ChevronRight className={cn("w-4 h-4 text-white/20 transition-transform", expanded && "rotate-90")} />
        </div>
      </button>

      {expanded && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="border-t border-white/[0.06] p-5 space-y-4">
          {/* Template */}
          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">Task Template</label>
            <div className="bg-black/20 border border-white/[0.06] rounded-lg p-3 space-y-1 text-xs text-white/70">
              <p><span className="text-white/40">Title:</span> {trigger.task_template?.title || 'Auto-generated'}</p>
              <p><span className="text-white/40">Goal:</span> {trigger.task_template?.goal || '—'}</p>
              <p><span className="text-white/40">Priority:</span> {trigger.task_template?.priority || 'medium'}</p>
            </div>
          </div>

          {trigger.condition && (
            <div>
              <label className="text-xs font-medium text-white/50 mb-2 block">Condition</label>
              <code className="block bg-black/20 border border-white/[0.06] rounded-lg p-3 text-xs text-white/60 font-mono">{trigger.condition}</code>
            </div>
          )}

          {trigger.agent_name && (
            <p className="text-xs text-white/50">Agent: <span className="text-white/70">{trigger.agent_name}</span></p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] rounded-lg p-3">
              <p className="text-xs text-white/40 flex items-center gap-1"><Activity className="w-3 h-3" /> Total Fires</p>
              <p className="text-lg font-semibold text-white mt-1">{trigger.trigger_count || 0}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3">
              <p className="text-xs text-white/40 flex items-center gap-1"><Clock className="w-3 h-3" /> Last Fired</p>
              <p className="text-sm font-medium text-white mt-1">{trigger.last_triggered ? moment(trigger.last_triggered).format('MMM D, HH:mm') : 'Never'}</p>
            </div>
          </div>

          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white h-8 text-xs" onClick={(e) => { e.stopPropagation(); onFire(trigger); }}>
            <Zap className="w-3 h-3 mr-1" /> Fire Now
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}