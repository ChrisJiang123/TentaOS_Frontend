import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CodeBlock({ code, language = 'bash', title }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#0A0E14] my-4">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
          <span className="text-xs font-medium text-white/40">{title}</span>
          <span className="text-[10px] text-white/20 font-mono">{language}</span>
        </div>
      )}
      <div className="relative group">
        <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-white/70">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className={cn(
            "absolute top-3 right-3 p-1.5 rounded-md transition-all",
            "opacity-0 group-hover:opacity-100",
            copied ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.06] text-white/40 hover:text-white/60"
          )}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}