// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  DEFAULT_PREFERENCE_RULES,
  getPreferences,
  putPreferences,
} from '@/lib/preferencesApi';

export default function ExecutionPreferences() {
  const { toast } = useToast();
  const [rules, setRules] = useState([...DEFAULT_PREFERENCE_RULES]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPreferences()
      .then((doc) => setRules(doc.rules || DEFAULT_PREFERENCE_RULES))
      .catch(() => setRules([...DEFAULT_PREFERENCE_RULES]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id, enabled) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)));
  };

  const setValue = (id, value) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await putPreferences({ rules });
      toast({ title: '偏好已保存', description: '后续规划与任务将携带这些规则' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: '保存失败',
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-white/40 py-4">
        <Loader2 className="w-4 h-4 animate-spin" /> 加载执行偏好…
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="execution-preferences">
      <p className="text-xs text-white/40">
        这些规则会随每次 <code className="text-white/50">POST /api/plan</code> 与{' '}
        <code className="text-white/50">POST /api/task</code> 的 preferences 字段发送。
      </p>
      <ul className="space-y-3">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className="flex items-start justify-between gap-4 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/85">{rule.label}</p>
              {rule.id === 'preferred_model' && rule.enabled && (
                <Input
                  value={rule.value || ''}
                  onChange={(e) => setValue(rule.id, e.target.value)}
                  placeholder="claude / gpt-4"
                  className="mt-2 h-8 text-xs bg-white/[0.04] border-white/10"
                />
              )}
            </div>
            <Switch checked={rule.enabled !== false} onCheckedChange={(v) => toggle(rule.id, v)} />
          </li>
        ))}
      </ul>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={saving}
        className="bg-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/30 border border-[#00E5FF]/30"
        data-testid="save-preferences"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-2" />}
        保存执行偏好
      </Button>
    </div>
  );
}
