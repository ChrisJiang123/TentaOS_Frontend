import React, { useState } from 'react';
import { Receipt } from 'lucide-react';

import SubscriptionCard from '../components/billing/SubscriptionCard';

export default function Billing() {
  // base44 计费/订阅后端已移除：本地模式使用静态占位，避免 api/apps/null 404
  const subscription = { plan: 'local', status: 'active', billing_mode: 'byok', amount: 0 };
  const isHosted = false;

  const handleRefresh = () => {};

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Billing & Usage</h1>
            <p className="text-sm text-white/40">Manage your subscription and credits</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Subscription + Credits row */}
          <div className={`grid gap-6 ${isHosted ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            <SubscriptionCard subscription={subscription} />
          </div>

          {/* Cost Summary */}
          <CostSummary subscription={subscription} isHosted={isHosted} />

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-white/50 text-sm">
            本地模式：计费/订阅未接入 Engine，页面仅展示静态占位内容。
          </div>
        </div>
      </div>
    </div>
  );
}

function CostSummary({ subscription, isHosted }) {
  const amount = subscription?.amount || 0;
  const creditsUsed = subscription?.credits_used_this_month || 0;
  const creditCost = (creditsUsed * 0.003).toFixed(2); // rough estimate

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <h3 className="text-sm font-medium text-white/50 mb-4">Cost Breakdown — This Month</h3>
      <div className="space-y-3">
        <CostRow label="Software subscription" value={`$${amount.toFixed(2)}`} />
        {isHosted && (
          <>
            <CostRow label={`Credit usage (${creditsUsed.toLocaleString()} credits)`} value={`$${creditCost}`} />
            <CostRow label="Extra credit purchases" value="$0.00" />
          </>
        )}
        <div className="border-t border-white/[0.06] pt-3 flex justify-between">
          <span className="text-sm font-semibold text-white">Total</span>
          <span className="text-sm font-semibold text-white">
            ${isHosted ? (amount + parseFloat(creditCost)).toFixed(2) : amount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CostRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/50">{label}</span>
      <span className="text-white/70">{value}</span>
    </div>
  );
}