import React, { useState, useEffect, useRef } from 'react';
import engineClient from '@/lib/engineClient';
import { PIPELINE_WS_EVENTS } from '@/lib/pipelineRunStore';
import { ListTree } from 'lucide-react';
import { useStrings } from '@/i18n/useStrings';

const STREAM_TYPES = [
  ...PIPELINE_WS_EVENTS,
  'browser_action',
  'terminal_output',
  'approval_required',
].filter((t, i, a) => a.indexOf(t) === i);

function streamLabel(t, type) {
  return t(`stream_${type}`) || type;
}

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
  const { t } = useStrings();
  const [events, setEvents] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const unsubs = STREAM_TYPES.map((type) =>
      engineClient.on(type, (d) => {
        setEvents((prev) => [...prev.slice(-299), { type, data: d, ts: Date.now() }]);
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
        <span className="text-xs font-medium text-white">{t('stepStreamTitle')}</span>
        {events.length > 0 && (
          <span className="text-[10px] text-white/30 ml-auto">{t('stepStreamEvents', { n: events.length })}</span>
        )}
      </div>
      <div
        ref={scrollRef}
        className="p-3 h-56 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2 bg-[#07070c]"
      >
        {events.length === 0 ? (
          <span className="text-white/25">{t('stepStreamWaiting')}</span>
        ) : (
          events.map((e, i) => (
            <div
              key={`${e.ts}-${i}`}
              className={`border-l-2 pl-2 ${
                e.type === 'failed'
                  ? 'border-red-500/50'
                  : e.type === 'completed'
                    ? 'border-emerald-500/40'
                    : 'border-white/10'
              }`}
            >
              <span className="text-white/50">{streamLabel(t, e.type)}</span>
              {summarize(e.data) && <span className="text-white/35"> — {summarize(e.data)}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
