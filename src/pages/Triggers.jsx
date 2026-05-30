// @ts-nocheck
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Plus, Loader2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  fetchTriggers,
  createTrigger,
  updateTrigger,
  deleteTrigger,
} from '@/lib/controlPlaneApi';

const DEMO_STORAGE_KEY = 'tentaos_triggers_demo_v1';
const TRIGGER_TYPES = [
  { value: 'schedule', label: 'Schedule (cron)' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'file', label: 'File watch' },
  { value: 'task_failure', label: 'Task failure' },
];

function loadLocalDemo() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    /* ignore */
  }
  return [
    {
      id: 'demo_schedule_1',
      name: 'Daily health probe',
      trigger_type: 'schedule',
      schedule: '0 8 * * *',
      is_active: true,
      trigger_count: 0,
      last_triggered: null,
    },
  ];
}

function saveLocalDemo(items) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export default function Triggers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localMode, setLocalMode] = useState(false);
  const [localItems, setLocalItems] = useState(() => loadLocalDemo());
  const [form, setForm] = useState({ name: '', trigger_type: 'schedule', schedule: '0 9 * * *' });

  const triggersQuery = useQuery({
    queryKey: ['control-plane-triggers'],
    queryFn: fetchTriggers,
    retry: 0,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (triggersQuery.data && !triggersQuery.data.ok) {
      setLocalMode(true);
    }
  }, [triggersQuery.data]);

  const engineItems = Array.isArray(triggersQuery.data?.items) ? triggersQuery.data.items : [];
  const localList = Array.isArray(localItems) ? localItems : [];
  const items = localMode ? localList : engineItems;
  const isLoading = triggersQuery.isLoading && !localMode;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['control-plane-triggers'] });

  const createMut = useMutation({
    mutationFn: async (payload) => {
      if (localMode) {
        const item = {
          id: `local_${Date.now()}`,
          ...payload,
          is_active: true,
          trigger_count: 0,
          last_triggered: null,
        };
        setLocalItems((prev) => {
          const next = [item, ...prev];
          saveLocalDemo(next);
          return next;
        });
        return { ok: true };
      }
      return createTrigger(payload);
    },
    onSuccess: (res) => {
      if (!localMode && !res.ok) {
        toast({ title: 'Create failed', description: res.error, variant: 'destructive' });
        return;
      }
      toast({ title: localMode ? 'Created (local demo)' : 'Trigger created' });
      setForm({ name: '', trigger_type: 'schedule', schedule: '0 9 * * *' });
      if (!localMode) refresh();
    },
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, is_active }) => {
      if (localMode) {
        setLocalItems((prev) => {
          const next = prev.map((t) => (t.id === id ? { ...t, is_active } : t));
          saveLocalDemo(next);
          return next;
        });
        return { ok: true };
      }
      return updateTrigger(id, { is_active });
    },
    onSuccess: (res) => {
      if (!localMode && !res.ok) {
        toast({ title: 'Update failed', description: res.error, variant: 'destructive' });
        return;
      }
      if (!localMode) refresh();
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id) => {
      if (localMode) {
        setLocalItems((prev) => {
          const next = prev.filter((t) => t.id !== id);
          saveLocalDemo(next);
          return next;
        });
        return { ok: true };
      }
      return deleteTrigger(id);
    },
    onSuccess: (res) => {
      if (!localMode && !res.ok) {
        toast({ title: 'Delete failed', description: res.error, variant: 'destructive' });
        return;
      }
      if (!localMode) refresh();
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      trigger_type: form.trigger_type,
      ...(form.trigger_type === 'schedule' ? { schedule: form.schedule } : {}),
    };
    createMut.mutate(payload);
  };

  return (
    <div data-testid="triggers-page" className="min-h-screen p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Zap className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-semibold text-white tracking-tight">Workflow Triggers</h1>
          </div>
          <p className="text-sm text-white/40 mt-1">Schedule, webhook, file, and task-failure triggers</p>
          {localMode && (
            <p className="text-[11px] text-amber-300/80 mt-2 border border-amber-500/20 bg-amber-500/5 rounded-lg px-3 py-2">
              Local demo mode — changes stored in this browser only until GET /api/triggers is available.
            </p>
          )}
          {isLoading && (
            <p className="text-[11px] text-white/25 mt-2 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading triggers…
            </p>
          )}
        </div>

        <form onSubmit={handleCreate} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mb-6 space-y-3">
          <p className="text-xs font-medium text-white/50">New trigger</p>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Trigger name"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white"
          />
          <select
            value={form.trigger_type}
            onChange={(e) => setForm((f) => ({ ...f, trigger_type: e.target.value }))}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white"
          >
            {TRIGGER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {form.trigger_type === 'schedule' && (
            <input
              value={form.schedule}
              onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
              placeholder="Cron expression"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white font-mono"
            />
          )}
          <Button type="submit" disabled={createMut.isPending} className="bg-amber-600 hover:bg-amber-500 text-white h-9 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Create trigger
          </Button>
        </form>

        <div className="space-y-3">
          {items.map((trigger) => (
            <TriggerRow
              key={trigger.id}
              trigger={trigger}
              onToggle={(is_active) => toggleMut.mutate({ id: trigger.id, is_active })}
              onDelete={() => deleteMut.mutate(trigger.id)}
            />
          ))}
          {!isLoading && items.length === 0 && (
            <p className="text-center text-sm text-white/30 py-12">No triggers yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TriggerRow({ trigger, onToggle, onDelete }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-white">{trigger.name}</p>
        <p className="text-[11px] text-white/40 mt-1 capitalize">
          {trigger.trigger_type?.replace('_', ' ')}
          {trigger.schedule && ` · ${trigger.schedule}`}
        </p>
        <p className="text-[10px] text-white/25 mt-1">
          fires: {trigger.trigger_count ?? 0}
          {trigger.last_triggered && (() => {
            try {
              return ` · last: ${new Date(trigger.last_triggered).toLocaleString()}`;
            } catch {
              return '';
            }
          })()}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggle(!trigger.is_active)}
          className="text-white/40 hover:text-white/70"
          aria-label="Toggle active"
        >
          {trigger.is_active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
        </button>
        <button type="button" onClick={onDelete} className="text-red-400/60 hover:text-red-400">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
