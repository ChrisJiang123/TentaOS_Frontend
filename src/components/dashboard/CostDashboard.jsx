import React from 'react';
import { TrendingDown, BarChart3 } from 'lucide-react';

export default function CostDashboard({ tasks = [] }) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(today); 
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const todayCost = tasks
    .filter(t => new Date(t.created_date) >= startOfDay)
    .reduce((s, t) => s + (t.actual_cost || 0), 0);

  const weekCost = tasks
    .filter(t => new Date(t.created_date) >= startOfWeek)
    .reduce((s, t) => s + (t.actual_cost || 0), 0);

  const monthCost = tasks
    .filter(t => new Date(t.created_date) >= startOfMonth)
    .reduce((s, t) => s + (t.actual_cost || 0), 0);

  const totalTokens = tasks.reduce((s, t) => s + (t.tokens_used || 0), 0);

  // Model usage breakdown
  const modelUsage = {};
  tasks.forEach(t => {
    (t.workflow_nodes || []).forEach(n => {
      if (n.model && n.cost > 0) {
        const key = n.model.split('/').pop();
        if (!modelUsage[key]) modelUsage[key] = { cost: 0, tokens: 0, count: 0 };
        modelUsage[key].cost += n.cost;
        modelUsage[key].tokens += (n.tokens || 0);
        modelUsage[key].count += 1;
      }
    });
  });

  const sortedModels = Object.entries(modelUsage).sort((a, b) => b[1].cost - a[1].cost);
  const totalModelCost = sortedModels.reduce((s, [_, v]) => s + v.cost, 0) || 1;

  // Potential savings
  const cheapestRate = 0.14 / 1_000_000; // deepseek input rate
  const potentialSaving = monthCost > 0 ? monthCost - (totalTokens * cheapestRate * 2) : 0;

  if (tasks.length === 0) return null;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-medium text-white">成本概览</h3>
      </div>

      {/* Time-based costs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/[0.03] rounded-lg p-3">
          <p className="text-[10px] text-white/40">今日</p>
          <p className="text-lg font-semibold text-white mt-0.5">${todayCost.toFixed(3)}</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-3">
          <p className="text-[10px] text-white/40">本周</p>
          <p className="text-lg font-semibold text-white mt-0.5">${weekCost.toFixed(3)}</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-3">
          <p className="text-[10px] text-white/40">本月</p>
          <p className="text-lg font-semibold text-white mt-0.5">${monthCost.toFixed(2)}</p>
        </div>
      </div>

      {/* Model breakdown */}
      {sortedModels.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">模型使用分布</p>
          {sortedModels.slice(0, 5).map(([model, data]) => {
            const pct = (data.cost / totalModelCost) * 100;
            return (
              <div key={model} className="flex items-center gap-2">
                <span className="text-[10px] text-white/50 w-28 truncate">{model}</span>
                <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500/50 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-white/40 w-14 text-right">${data.cost.toFixed(3)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Savings tip */}
      {potentialSaving > 0.01 && (
        <div className="bg-emerald-500/[0.05] border border-emerald-500/10 rounded-lg p-3 flex items-start gap-2">
          <TrendingDown className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] text-emerald-400">
              全用最便宜的模型，本月可省 ~${potentialSaving.toFixed(2)}
            </p>
            <p className="text-[10px] text-white/25 mt-0.5">使用 DeepSeek 替代高价模型</p>
          </div>
        </div>
      )}
    </div>
  );
}