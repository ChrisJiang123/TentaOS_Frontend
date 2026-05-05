import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Coins, Check } from 'lucide-react';
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

const creditPacks = [
  { id: 'small', name: '10,000 Credits', credits: 10000, price: 10 },
  { id: 'medium', name: '50,000 Credits', credits: 50000, price: 40, badge: 'Save 20%' },
  { id: 'large', name: '100,000 Credits', credits: 100000, price: 70, badge: 'Save 30%' },
];

export default function BuyCreditsModal({ open, onClose, subscription, onUpdate }) {
  const [selected, setSelected] = useState('medium');
  const [purchasing, setPurchasing] = useState(false);

  const currentBalance = subscription?.credits_balance || 0;
  const selectedPack = creditPacks.find(p => p.id === selected);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      // Update subscription credits
      await base44.entities.Subscription.update(subscription.id, {
        credits_balance: currentBalance + selectedPack.credits,
      });

      // Record transaction
      await base44.entities.CreditTransaction.create({
        user_id: subscription.user_id,
        type: 'purchase',
        amount: selectedPack.credits,
        estimated_cost: selectedPack.price,
        description: `Purchased ${selectedPack.name}`,
      });

      toast({
        title: 'Credits purchased!',
        description: `Added ${selectedPack.credits.toLocaleString()} credits to your account.`,
      });
      onUpdate?.();
      onClose();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#13131A] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-purple-400" />
            Buy Credits
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Current balance: {currentBalance.toLocaleString()} credits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {creditPacks.map((pack) => (
            <button
              key={pack.id}
              onClick={() => setSelected(pack.id)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                selected === pack.id
                  ? "border-purple-500/50 bg-purple-500/5"
                  : "border-white/[0.06] hover:border-white/10"
              )}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-white">{pack.name}</span>
                  {pack.badge && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {pack.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs text-white/40 mt-1 block">
                  After purchase: {(currentBalance + pack.credits).toLocaleString()} credits
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-white">${pack.price}</span>
                {selected === pack.id && (
                  <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-white/50">Cancel</Button>
          <Button
            onClick={handlePurchase}
            disabled={purchasing}
            className="bg-purple-600 hover:bg-purple-500"
          >
            {purchasing ? 'Processing...' : `Pay $${selectedPack?.price}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}