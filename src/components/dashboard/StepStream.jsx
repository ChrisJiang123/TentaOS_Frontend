import React, { useState, useEffect, useRef } from 'react';
import engineClient from '@/lib/engineClient';
import { ListTree } from 'lucide-react';

const LABELS = {
  task_started: '任务开始',
  task_completed: '任务完成',
  step_started: '步骤开始',
  step_completed: '步骤完成',
  browser_action: '浏览器',
  terminal_output: '终端',
  approval_required: '待审批',
};

function summarize(data) {
  if (!data || typeof data !== 'object') return '';
  return (
    data.message ||
    data.step_name ||
    data.name ||
    data.title ||
    data.detail ||
    data.description ||
    data.summary ||
    (data.task_id ? `task: ${data.task_id}` : '') ||
    ''
  );
}

export default function StepStream() {
  const [events, setEvents] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const types = [
      'task_started',
      'task_completed',
      'step_started',
      'step_completed',
      'browser_action',
      'terminal_output',
      'approval_required',
    ];
    const unsubs = types.map((t) =>
      engineClient.on(t, (d) => {
        setEvents((prev) => [...prev.slice(-199), { type: t, data: d, ts: Date.now() }]);
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events]);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <ListTree className="w-4 h-4 text-violet-400" />
        <span className="text-xs font-medium text-white">实时步骤流</span>
        {events.length > 0 && (
          <span className="text-[10px] text-white/30 ml-auto">{events.length} 条事件</span>
        )}
      </div>
      <div
        ref={scrollRef}
        className="p-3 h-56 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2 bg-[#07070c]"
      >
        {events.length === 0 ? (
          <span className="text-white/25">等待 WebSocket 事件…</span>
        ) : (
          events.map((e, i) => (
            <div key={`${e.ts}-${i}`} className="border-l-2 border-white/10 pl-2">
              <span className="text-violet-400/90">{LABELS[e.type] || e.type}</span>
              {summarize(e.data) && (
                <span className="text-white/60 ml-2">{String(summarize(e.data)).slice(0, 200)}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
