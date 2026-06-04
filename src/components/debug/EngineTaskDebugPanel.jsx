// @ts-nocheck
import React from 'react';
import { ENGINE_BASE_URL } from '@/lib/engineClient';

export default function EngineTaskDebugPanel({ debug, listDebug, record }) {
  if (!debug && !listDebug) return null;

  const fmtTime = (ts) => (ts ? new Date(ts).toISOString() : '—');

  return (
    <div className="mt-6 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 font-mono text-[11px] text-white/45 space-y-1">
      <p className="text-white/60 font-sans text-xs font-medium mb-2">Dev debug (tasks)</p>
      <div>engineBaseUrl: {debug?.engineBaseUrl || ENGINE_BASE_URL || '(empty)'}</div>
      <div>taskId: {record?.id || debug?.sampleTaskId || '—'}</div>
      <div>list API URL: {listDebug?.listUrl || debug?.listApiUrl || '—'}</div>
      <div>detail API URL: {record?.detailUrl || '—'}</div>
      <div>HTTP status: {record?.httpStatus ?? listDebug?.httpStatus ?? '—'}</div>
      <div>raw task.status: {String(record?.raw?.status ?? '—')}</div>
      <div>steps count: {record?.raw?.pipeline?.steps?.length ?? 0}</div>
      <div>output exists: {record?.raw?.output != null && record?.raw?.output !== '' ? 'true' : 'false'}</div>
      <div>last poll time: {fmtTime(record?.lastPollAt || listDebug?.lastFetchAt)}</div>
      <div>poll error: {record?.pollError || listDebug?.error || '—'}</div>
    </div>
  );
}
