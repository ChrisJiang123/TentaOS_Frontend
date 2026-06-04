import React, { useState } from 'react';
import { Send, Paperclip, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const priorities = [
  { value: 'low', label: 'Low', color: 'text-white/40' },
  { value: 'medium', label: 'Medium', color: 'text-blue-400' },
  { value: 'high', label: 'High', color: 'text-amber-400' },
];

export default function TaskInput({ onSubmit }) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [priority, setPriority] = useState('medium');
  const [showPriority, setShowPriority] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value, { priority });
    setValue('');
  };

  const currentPriority = priorities.find(p => p.value === priority);

  return (
    <form onSubmit={handleSubmit}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative rounded-2xl border transition-all duration-300",
          focused 
            ? "border-blue-500/50 bg-white/[0.04] shadow-[0_0_40px_rgba(59,130,246,0.12)]" 
            : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]"
        )}
      >
        {/* Animated glow ring on focus */}
        {focused && (
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-cyan-500/20 blur-sm pointer-events-none" />
        )}
        <div className="flex items-start p-4 gap-3">
          <Sparkles className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); setShowPriority(false); }}
            placeholder="Describe a task for your AI agents..."
            className="flex-1 bg-transparent text-white placeholder:text-white/30 resize-none outline-none text-[15px] min-h-[60px] max-h-[150px]"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2">
            <button type="button" className="text-white/30 hover:text-white/60 transition-colors p-1.5 rounded-lg hover:bg-white/[0.05]">
              <Paperclip className="w-4 h-4" />
            </button>
            {/* Priority selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPriority(!showPriority)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors hover:bg-white/[0.05]",
                  currentPriority.color
                )}
              >
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  priority === 'low' ? 'bg-white/30' : priority === 'medium' ? 'bg-blue-400' : 'bg-amber-400'
                )} />
                {currentPriority.label}
                <ChevronDown className="w-3 h-3 text-white/20" />
              </button>
              {showPriority && (
                <div className="absolute bottom-full left-0 mb-1 bg-[#13131A] border border-white/10 rounded-lg shadow-xl overflow-hidden z-10">
                  {priorities.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setPriority(p.value);
                        setShowPriority(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 w-full text-left text-xs hover:bg-white/[0.05] transition-colors",
                        p.color
                      )}
                    >
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        p.value === 'low' ? 'bg-white/30' : p.value === 'medium' ? 'bg-blue-400' : 'bg-amber-400'
                      )} />
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[11px] text-white/20">Shift+Enter for new line</span>
          </div>
          <Button 
            type="submit"
            size="sm"
            disabled={!value.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 h-8 text-xs font-medium disabled:opacity-30"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Launch Task
          </Button>
        </div>
      </motion.div>
    </form>
  );
}