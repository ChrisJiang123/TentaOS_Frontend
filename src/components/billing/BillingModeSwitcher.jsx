import React, { useState } from 'react';
import { Key, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function BillingModeSwitcher({ subscription, onUpdate }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetMode, setTargetMode] = useState(null);
  const [switching, setSwitching] = useState(false);
  const currentMode = subscription?.billing_mode || 'byok';

  const lastSwitch = subscription?.last_billing_mode_switch;
  const canSwitch = !lastSwitch || (Date.now() - new Date(lastSwitch).getTime()) > 30 * 24 * 60 * 60 * 1000;

  const handleSwitch = (mode) => {
    if (mode === currentMode) return;
    setTargetMode(mode);
    setConfirmOpen(true);
  };

  const confirmSwitch = async () => {
    setSwitching(true);
    try {
      await base44.entities.Subscription.update(subscription.id, {
        billing_mode: targetMode,
        last_billing_mode_switch: new Date().toISOString(),
        ...(targetMode === 'hosted' ? { credits_balance: (subscription.credits_balance || 0) + 10000 } : {}),
      });
      toast({
        title: `Switched to ${targetMode === 'byok' ? 'BYOK' : 'Hosted'} mode`,
        description: targetMode === 'hosted'
          ? 'You now have 10,000 bonus credits!'
          : 'You will no longer consume hosted credits.',
      });
      onUpdate?.();
      setConfirmOpen(false);
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <h3 className="text-sm font-medium text-white/50 mb-4">Billing Mode</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ModeCard
          icon={Key}
          label="BYOK"
          desc="Use your own API keys"
          detail="No credit limits, pay only for software"
          active={currentMode === 'byok'}
          color="emerald"
          onClick={() => handleSwitch('byok')}
          disabled={!canSwitch && currentMode !== 'byok'}
        />
        <ModeCard
          icon={Cloud}
          label="Hosted"
          desc="Use platform credits"
          detail="No API setup required, simple pricing"
          active={currentMode === 'hosted'}
          color="purple"
          onClick={() => handleSwitch('hosted')}
          disabled={!canSwitch && currentMode !== 'hosted'}
        />
      </div>

      {!canSwitch && (
        <p className="text-xs text-white/30 mt-3">You can switch modes once every 30 days.</p>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-[#13131A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Switch to {targetMode === 'byok' ? 'BYOK' : 'Hosted'} mode?</DialogTitle>
            <DialogDescription className="text-white/50">
              {targetMode === 'hosted'
                ? 'You will receive 10,000 bonus credits. Your AI tasks will consume platform credits instead of your own API keys.'
                : 'You will need to configure your own API keys. Remaining hosted credits will be preserved but unused.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} className="text-white/50">Cancel</Button>
            <Button onClick={confirmSwitch} disabled={switching} className="bg-purple-600 hover:bg-purple-500">
              {switching ? 'Switching...' : 'Confirm Switch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModeCard({ icon: Icon, label, desc, detail, active, color, onClick, disabled }) {
  const isEmerald = color === 'emerald';
  const activeBorder = isEmerald ? 'border-emerald-500/40' : 'border-purple-500/40';
  const activeBg = isEmerald ? 'bg-emerald-500/5' : 'bg-purple-500/5';
  const activeIcon = isEmerald ? 'text-emerald-400' : 'text-purple-400';
  const activeBadgeBg = isEmerald ? 'bg-emerald-500/20' : 'bg-purple-500/20';
  const activeBadgeText = isEmerald ? 'text-emerald-400' : 'text-purple-400';

  return (
    <button
      onClick={onClick}
      disabled={disabled || active}
      className={cn(
        "text-left p-4 rounded-xl border-2 transition-all",
        active
          ? `${activeBorder} ${activeBg}`
          : "border-white/[0.06] hover:border-white/10 bg-transparent",
        (disabled && !active) && "opacity-40 cursor-not-allowed"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-4 h-4", active ? activeIcon : 'text-white/40')} />
        <span className={cn("font-semibold text-sm", active ? 'text-white' : 'text-white/60')}>{label}</span>
        {active && (
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", activeBadgeBg, activeBadgeText)}>
            Active
          </span>
        )}
      </div>
      <p className="text-xs text-white/50">{desc}</p>
      <p className="text-xs text-white/30 mt-1">{detail}</p>
    </button>
  );
}