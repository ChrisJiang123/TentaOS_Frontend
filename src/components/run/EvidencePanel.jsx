// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Image, Terminal, FileDiff, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import engineClient from '@/lib/engineClient';

function DiffView({ files = [] }) {
  if (!files.length) {
    return <p className="text-xs text-white/35 p-4">暂无文件变更</p>;
  }
  return (
    <div className="space-y-3 max-h-[420px] overflow-auto p-2">
      {files.map((f) => (
        <div key={f.path} className="rounded-lg border border-white/[0.06] overflow-hidden">
          <div className="px-3 py-2 bg-white/[0.04] text-xs font-mono text-cyan-300/90">{f.path}</div>
          <pre className="p-3 text-[11px] font-mono leading-relaxed overflow-x-auto">
            {(f.patch || '').split('\n').map((line, i) => {
              const add = line.startsWith('+') && !line.startsWith('+++');
              const del = line.startsWith('-') && !line.startsWith('---');
              return (
                <div
                  key={i}
                  className={cn(
                    add && 'text-emerald-400/90 bg-emerald-500/10',
                    del && 'text-red-400/90 bg-red-500/10',
                    !add && !del && 'text-white/45',
                  )}
                >
                  {line}
                </div>
              );
            })}
          </pre>
        </div>
      ))}
    </div>
  );
}

export default function EvidencePanel({
  taskId,
  step,
  terminalText = '',
  screenshotUrl,
  diffFiles = [],
  diffLoading = false,
  mode = 'live',
}) {
  const [tab, setTab] = useState('terminal');
  const [fetchedImage, setFetchedImage] = useState(null);
  const [shotLoading, setShotLoading] = useState(false);
  const screenshots = (step?.evidence || []).filter((e) => e.type === 'screenshot');
  const evidenceRef = screenshots[0]?.ref;
  const evidenceImg =
    evidenceRef?.startsWith('data:') || evidenceRef?.startsWith('http') ? evidenceRef : null;

  useEffect(() => {
    if (!taskId || !step?.id) {
      setFetchedImage(null);
      return undefined;
    }
    let cancelled = false;
    setShotLoading(true);
    engineClient
      .fetchScreenshot(taskId, step.id)
      .then((data) => {
        if (!cancelled && data?.image) setFetchedImage(data.image);
      })
      .catch(() => {
        if (!cancelled) setFetchedImage(null);
      })
      .finally(() => {
        if (!cancelled) setShotLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId, step?.id]);

  const imgSrc = fetchedImage || evidenceImg || screenshotUrl || null;

  return (
    <div
      className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden h-full flex flex-col"
      data-testid="evidence-panel"
    >
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-medium text-white">证据</h3>
        {step ? (
          <p className="text-[11px] text-white/40 mt-0.5 truncate">{step.title}</p>
        ) : (
          <p className="text-[11px] text-white/30 mt-0.5">选择左侧步骤查看</p>
        )}
        {mode === 'replay' && (
          <p className="text-[10px] text-purple-400/60 mt-1">Replay — 历史快照</p>
        )}
      </div>
      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-3 mt-2 bg-white/[0.04] border border-white/[0.06]">
          <TabsTrigger value="screenshot" className="text-xs gap-1">
            <Image className="w-3 h-3" /> 截图
          </TabsTrigger>
          <TabsTrigger value="terminal" className="text-xs gap-1">
            <Terminal className="w-3 h-3" /> 终端
          </TabsTrigger>
          <TabsTrigger value="diff" className="text-xs gap-1">
            <FileDiff className="w-3 h-3" /> diff
          </TabsTrigger>
        </TabsList>
        <TabsContent value="screenshot" className="flex-1 m-0 p-3 min-h-[200px]">
          {shotLoading && (
            <div className="flex items-center justify-center py-12 text-white/40 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> 加载截图…
            </div>
          )}
          {!shotLoading && imgSrc ? (
            <a href={imgSrc} target="_blank" rel="noreferrer" className="block">
              <img
                src={imgSrc}
                alt="step screenshot"
                className="rounded-lg border border-white/10 max-h-[360px] w-full object-contain bg-black/40"
              />
            </a>
          ) : null}
          {!shotLoading && !imgSrc && (
            <p className="text-xs text-white/35 text-center py-12">暂无截图</p>
          )}
        </TabsContent>
        <TabsContent value="terminal" className="flex-1 m-0 p-0 min-h-[200px]">
          <pre className="h-full max-h-[400px] overflow-auto p-4 text-[11px] font-mono text-white/55 bg-black/40 leading-relaxed">
            {terminalText || '暂无终端输出'}
          </pre>
        </TabsContent>
        <TabsContent value="diff" className="flex-1 m-0 min-h-[200px]">
          {diffLoading ? (
            <div className="flex items-center justify-center py-16 text-white/40 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> 加载 diff…
            </div>
          ) : (
            <DiffView files={diffFiles} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
