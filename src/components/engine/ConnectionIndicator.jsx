import React, { useState, useEffect } from 'react';
import engineClient from '@/lib/engineClient';
import { cn } from '@/lib/utils';

export default function ConnectionIndicator() {
  const [connected, setConnected] = useState(engineClient.isConnected());
  const [state, setState] = useState(engineClient.getConnectionInfo?.().state || 'disconnected');

  useEffect(() => {
    return engineClient.on('connection_status', (data) => {
      setConnected(data.connected);
      if (data.state) setState(data.state);
    });
  }, []);

  const label =
    state === 'connected' ? 'WebSocket · connected' :
    state === 'connecting' ? 'WebSocket · connecting' :
    state === 'reconnecting' ? 'WebSocket · reconnecting' :
    state === 'failed' ? 'WebSocket · failed' :
    'WebSocket · disconnected';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
      <span className={cn(
        "w-2 h-2 rounded-full",
        connected ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" : state === 'reconnecting' || state === 'connecting' ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.45)]" : "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]"
      )} />
      <span className="text-[11px] text-white/50">
        {label}
      </span>
    </div>
  );
}