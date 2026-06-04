import React from 'react';
import { useLocation } from 'react-router-dom';
import { FileText } from 'lucide-react';

export default function DocsPlaceholder() {
  const location = useLocation();
  const pageName = location.pathname.split('/').pop();

  return (
    <div className="flex-1 max-w-3xl px-8 py-10">
      <div className="mb-2">
        <span className="text-xs text-[#00E5FF] font-medium">Documentation</span>
      </div>
      <h1 className="text-3xl font-bold text-white tracking-tight mb-4">
        {pageName.replace(/([A-Z])/g, ' $1').trim()}
      </h1>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-white/40 text-sm">This page is coming soon.</p>
        <p className="text-white/25 text-xs mt-1">Content for this section is being written.</p>
      </div>
    </div>
  );
}