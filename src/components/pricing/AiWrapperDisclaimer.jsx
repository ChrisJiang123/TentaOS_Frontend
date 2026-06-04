import React from 'react';
import { Info } from 'lucide-react';

export default function AiWrapperDisclaimer({ className = '' }) {
  return (
    <div
      className={`rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[11px] text-white/45 leading-relaxed ${className}`}
      role="note"
    >
      <div className="flex gap-2">
        <Info className="w-4 h-4 text-[#00E5FF]/80 shrink-0 mt-0.5" aria-hidden />
        <div className="space-y-2">
          <p>
            <strong className="text-white/70 font-medium">Independent platform notice.</strong>{' '}
            TentaOS is an independent software product and AI workflow wrapper. It is not affiliated with,
            endorsed by, or sponsored by OpenAI, Anthropic, Google, DeepSeek, or any other model provider.
          </p>
          <p>
            When you run workflows, third-party models may be invoked via their APIs (including BYOK keys you
            supply). Model output, availability, and pricing are controlled by those providers.
          </p>
        </div>
      </div>
    </div>
  );
}
