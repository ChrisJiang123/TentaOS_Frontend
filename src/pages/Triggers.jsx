import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TriggerCard from '../components/triggers/TriggerCard';
import CreateTriggerDialog from '../components/triggers/CreateTriggerDialog';

export default function Triggers() {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: triggers = [] } = useQuery({
    queryKey: ['triggers'],
    queryFn: async () => [],
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => [],
  });

  // Real-time updates
  useEffect(() => {
    return () => {};
  }, [queryClient]);

  const toggleTrigger = useMutation({
    mutationFn: async () => {},
  });

  const createTrigger = useMutation({
    mutationFn: async () => {},
    onSuccess: () => toast({ title: '本地模式', description: 'Triggers 未接入 Engine，暂不可用。' }),
  });

  const fireTrigger = useMutation({
    mutationFn: async (t) => {
      return { message: 'Triggers 未接入 Engine，暂不可用。' };
    },
    onSuccess: (data) => {
      toast({ title: '⚡ Trigger Fired', description: data.message });
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const filtered = triggers.filter(t => {
    if (filter === 'active') return t.is_active;
    if (filter === 'inactive') return !t.is_active;
    return true;
  });

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Zap className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl font-semibold text-white tracking-tight">Workflow Triggers</h1>
            </div>
            <p className="text-sm text-white/40 mt-1">Automate AI agent tasks with webhooks, schedules, and events</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-amber-600 hover:bg-amber-500 text-white h-9 text-xs">
            <Plus className="w-4 h-4 mr-1" /> New Trigger
          </Button>
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
            <TriggerCard key={t.id} trigger={t} onToggle={(tr) => toggleTrigger.mutate(tr)} onFire={(tr) => fireTrigger.mutate(tr)} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-20">
              <Zap className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-white/40 mb-1">{triggers.length === 0 ? 'No triggers yet' : 'No matching triggers'}</h3>
              <p className="text-xs text-white/25">Create a trigger to automate agent tasks.</p>
            </div>
          )}
        </div>

        <CreateTriggerDialog open={showCreate} onClose={() => setShowCreate(false)} onCreate={(d) => createTrigger.mutateAsync(d)} agents={agents} />
      </div>
    </div>
  );
}