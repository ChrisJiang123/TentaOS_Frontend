import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Cpu, Loader2 } from 'lucide-react';

const providers = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'local', label: 'Local (Ollama)' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'tentaos_pack', label: 'TentaOS Pack' },
];

export default function CreateModelDialog({ open, onClose, onCreate }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    provider: 'openai',
    model_id: '',
    display_name: '',
    endpoint: '',
  });

  const handleSubmit = async () => {
    if (!form.model_id.trim() || !form.display_name.trim()) return;
    setSaving(true);
    await onCreate({
      ...form,
      is_active: true,
      tasks_routed: 0,
      total_tokens: 0,
      total_cost: 0,
      avg_latency_ms: 0,
    });
    setSaving(false);
    setForm({ provider: 'openai', model_id: '', display_name: '', endpoint: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#13131A] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Add Model
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Provider</label>
            <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
              <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A24] border-white/10">
                {providers.map(p => <SelectItem key={p.value} value={p.value} className="text-white/70">{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Display Name</label>
            <Input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="e.g. GPT-4o Mini"
              className="bg-white/[0.04] border-white/[0.08] text-white"
            />
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
            <label className="text-xs text-white/50 mb-1.5 block">Endpoint (optional)</label>
            <Input
              value={form.endpoint}
              onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
              placeholder="e.g. http://localhost:11434"
              className="bg-white/[0.04] border-white/[0.08] text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-white/50">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.model_id.trim()} className="bg-purple-600 hover:bg-purple-500">
            {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Adding...</> : 'Add Model'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}