import React, { useState, useEffect, useRef } from 'react';
import engineClient from '@/lib/engineClient';
import { PIPELINE_WS_EVENTS } from '@/lib/pipelineRunStore';
import { ListTree } from 'lucide-react';

const LABELS = {
  pipeline_started: 'Pipeline 已启动',
  planner_running: 'Planner 运行中',
  tool_selected: '已选择工具',
  tool_running: '工具运行中',
  tool_finished: '工具完成',
  llm_streaming: 'LLM 流式输出',
  completed: '已完成',
  failed: '失败',
  task_started: '任务开始',
  task_completed: '任务完成',
  step_started: '步骤开始',
  step_completed: '步骤完成',
  browser_action: '浏览器',
  terminal_output: '终端',
  approval_required: '待审批',
};

const STREAM_TYPES = [
  ...PIPELINE_WS_EVENTS,
  'browser_action',
  'terminal_output',
  'approval_required',
].filter((t, i, a) => a.indexOf(t) === i);

function summarize(data) {
  if (!data || typeof data !== 'object') return '';
  return (
    data.message ||
    data.error ||
    data.step_name ||
    data.tool_name ||
    data.name ||
    data.title ||
    data.detail ||
    data.description ||
    data.summary ||
    data.stage ||
    (data.task_id ? `task: ${data.task_id}` : '') ||
    (data.pipeline_id ? `pipeline: ${data.pipeline_id}` : '') ||
    ''
  );
}

export default function StepStream() {
  const [events, setEvents] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const unsubs = STREAM_TYPES.map((t) =>
      engineClient.on(t, (d) => {
        setEvents((prev) => [...prev.slice(-299), { type: t, data: d, ts: Date.now() }]);
      }),
    );
    const unsubAll = engineClient.on('ws_event', ({ type, data }) => {
      if (!STREAM_TYPES.includes(type)) {
        setEvents((prev) => [...prev.slice(-299), { type, data, ts: Date.now() }]);
      }
    });
    return () => {
      unsubs.forEach((u) => u());
      unsubAll();
    };
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
          <span className="text-white/25">等待 WebSocket 事件（pipeline_started、tool_running 等）…</span>
        ) : (
          events.map((e, i) => (
            <div
              key={`${e.ts}-${i}`}
              className={`border-l-2 pl-2 ${
                e.type === 'failed' ? 'border-red-500/50' : e.type === 'completed' ? 'border-emerald-500/40' : 'border-white/10'
              }`}
            >
              <span
                className={
                  e.type === 'failed'
                    ? 'text-red-400/90'
                    : e.type === 'completed'
                      ? 'text-emerald-400/90'
                      : 'text-violet-400/90'
                }
              >
                {LABELS[e.type] || e.type}
              </span>
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
