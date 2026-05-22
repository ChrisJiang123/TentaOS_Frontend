import React from 'react';
import { ShieldCheck, Eye, Terminal, Workflow } from 'lucide-react';

const badges = [
  { icon: ShieldCheck, label: 'Approval-based' },
  { icon: Eye, label: 'Observable traces' },
  { icon: Terminal, label: 'Browser + terminal' },
  { icon: Workflow, label: 'Developer workflows' },
];

export default function TrustLogos() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-6">
      {badges.map((badge) => (
        <div
          key={badge.label}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]"
        >
          <badge.icon className="w-3.5 h-3.5 text-white/35" />
          <span className="text-xs text-white/45">{badge.label}</span>
        </div>
      ))}
    </div>
  );
}
