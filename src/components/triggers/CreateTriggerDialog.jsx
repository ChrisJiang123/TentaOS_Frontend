import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Webhook, Upload, Clock, Database, Hand } from 'lucide-react';
import { cn } from '@/lib/utils';

const types = [
  { value: 'webhook',       label: 'Webhook',       icon: Webhook,  color: '#3B82F6', desc: 'External API call' },
  { value: 'file_upload',   label: 'File Upload',   icon: Upload,   color: '#10B981', desc: 'New file detected' },
  { value: 'schedule',      label: 'Schedule',      icon: Clock,    color: '#F59E0B', desc: 'Cron / interval' },
  { value: 'entity_change', label: 'Entity Change', icon: Database, color: '#8B5CF6', desc: 'Data mutation' },
  { value: 'manual',        label: 'Manual',        icon: Hand,     color: '#EC4899', desc: 'On-demand' },
];

export default function CreateTriggerDialog({ open, onClose, onCreate, agents = [] }) {
  const [f, setF] = useState({ name: '', trigger_type: 'webhook', condition: '', agent_id: '', agent_name: '', title: '', goal: '', priority: 'medium' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!f.name) return;
    setLoading(true);
    await onCreate({
      name: f.name,
      trigger_type: f.trigger_type,
      condition: f.condition,
      agent_id: f.agent_id,
      agent_name: f.agent_name,
      task_template: { title: f.title || `Auto: ${f.name}`, goal: f.goal, priority: f.priority },
      is_active: true,
      trigger_count: 0,
    });
    setLoading(false);
    setF({ name: '', trigger_type: 'webhook', condition: '', agent_id: '', agent_name: '', title: '', goal: '', priority: 'medium' });
    onClose();
  };

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0E1117] border-white/[0.08] text-white max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-white">New Workflow Trigger</DialogTitle></DialogHeader>
        <div className="space-y-5 mt-2">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Name</label>
            <Input value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. New Lead Webhook" className="bg-white/[0.04] border-white/[0.08] text-white" />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-2 block">Trigger Type</label>
            <div className="grid grid-cols-3 gap-2">
              {types.map(t => (
                <button key={t.value} onClick={() => set('trigger_type', t.value)}
                  className={cn("p-3 rounded-lg border text-left transition-all", f.trigger_type === t.value ? "border-blue-500/40 bg-blue-500/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]")}>
                  <t.icon className="w-4 h-4 mb-1" style={{ color: t.color }} />
                  <p className="text-xs font-medium text-white">{t.label}</p>
                  <p className="text-[10px] text-white/30">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Condition (optional)</label>
            <Input value={f.condition} onChange={e => set('condition', e.target.value)} placeholder='e.g. payload.event === "new_lead"' className="bg-white/[0.04] border-white/[0.08] text-white font-mono text-xs" />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Assign Agent</label>
            <select value={f.agent_id} onChange={e => { const a = agents.find(x => x.id === e.target.value); set('agent_id', e.target.value); set('agent_name', a?.name || ''); }}
              className="w-full h-9 rounded-md bg-white/[0.04] border border-white/[0.08] text-white text-sm px-3">
              <option value="">Auto-assign</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-xs text-white/50 block">Task Template</label>
            <Input value={f.title} onChange={e => set('title', e.target.value)} placeholder="Task title" className="bg-white/[0.04] border-white/[0.08] text-white" />
            <Input value={f.goal} onChange={e => set('goal', e.target.value)} placeholder="Task goal" className="bg-white/[0.04] border-white/[0.08] text-white" />
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map(p => (
                <button key={p} onClick={() => set('priority', p)}
                  className={cn("flex-1 py-2 rounded-lg text-xs font-medium border transition-all capitalize", f.priority === p ? "border-blue-500/40 bg-blue-500/10 text-blue-400" : "border-white/[0.06] bg-white/[0.02] text-white/40 hover:bg-white/[0.04]")}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={submit} disabled={!f.name || loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
            {loading ? 'Creating...' : 'Create Trigger'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}