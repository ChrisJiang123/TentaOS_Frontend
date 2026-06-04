import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export default function CodeTabs({ tabs }) {
  const [active, setActive] = useState(0);

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#0A0E14] my-4">
      <div className="flex border-b border-white/[0.06] bg-white/[0.02] overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              "px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap",
              i === active
                ? "text-[#00E5FF] border-b-2 border-[#00E5FF] bg-[#00E5FF]/[0.04]"
                : "text-white/40 hover:text-white/60"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="relative group">
        <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-white/70">
          <code>{tabs[active].code}</code>
        </pre>
      </div>
    </div>
  );
}