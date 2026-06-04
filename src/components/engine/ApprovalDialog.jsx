// @ts-nocheck
import React, { useState, useEffect } from 'react';
import engineClient from '@/lib/engineClient';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const riskColors = {
  low: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Low Risk' },
  medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Medium Risk' },
  high: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: 'High Risk' },
};

export default function ApprovalDialog() {
  const { toast } = useToast();
  const [approval, setApproval] = useState(null);

  useEffect(() => {
    return engineClient.on('approval_required', (data) => {
      setApproval(data);
    });
  }, []);

  if (!approval) return null;

  const risk = riskColors[approval.risk_level] || riskColors.medium;

  const handleDecision = async (approved) => {
    const id = approval.approval_id || approval.id;
    if (id) {
      try {
        await engineClient.approveViaAPI(id, approved, '');
        toast({
          title: approved ? '已批准' : '已拒绝',
          description: `审批 ID: ${id}`,
        });
      } catch (e) {
        console.error('Approval API failed:', e);
        toast({
          variant: 'destructive',
          title: '审批请求失败',
          description: e instanceof Error ? e.message : String(e),
        });
        return;
      }
    }
    setApproval(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0E0E15] border border-white/[0.1] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", risk.bg)}>
            <Shield className={cn("w-5 h-5", risk.text)} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">需要审批</h3>
            <span className={cn("text-[11px] px-2 py-0.5 rounded-full", risk.bg, risk.text, risk.border, "border")}>
              {risk.label}
            </span>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-5">
          <p className="text-sm text-white/70 leading-relaxed">
            {approval.description || approval.summary || 'An agent action requires your approval.'}
          </p>
          {approval.agent && (
            <p className="text-[11px] text-white/30 mt-2">Agent: {approval.agent}</p>
          )}
          {approval.action_type && (
            <p className="text-[11px] text-white/30">Action: {approval.action_type}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleDecision(true)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white h-10 text-sm rounded-xl"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            批准
          </Button>
          <Button
            onClick={() => handleDecision(false)}
            variant="outline"
            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 h-10 text-sm rounded-xl"
          >
            <XCircle className="w-4 h-4 mr-2" />
            拒绝
          </Button>
        </div>
      </div>
    </div>
  );
}