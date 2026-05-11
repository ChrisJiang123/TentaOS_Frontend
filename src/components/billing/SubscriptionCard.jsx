// @ts-nocheck
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const statusColors = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  past_due: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  paused: 'bg-white/10 text-white/50 border-white/10',
  trialing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const planLabels = {
  FREE: 'Free',
  free: 'Free',
  STARTER: 'Starter',
  starter: 'Starter',
  PRO_BYOK: 'Pro BYOK',
  pro_byok: 'Pro BYOK',
  PRO_HOSTED: 'Pro Hosted',
  pro_hosted: 'Pro Hosted',
  TEAM: 'Team',
  team: 'Team',
};

export default function SubscriptionCard({
  subscription,
  billingProviderConnected = false,
  onCancelSubscription = undefined,
}) {
  const cancelEnabled = Boolean(billingProviderConnected && typeof onCancelSubscription === 'function');
  const plan = subscription?.plan || 'free';
  const status = subscription?.status || 'active';
  const amount = subscription?.amount || 0;
  const periodEnd = subscription?.current_period_end;

  return (
    <TooltipProvider>
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white/50 mb-1">Current Plan</h3>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-white">{planLabels[plan]}</span>
            <Badge className={cn("border text-xs", statusColors[status])}>
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">${amount}</div>
          <div className="text-xs text-white/40">/month</div>
        </div>
      </div>

      {periodEnd && (
        <div className="text-sm text-white/40 mb-4">
          Next billing: {new Date(periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link to="/Pricing">
          <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:text-white bg-transparent hover:bg-white/5">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            {plan === 'free' ? 'Upgrade Plan' : 'Change Plan'}
          </Button>
        </Link>
        {plan !== 'free' && status === 'active' && (
          cancelEnabled ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="billing-cancel-subscription"
              className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
              onClick={() => onCancelSubscription()}
            >
              Cancel Subscription
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex cursor-not-allowed">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled
                    data-testid="billing-cancel-subscription"
                    className="text-red-400/40 hover:bg-transparent h-8 text-xs cursor-not-allowed"
                  >
                    Cancel Subscription
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {!billingProviderConnected
                  ? 'Billing provider not connected yet.'
                  : 'Cancellation is not wired in this build.'}
              </TooltipContent>
            </Tooltip>
          )
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}