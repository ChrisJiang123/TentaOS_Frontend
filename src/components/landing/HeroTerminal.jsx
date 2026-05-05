import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const lines = [
  { text: '$ tentaos run "Research top 10 AI startups and create a report"', delay: 0, color: '#00E5FF' },
  { text: '⚡ Planning workflow...', delay: 800, color: '#8B5CF6' },
  { text: '  → Researcher: searching web for AI startups 2026', delay: 1400, color: '#10B981' },
  { text: '  → Writer: drafting executive summary', delay: 2200, color: '#F59E0B' },
  { text: '  → Reviewer: checking citations and accuracy', delay: 3000, color: '#06B6D4' },
  { text: '✓ Report generated — 3 agents, 12 steps, $0.23', delay: 3800, color: '#10B981' },
];

export default function HeroTerminal() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers = lines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="bg-[#0C0C14] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl shadow-black/40">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] text-white/20 ml-2 font-mono">tentaos — terminal</span>
      </div>
      {/* Content */}
      <div className="p-4 font-mono text-[13px] leading-relaxed min-h-[180px]">
        {lines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ color: line.color }}
            className="whitespace-nowrap overflow-hidden"
          >
            {line.text}
          </motion.div>
        ))}
        {visibleLines < lines.length && (
          <span className="inline-block w-2 h-4 bg-white/40 animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}