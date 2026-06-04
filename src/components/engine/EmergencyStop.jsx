// @ts-nocheck
import React, { useState } from 'react';
import engineClient from '@/lib/engineClient';
import { OctagonX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function EmergencyStop() {
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);

  const handleStop = async () => {
    try {
      await engineClient.stopAll();
      toast({
        title: '已发送紧急停止',
        description: 'POST /api/stop 已成功。',
      });
    } catch (e) {
      console.error('POST /api/stop failed:', e);
      toast({
        variant: 'destructive',
        title: '紧急停止失败',
        description: e instanceof Error ? e.message : String(e),
      });
    }
    setConfirming(false);
  };

  if (confirming) {
    return (
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#0E0E15] border border-red-500/30 rounded-xl p-3 shadow-2xl">
        <span className="text-xs text-red-400">确认紧急停止所有任务？</span>
        <Button size="sm" onClick={handleStop} className="bg-red-600 hover:bg-red-500 text-white h-8 text-xs px-4">
          确认停止
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} className="text-white/40 h-8 text-xs">
          取消
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-xl bg-red-600/80 hover:bg-red-500 border border-red-500/50 flex items-center justify-center shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all hover:scale-105"
      title="紧急停止"
    >
      <OctagonX className="w-5 h-5 text-white" />
    </button>
  );
}