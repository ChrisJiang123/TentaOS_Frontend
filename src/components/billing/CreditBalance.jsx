import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, AlertTriangle } from 'lucide-react';


export default function CreditBalance({ subscription, onBuyCredits }) {
  const balance = subscription?.credits_balance || 0;
  const usedMonth = subscription?.credits_used_this_month || 0;
  const usedToday = subscription?.credits_used_today || 0;
  const monthlyLimit = subscription?.monthly_credit_limit || 10000;
  const dailyLimit = subscription?.daily_credit_limit || 3000;

  const monthlyPct = Math.min((usedMonth / monthlyLimit) * 100, 100);
  const dailyPct = Math.min((usedToday / dailyLimit) * 100, 100);
  const isLowCredits = balance < 1000;

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-white/50 mb-1">Credit Balance</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{balance.toLocaleString()}</span>
            <span className="text-sm text-white/30">credits</span>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-500 text-white"
          onClick={onBuyCredits}
        >
          <ShoppingCart className="w-3.5 h-3.5 mr-1" />
          Buy Credits
        </Button>
      </div>

      {isLowCredits && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-xs text-amber-400">Low credit balance. Purchase more to avoid interruptions.</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-white/50">Monthly usage</span>
            <span className="text-white/70">{usedMonth.toLocaleString()} / {monthlyLimit.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${monthlyPct > 80 ? 'bg-amber-500' : 'bg-purple-500'}`}
              style={{ width: `${monthlyPct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-white/50">Daily usage</span>
            <span className="text-white/70">{usedToday.toLocaleString()} / {dailyLimit.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${dailyPct > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
              style={{ width: `${dailyPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}