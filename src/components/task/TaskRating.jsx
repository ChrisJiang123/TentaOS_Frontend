import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

export default function TaskRating({ taskId, currentRating, onRated }) {
  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(currentRating || 0);
  const [saving, setSaving] = useState(false);

  const handleRate = async (value) => {
    setRating(value);
    setSaving(true);
    await base44.entities.Task.update(taskId, { user_rating: value });
    setSaving(false);
    if (onRated) onRated(value);
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
      <h3 className="text-sm font-medium text-white/60 mb-3">为本次结果评分</h3>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => handleRate(v)}
            onMouseEnter={() => setHover(v)}
            onMouseLeave={() => setHover(0)}
            disabled={saving}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "w-6 h-6 transition-colors",
                (hover || rating) >= v ? "text-amber-400 fill-amber-400" : "text-white/15"
              )}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-xs text-white/40 ml-3">
            {rating === 5 ? '非常满意' : rating === 4 ? '满意' : rating === 3 ? '一般' : rating === 2 ? '不太好' : '很差'}
          </span>
        )}
      </div>
      <p className="text-[10px] text-white/20 mt-2">评分数据用于优化模型路由和 Agent 匹配</p>
    </div>
  );
}