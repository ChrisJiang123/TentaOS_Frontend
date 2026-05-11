// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { Bot, Wrench, Shield, Zap, DollarSign, Hash, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import useSEO from '../lib/useSEO';
import { agentsMock } from '@/data/tentaosDashboardMock';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const permissionLabels = {
  observe: { label: 'Observe', color: 'text-white/40', desc: 'Can only watch, no actions' },
  suggest: { label: 'Suggest', color: 'text-[#38BDF8]', desc: 'Can suggest actions for approval' },
  execute: { label: 'Execute', color: 'text-[#34D399]', desc: 'Can execute with approval gates' },
  autonomous: { label: 'Autonomous', color: 'text-[#FBBF24]', desc: 'Full autonomy, no approval needed' },
};

const toolLabels = {
  web_search: '🔍 Web Search',
  browser: '🌐 Browser',
  code_executor: '⚡ Code Executor',
  file_manager: '📁 File Manager',
  doc_generator: '📄 Doc Generator',
  http_client: '🔗 HTTP Client',
};

function AgentRow({ agent, onToggle }) {
  const [open, setOpen] = useState(false);
  const perm = permissionLabels[agent.permission_level] || permissionLabels.execute;

  return (
    <motion.div
      layout
      className="bg-[#151E2E] border border-[rgba(148,163,184,0.16)] rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((v) => !v)}
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
            onCheckedChange={() => onToggle(agent.id)}
            onClick={(e) => e.stopPropagation()}
          />
          <ChevronDown className={cn("w-4 h-4 text-white/20 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/[0.06] px-5 pb-5 overflow-hidden"
          >
            <div className="pt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-white/50 mb-2 block">System Prompt</label>
                <div className="bg-black/20 border border-white/[0.06] rounded-lg p-3 text-xs text-white/60 font-mono">
                  {agent.system_prompt || 'No system prompt configured'}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <p className="text-xs text-white/40 flex items-center gap-1"><Hash className="w-3 h-3" /> Tasks</p>
                  <p className="text-lg font-semibold text-white mt-1">{agent.tasks_completed}</p>
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

              {(agent.tools || []).length > 0 && (
                <div>
                  <label className="text-xs font-medium text-white/50 mb-2 block flex items-center gap-1.5">
                    <Wrench className="w-3 h-3" /> Tools
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(agent.tools || []).map((tool) => (
                      <span
                        key={tool}
                        className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs text-white/60"
                      >
                        {toolLabels[tool] || tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Agents() {
  useSEO({
    title: 'Agents — TentaOS',
    description: 'Available execution units / agent profiles for Cortex and Tentacular Runtime.',
    keywords: 'TentaOS, Agents, Cortex, Tentacles',
  });

  const [agents, setAgents] = useState(agentsMock);
  const activeCount = useMemo(() => agents.filter((a) => a.is_active).length, [agents]);

  return (
    <TooltipProvider>
      <div data-testid="agents-page" className="min-h-screen p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Bot className="w-6 h-6 text-[#38BDF8]" />
                <h1 className="text-2xl font-semibold text-white tracking-tight">Agents</h1>
              </div>
              <p className="text-sm text-white/40 mt-1">
                Available execution units / agent profiles.
                <span className="text-white/25"> Active: {activeCount}/{agents.length}</span>
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled className="bg-[#38BDF8]/30 text-white h-9 text-xs cursor-not-allowed">
                  <Plus className="w-4 h-4 mr-1" /> New Agent
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#151E2E] border border-[rgba(148,163,184,0.16)] text-[#F8FAFC]">
                需要 Engine 的 agent 管理接口（未接入）
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-3">
            {agents.map((agent) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                onToggle={(id) =>
                  setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: !a.is_active } : a)))
                }
              />
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}