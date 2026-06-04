import React from 'react';
import { cn } from '@/lib/utils';

export default function TableOfContents({ items = [] }) {
  return (
    <div className="w-[200px] flex-shrink-0 hidden xl:block py-8 pr-6">
      <div className="sticky top-20">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-3">
          On this page
        </h4>
        <nav className="space-y-1">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                "block text-xs py-1 transition-colors",
                item.level === 2
                  ? "text-white/40 hover:text-white/70"
                  : "text-white/30 hover:text-white/50 pl-3"
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}