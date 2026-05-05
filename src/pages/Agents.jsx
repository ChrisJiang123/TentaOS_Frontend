import React from 'react';
import { Bot, Settings, Wrench, Shield, Zap, DollarSign, Hash, ChevronRight, Plus, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import useSEO from '../lib/useSEO';

const permissionLabels = {
  observe: { label: 'Observe', color: 'text-white/40', desc: 'Can only watch, no actions' },
  suggest: { label: 'Suggest', color: 'text-blue-400', desc: 'Can suggest actions for approval' },
  execute: { label: 'Execute', color: 'text-emerald-400', desc: 'Can execute with approval gates' },
  autonomous: { label: 'Autonomous', color: 'text-amber-400', desc: 'Full autonomy, no approval needed' },
};

const toolLabels = {
  web_search: '🔍 Web Search',
  browser: '🌐 Browser',
  code_executor: '⚡ Code Executor',
  file_manager: '📁 File Manager',
  doc_generator: '📄 Doc Generator',
  http_client: '🔗 HTTP Client',
};

function AgentCard({ agent, onToggle, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const perm = permissionLabels[agent.permission_level] || permissionLabels.execute;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
          style={{ backgroundColor: agent.avatar_color + '15', color: agent.avatar_color }}
        >
          {agent.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium text-white">{agent.name}</h3>
            <span className={cn("text-[11px] font-medium capitalize", perm.color)}>{perm.label}</span>
          </div>
          <p className="text-xs text-white/40 mt-0.5">{agent.model_id}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm text-white/70">{agent.tasks_completed} tasks</p>
            <p className="text-xs text-white/30">${(agent.total_cost || 0).toFixed(2)}</p>
          </div>
          <Switch
            checked={agent.is_active}
            onCheckedChange={() => onToggle(agent)}
            onClick={(e) => e.stopPropagation()}
          />
          <ChevronRight className={cn("w-4 h-4 text-white/20 transition-transform", expanded && "rotate-90")} />
        </div>
      </button>

      {expanded && !editing && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          className="border-t border-white/[0.06] p-5 space-y-4"
        >
          {/* System Prompt */}
          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">System Prompt</label>
            <div className="bg-black/20 border border-white/[0.06] rounded-lg p-3 text-xs text-white/60 font-mono">
              {agent.system_prompt || 'No system prompt configured'}
            </div>
          </div>

          {/* Temperature + Model */}
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>Model: <span className="text-white/60">{agent.model_id}</span></span>
            <span>Temp: <span className="text-white/60">{(agent.temperature ?? 0.7).toFixed(1)}</span></span>
          </div>

          {/* Capabilities */}
          {(agent.capabilities || []).length > 0 && (
            <div>
              <label className="text-xs font-medium text-white/50 mb-2 block flex items-center gap-1.5">
                <Wrench className="w-3 h-3" /> Capabilities
              </label>
              <div className="flex flex-wrap gap-2">
                {(agent.capabilities || []).map(cap => (
                  <span key={cap} className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
                    {cap.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {(agent.tools || []).length > 0 && (
            <div>
              <label className="text-xs font-medium text-white/50 mb-2 block flex items-center gap-1.5">
                <Wrench className="w-3 h-3" /> Tools
              </label>
              <div className="flex flex-wrap gap-2">
                {(agent.tools || []).map(tool => (
                  <span key={tool} className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs text-white/60">
                    {toolLabels[tool] || tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/[0.03] rounded-lg p-3">
              <p className="text-xs text-white/40 flex items-center gap-1"><Hash className="w-3 h-3" /> Tasks</p>
              <p className="text-lg font-semibold text-white mt-1">{agent.tasks_completed}</p>
              {agent.tasks_failed > 0 && <p className="text-[10px] text-red-400">{agent.tasks_failed} failed</p>}
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3">
              <p className="text-xs text-white/40 flex items-center gap-1"><Zap className="w-3 h-3" /> Tokens</p>
              <p className="text-lg font-semibold text-white mt-1">{((agent.total_tokens || 0) / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3">
              <p className="text-xs text-white/40 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Cost</p>
              <p className="text-lg font-semibold text-white mt-1">${(agent.total_cost || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3">
              <p className="text-xs text-white/40 flex items-center gap-1"><Shield className="w-3 h-3" /> Retries</p>
              <p className="text-lg font-semibold text-white mt-1">{agent.max_retries ?? 2}</p>
            </div>
          </div>

          {/* Edit Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(true)}
            className="border-white/10 text-white/50 hover:text-white h-8 text-xs"
          >
            <Pencil className="w-3 h-3 mr-1" /> Edit Agent
          </Button>
        </motion.div>
      )}
      {expanded && editing && (
        <AgentEditor
          agent={agent}
          onSave={() => { setEditing(false); onUpdated(); }}
          onCancel={() => setEditing(false)}
        />
      )}
    </motion.div>
  );
}

export default function Agents() {
  useSEO({
    title: 'AI Agents — TentaOS',
    description: 'Manage and monitor your AI agents in real-time with TentaOS. Track performance, view logs, and control agent behavior.',
  });

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Bot className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-semibold text-white tracking-tight">Agent Management</h1>
            </div>
            <p className="text-sm text-white/40 mt-1">Configure your AI agents, models, tools, and permissions</p>
          </div>
          <Button disabled className="bg-blue-600/40 text-white h-9 text-xs cursor-not-allowed">
            <Plus className="w-4 h-4 mr-1" /> New Agent
          </Button>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-white/50 text-sm">
          本地模式：已移除 base44 Agent entity（避免 <code className="text-white/60">api/apps/null</code> 404）。
          如需 Agent 管理，请在 Engine 提供相应 REST 接口后再接入。
        </div>
      </div>
    </div>
  );
}