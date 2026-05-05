import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SearchBar({ value, onChange, placeholder = 'Search tasks...' }) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && focused) {
        inputRef.current?.blur();
        onChange('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focused, onChange]);

  return (
    <div className={cn(
      "relative flex items-center gap-2 rounded-lg border px-3 py-2 transition-all",
      focused
        ? "border-blue-500/40 bg-white/[0.04]"
        : "border-white/[0.06] bg-white/[0.02]"
    )}>
      <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none min-w-0"
      />
      {value ? (
        <button onClick={() => onChange('')} className="text-white/30 hover:text-white/50">
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <kbd className="hidden sm:inline text-[10px] text-white/20 bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.06]">
          ⌘K
        </kbd>
      )}
    </div>
  );
}