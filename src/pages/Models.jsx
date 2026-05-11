// @ts-nocheck
import React from 'react';
import { Cpu, Zap, Clock, DollarSign, Activity, Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import useSEO from '../lib/useSEO';
import { modelsMock } from '@/data/tentaosDashboardMock';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const providerConfig = {
  anthropic: { label: 'Anthropic', color: '#D97706', icon: '🟠' },
  openai: { label: 'OpenAI', color: '#10B981', icon: '🟢' },
  google: { label: 'Google', color: '#3B82F6', icon: '🔵' },
  deepseek: { label: 'DeepSeek', color: '#8B5CF6', icon: '🟣' },
  local: { label: 'Local', color: '#6B7280', icon: '⚪' },
  openrouter: { label: 'OpenRouter', color: '#EC4899', icon: '🔴' },
  tentaos_pack: { label: 'TentaOS Pack', color: '#06B6D4', icon: '🔷' },
};

export default function Models() {
  const [models, setModels] = React.useState(modelsMock);

  useSEO({
    title: 'AI Models — TentaOS',
    description: 'Connect and use the latest AI models with TentaOS. Support for OpenAI, Claude, and more - all in one unified interface.',
    keywords: 'TentaOS, Models, BYOK, Routing',
  });

  const toggleModel = {
    mutate: (model) => {
      setModels((prev) => prev.map((m) => (m.id === model.id ? { ...m, is_active: !m.is_active } : m)));
    },
  };

  const totalCost = models.reduce((sum, m) => sum + (m.total_cost || 0), 0);
  const totalTokens = models.reduce((sum, m) => sum + (m.total_tokens || 0), 0);

  return (
    <TooltipProvider>
      <div data-testid="models-page" className="min-h-screen p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Cpu className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-semibold text-white tracking-tight">Model Management</h1>
            </div>
            <p className="text-sm text-white/40 mt-1">Configure AI models, track usage, and manage routing</p>
            <p className="text-[11px] text-white/30 mt-1">本地模式：已移除 base44 模型管理接口（避免 api/apps/null 404）。</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() =>
                  setModels((prev) => [
                    ...prev,
                    {
                      id: `m_local_${Date.now()}`,
                      provider: 'local',
                      display_name: 'Local Tentacle',
                      model_id: `local/tentacle-${String(Date.now()).slice(-4)}`,
                      tasks_routed: 0,
                      total_tokens: 0,
                      total_cost: 0,
                      avg_latency_ms: 0,
                      is_active: true,
                    },
                  ])
                }
                className="bg-purple-600 hover:bg-purple-500 text-white h-9 text-xs"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Model
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#151E2E] border border-[rgba(148,163,184,0.16)] text-[#F8FAFC]">
              当前为本地 mock（后续可接入 Engine 的模型列表接口）
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Active Models</p>
            <p className="text-2xl font-semibold text-white mt-1">{models.filter(m => m.is_active).length}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Total Tokens</p>
            <p className="text-2xl font-semibold text-white mt-1">{(totalTokens / 1000000).toFixed(1)}M</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Total Cost</p>
            <p className="text-2xl font-semibold text-white mt-1">${totalCost.toFixed(2)}</p>
          </div>
        </div>

        {/* Model Cards */}
        <div className="space-y-3">
          {models.map((model, i) => {
            const provider = providerConfig[model.provider] || providerConfig.local;
            return (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex items-center gap-4 transition-all",
                  !model.is_active && "opacity-50"
                )}
              >
                <div className="text-2xl">{provider.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white">{model.display_name}</h3>
                    <span className="text-[11px] text-white/30 font-mono">{model.model_id}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-[11px] text-white/40">
                    <span style={{ color: provider.color }}>{provider.label}</span>
                    <span>{model.tasks_routed} tasks routed</span>
                    <span>{((model.total_tokens || 0) / 1000).toFixed(0)}K tokens</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{model.avg_latency_ms}ms</span>
                  </div>
                </div>
                <div className="text-right mr-2">
                  <p className="text-sm font-medium text-white">${(model.total_cost || 0).toFixed(2)}</p>
                  <p className="text-[11px] text-white/30">total cost</p>
                </div>
                <Switch
                  checked={model.is_active}
                  onCheckedChange={() => toggleModel.mutate(model)}
                />
              </motion.div>
            );
          })}
          {models.length === 0 && (
            <div className="text-center py-20">
              <Cpu className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-white/40 mb-1">No models configured</h3>
              <p className="text-xs text-white/25">Add your first model to start routing AI tasks.</p>
            </div>
          )}
        </div>

        {/* base44 CreateModelDialog 已移除 */}
        </div>
      </div>
    </TooltipProvider>
  );
}