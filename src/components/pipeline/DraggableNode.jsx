import React, { useRef, useState, useCallback } from 'react';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const agentColors = {
  planner: '#3B82F6',
  researcher: '#8B5CF6',
  coder: '#10B981',
  writer: '#F59E0B',
  operator: '#EF4444',
  reviewer: '#06B6D4',
};

export default function DraggableNode({ node, onMove, onSelect, isSelected, onDelete }) {
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const color = agentColors[node.agent] || '#6B7280';
  const x = node.position?.x || 0;
  const y = node.position?.y || 0;

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
    setDragging(true);
    offsetRef.current = {
      x: e.clientX - x,
      y: e.clientY - y,
    };

    const handleMouseMove = (e) => {
      onMove(node.id, {
        x: e.clientX - offsetRef.current.x,
        y: e.clientY - offsetRef.current.y,
      });
    };

    const handleMouseUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [node.id, x, y, onMove]);

  return (
    <div
      ref={dragRef}
      className={cn(
        "absolute bg-[#0D0D15] border rounded-xl p-4 min-w-[180px] transition-shadow select-none group",
        dragging ? "shadow-lg shadow-blue-500/10 z-50 cursor-grabbing" : "cursor-grab",
        isSelected ? "border-blue-500/40 ring-1 ring-blue-500/20" : "border-white/[0.08] hover:border-white/[0.15]"
      )}
      style={{ left: x, top: y }}
      onMouseDown={(e) => {
        onSelect(node.id);
        // Only start drag on grip handle
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded hover:bg-white/[0.06]"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="w-3 h-3 text-white/20 group-hover:text-white/40" />
        </div>
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
          style={{ backgroundColor: color + '20', color }}
        >
          {node.agent?.[0]?.toUpperCase() || node.type?.[0]?.toUpperCase() || 'N'}
        </div>
        <span className="text-xs font-medium text-white truncate flex-1">{node.label}</span>
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 transition-all"
          >
            <X className="w-3 h-3 text-white/30 hover:text-red-400" />
          </button>
        )}
      </div>
      {node.agent && (
        <p className="text-[10px] text-white/40 capitalize ml-7">{node.agent}</p>
      )}
      {node.tools && node.tools.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 ml-7">
          {node.tools.map(tool => (
            <span key={tool} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30">
              {tool}
            </span>
          ))}
        </div>
      )}
      {/* Connection points */}
      <div className="absolute top-1/2 -left-2 w-4 h-4 rounded-full bg-white/[0.06] border border-white/[0.1] -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-1/2 -right-2 w-4 h-4 rounded-full bg-white/[0.06] border border-white/[0.1] -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}