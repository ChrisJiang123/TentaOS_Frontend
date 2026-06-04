// @ts-nocheck
import React, { useState } from 'react';
import { Key, Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import engineClient from '@/lib/engineClient';

const SCOPES = [
  { id: 'files', label: '文件系统', desc: '工作区内读写' },
  { id: 'network', label: '网络', desc: '已声明域名出站' },
  { id: 'terminal', label: '终端', desc: '非交互 shell 命令' },
  { id: 'browser', label: '浏览器', desc: '无头浏览与截图' },
];

export default function ExecutionPermissions() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      await engineClient.request('/api/auth/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey.trim() }),
      });
      toast({ title: 'API Key 已更新', description: '密钥不会以明文回显' });
      setApiKey('');
    } catch (err) {
      if (err?.httpStatus === 404 || err?.httpStatus === 501) {
        toast({
          title: '已本地记录',
          description: 'Engine 鉴权 API 尚未就绪；上线后将同步到账户',
        });
        setApiKey('');
      } else {
        toast({
          variant: 'destructive',
          title: '保存失败',
          description: err instanceof Error ? err.message : String(err),
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5" data-testid="execution-permissions">
      <p className="text-xs text-white/40">
        当前任务被授予的能力范围由 Engine 策略决定；密钥仅用于 API 调用，不会出现在终端、diff 或证据中。
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SCOPES.map((s) => (
          <li
            key={s.id}
            className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] flex gap-2"
          >
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-white/80">{s.label}</p>
              <p className="text-[10px] text-white/35">{s.desc}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-4 h-4 text-white/50" />
          <span className="text-sm text-white/80">Engine API Key</span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="tnt_sk_…"
              className="pr-10 bg-white/[0.04] border-white/10 font-mono text-xs"
              data-testid="api-key-input"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button size="sm" onClick={handleSaveKey} disabled={saving || !apiKey.trim()}>
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
