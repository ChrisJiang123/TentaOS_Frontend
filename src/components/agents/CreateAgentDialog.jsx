import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Bot, Loader2 } from 'lucide-react';

const roles = ['planner', 'researcher', 'coder', 'writer', 'operator', 'reviewer'];
const permissions = ['observe', 'suggest', 'execute', 'autonomous'];
const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

export default function CreateAgentDialog({ open, onClose, onCreate }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: 'planner',
    model_id: 'gpt-4o-mini',
    permission_level: 'execute',
    system_prompt: '',
    avatar_color: colors[Math.floor(Math.random() * colors.length)],
  });

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onCreate({
      ...form,
      is_active: true,
      tools: [],
      tasks_completed: 0,
      total_tokens: 0,
      total_cost: 0,
    });
    setSaving(false);
    setForm({ name: '', role: 'planner', model_id: 'gpt-4o-mini', permission_level: 'execute', system_prompt: '', avatar_color: colors[Math.floor(Math.random() * colors.length)] });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#13131A] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            Create Agent
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Research Agent"
              className="bg-white/[0.04] border-white/[0.08] text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Role</label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A24] border-white/10">
                  {roles.map(r => <SelectItem key={r} value={r} className="capitalize text-white/70">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Permission</label>
              <Select value={form.permission_level} onValueChange={(v) => setForm({ ...form, permission_level: v })}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A24] border-white/10">
                  {permissions.map(p => <SelectItem key={p} value={p} className="capitalize text-white/70">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Model ID</label>
            <Input
              value={form.model_id}
              onChange={(e) => setForm({ ...form, model_id: e.target.value })}
              placeholder="e.g. gpt-4o-mini"
              className="bg-white/[0.04] border-white/[0.08] text-white"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">System Prompt (optional)</label>
            <Textarea
              value={form.system_prompt}
              onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
              placeholder="Instructions for this agent..."
              className="bg-white/[0.04] border-white/[0.08] text-white h-20"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Color</label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, avatar_color: c })}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: form.avatar_color === c ? 'white' : 'transparent' }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-white/50">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.name.trim()} className="bg-blue-600 hover:bg-blue-500">
            {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Creating...</> : 'Create Agent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}