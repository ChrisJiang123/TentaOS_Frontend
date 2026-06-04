import React from 'react';
import { cn } from '@/lib/utils';

export default function TentaLogo({ size = 'md', iconOnly = false }) {
  const sizes = {
    sm: { icon: 20, text: 'text-sm', gap: 'gap-1.5' },
    md: { icon: 28, text: 'text-lg', gap: 'gap-2' },
    lg: { icon: 36, text: 'text-2xl', gap: 'gap-2.5' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={cn("flex items-center", s.gap)}>
      {/* Tentacle icon matching brand */}
      <svg width={s.icon} height={s.icon} viewBox="0 0 48 48" fill="none">
        <path
          d="M28 8c-4 0-7 3-7 7v2c0 2.2-1.8 4-4 4h-2c-4 0-7 3-7 7s3 7 7 7h2"
          stroke="#00E5FF"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M20 40c4 0 7-3 7-7v-2c0-2.2 1.8-4 4-4h2c4 0 7-3 7-7s-3-7-7-7h-2"
          stroke="#0A1E5E"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      {!iconOnly && (
        <span className={cn("font-bold tracking-tight", s.text)}>
          <span className="text-white">Tenta</span>
          <span style={{ color: '#00E5FF' }}>OS</span>
        </span>
      )}
    </div>
  );
}