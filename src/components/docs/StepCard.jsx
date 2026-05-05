import React from 'react';

export default function StepCard({ number, title, children }) {
  return (
    <div className="flex gap-4 my-8">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center text-sm font-bold text-[#00E5FF]">
          {number}
        </div>
        <div className="w-px h-full bg-white/[0.06] mx-auto mt-2" />
      </div>
      <div className="flex-1 pb-8">
        <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
        <div className="text-sm text-white/60 leading-relaxed space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
}