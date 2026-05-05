import React from 'react';
import { Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const typeConfig = {
  PURCHASE: { label: 'Purchase', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  USAGE: { label: 'Usage', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  REFUND: { label: 'Refund', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  purchase: { label: 'Purchase', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  usage: { label: 'Usage', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  refund: { label: 'Refund', color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

export default function TransactionTable({ transactions = [] }) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-sm font-medium text-white/50 mb-6">Transaction History</h3>
        <div className="text-center py-8">
          <Receipt className="w-6 h-6 text-white/10 mx-auto mb-2" />
          <p className="text-xs text-white/25">No transactions yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <h3 className="text-sm font-medium text-white/50 mb-4">Transaction History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left text-xs text-white/30 font-medium pb-3">Date</th>
              <th className="text-left text-xs text-white/30 font-medium pb-3">Description</th>
              <th className="text-left text-xs text-white/30 font-medium pb-3">Type</th>
              <th className="text-right text-xs text-white/30 font-medium pb-3">Credits</th>
              <th className="text-right text-xs text-white/30 font-medium pb-3">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {transactions.map((tx) => {
              const config = typeConfig[tx.type] || typeConfig.usage || typeConfig.USAGE;
              const isPositive = tx.amount > 0;
              return (
                <tr key={tx.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 text-xs text-white/40 whitespace-nowrap">
                    {tx.created_date ? format(new Date(tx.created_date), 'MMM d, HH:mm') : '—'}
                  </td>
                  <td className="py-3 text-xs text-white/60 max-w-[200px] truncate">
                    {tx.description || (tx.model_name ? `${tx.model_provider}/${tx.model_name}` : 'Transaction')}
                  </td>
                  <td className="py-3">
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", config.bg, config.color)}>
                      {config.label}
                    </span>
                  </td>
                  <td className={cn("py-3 text-xs text-right font-mono tabular-nums", isPositive ? "text-emerald-400" : "text-white/50")}>
                    {isPositive ? '+' : ''}{tx.amount?.toLocaleString() || 0}
                  </td>
                  <td className="py-3 text-xs text-right text-white/40 font-mono tabular-nums">
                    ${(tx.estimated_cost || 0).toFixed(3)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}