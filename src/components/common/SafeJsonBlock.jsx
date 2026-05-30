// @ts-nocheck
import React from 'react';
import { cn } from '@/lib/utils';

/** Dev/debug JSON dump — never use as primary UI content. */
export default function SafeJsonBlock({ value, className = '' }) {
  if (!import.meta.env.DEV) return null;
  return (
    <pre
      className={cn(
        'overflow-auto rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-[10px] text-white/40 font-mono max-h-48',
        className,
      )}
    >
      {JSON.stringify(value ?? null, null, 2)}
    </pre>
  );
}
