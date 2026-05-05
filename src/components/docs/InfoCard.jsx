import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InfoCard({ title, description, href, icon: Icon, color = '#00E5FF' }) {
  const Wrapper = href?.startsWith('http') ? 'a' : Link;
  const linkProps = href?.startsWith('http')
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { to: href || '#' };

  return (
    <Wrapper
      {...linkProps}
      className="block p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        )}
        <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
      </div>
      <h4 className="text-sm font-semibold text-white mt-3">{title}</h4>
      <p className="text-xs text-white/40 mt-1 leading-relaxed">{description}</p>
    </Wrapper>
  );
}