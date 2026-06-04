import React from 'react';
import { FileText, Image, Code2, Table, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeConfig = {
  report: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  csv: { icon: Table, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  code: { icon: Code2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  image: { icon: Image, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  screenshot: { icon: Image, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  pdf: { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10' },
  markdown: { icon: FileText, color: 'text-white/50', bg: 'bg-white/5' },
};

export default function ArtifactList({ artifacts = [] }) {
  if (artifacts.length === 0) return null;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
      <h3 className="text-sm font-medium text-white/60 mb-4">Artifacts</h3>
      <div className="space-y-2">
        {artifacts.map((artifact, i) => {
          const config = typeConfig[artifact.type] || typeConfig.report;
          const Icon = config.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", config.bg)}>
                <Icon className={cn("w-4 h-4", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{artifact.title}</p>
                <p className="text-[11px] text-white/30 capitalize">{artifact.type}</p>
              </div>
              <button className="text-white/20 hover:text-white/50 transition-colors opacity-0 group-hover:opacity-100">
                <Download className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}