import React, { useState, useEffect, useRef } from 'react';
import engineClient from '@/lib/engineClient';
import { Terminal } from 'lucide-react';

export default function TerminalOutput() {
  const [lines, setLines] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    return engineClient.on('terminal_output', (data) => {
      setLines((prev) => {
        const next = [...prev, { text: data.output || data.text || '', stream: data.stream || 'stdout', ts: Date.now() }];
        return next.slice(-500); // keep last 500 lines
      });
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <Terminal className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-medium text-white">终端输出</span>
        {lines.length > 0 && (
          <span className="text-[10px] text-white/30 ml-auto">{lines.length} lines</span>
        )}
      </div>
      <div
        ref={scrollRef}
        className="bg-[#0A0A0F] p-3 h-64 overflow-y-auto font-mono text-xs leading-relaxed"
      >
        {lines.length === 0 ? (
          <span className="text-white/20">等待终端输出...</span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className={line.stream === 'stderr' ? 'text-red-400' : 'text-white/70'}>
              {line.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}