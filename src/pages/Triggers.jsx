// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { Zap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TriggerCard from '../components/triggers/TriggerCard';
import { triggersMock } from '@/data/tentaosDashboardMock';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function Triggers() {
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();
  const [triggers, setTriggers] = useState(() =>
    triggersMock.map((t) => ({
      id: t.id,
      name: t.name,
      trigger_type: t.type === 'schedule' ? 'schedule' : t.type === 'api' ? 'webhook' : 'manual',
      is_active: Boolean(t.is_active),
      trigger_count: t.trigger_count || t.trigger_count === 0 ? t.trigger_count : t.trigger_count,
      last_triggered: t.last_fired_at || null,
      condition: t.type === 'schedule' ? t.schedule : null,
      task_template: { title: 'Frontend-backend health check', goal: 'Probe engine health and WS stability', priority: 'low' },
      agent_name: 'Operator',
    }))
  );

  const filtered = useMemo(() => {
    return triggers.filter((t) => {
      if (filter === 'active') return t.is_active;
      if (filter === 'inactive') return !t.is_active;
      return true;
    });
  }, [filter, triggers]);

  return (
    <TooltipProvider>
      <div data-testid="triggers-page" className="min-h-screen p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Zap className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl font-semibold text-white tracking-tight">Workflow Triggers</h1>
            </div>
            <p className="text-sm text-white/40 mt-1">Automate AI agent tasks with webhooks, schedules, and events</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled className="bg-amber-600/40 text-white h-9 text-xs cursor-not-allowed">
                <Plus className="w-4 h-4 mr-1" /> New Trigger
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#151E2E] border border-[rgba(148,163,184,0.16)] text-[#F8FAFC]">
              需要 Engine 的 triggers 管理接口（未接入）
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40">Total</p>
            <p className="text-2xl font-semibold text-white mt-1">{triggers.length}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40">Active</p>
            <p className="text-2xl font-semibold text-emerald-400 mt-1">{triggers.filter(t => t.is_active).length}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40">Total Fires</p>
            <p className="text-2xl font-semibold text-white mt-1">{triggers.reduce((s, t) => s + (t.trigger_count || 0), 0)}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="bg-white/[0.04] border border-white/[0.06]">
              <TabsTrigger value="all" className="text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/50">All</TabsTrigger>
              <TabsTrigger value="active" className="text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/50">Active</TabsTrigger>
              <TabsTrigger value="inactive" className="text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/50">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.map(t => (
            <TriggerCard
              key={t.id}
              trigger={t}
              onToggle={(tr) => setTriggers((prev) => prev.map((x) => (x.id === tr.id ? { ...x, is_active: !x.is_active } : x)))}
              onFire={(tr) => toast({ title: '⚡ Trigger Fired', description: `Fired “${tr.name}” (mock).` })}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-20">
              <Zap className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-white/40 mb-1">{triggers.length === 0 ? 'No triggers yet' : 'No matching triggers'}</h3>
              <p className="text-xs text-white/25">Create a trigger to automate agent tasks.</p>
            </div>
          )}
        </div>

        </div>
      </div>
    </TooltipProvider>
  );
}