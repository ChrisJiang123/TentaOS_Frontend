import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#13131A] border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-white/50 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function UsageChart({ transactions = [] }) {
  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: startOfDay(date),
        label: format(date, 'EEE'),
        credits: 0,
        cost: 0,
      };
    });

    transactions.forEach(tx => {
      if (!tx.created_date) return;
      const txDate = new Date(tx.created_date);
      const dayEntry = days.find(d => isSameDay(d.date, txDate));
      if (dayEntry && tx.type === 'USAGE') {
        dayEntry.credits += Math.abs(tx.amount || 0);
        dayEntry.cost += Math.abs(tx.estimated_cost || 0);
      }
    });

    return days.map(d => ({
      name: d.label,
      credits: d.credits,
      cost: parseFloat(d.cost.toFixed(2)),
    }));
  }, [transactions]);

  const hasData = chartData.some(d => d.credits > 0);

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <h3 className="text-sm font-medium text-white/50 mb-6">Usage — Last 7 Days</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="credits" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Credits" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-xs text-white/20">No usage data yet</p>
        </div>
      )}
    </div>
  );
}