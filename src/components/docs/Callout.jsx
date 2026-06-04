import React from 'react';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
  info: { icon: Info, border: 'border-blue-500/20', bg: 'bg-blue-500/[0.05]', color: 'text-blue-400' },
  warning: { icon: AlertTriangle, border: 'border-amber-500/20', bg: 'bg-amber-500/[0.05]', color: 'text-amber-400' },
  success: { icon: CheckCircle2, border: 'border-emerald-500/20', bg: 'bg-emerald-500/[0.05]', color: 'text-emerald-400' },
};

export default function Callout({ variant = 'info', children }) {
  const v = variants[variant] || variants.info;
  const Icon = v.icon;

  return (
    <div className={cn("flex gap-3 p-4 rounded-xl border my-4", v.border, v.bg)}>
      <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", v.color)} />
      <div className="text-sm text-white/60 leading-relaxed">{children}</div>
    </div>
  );
}