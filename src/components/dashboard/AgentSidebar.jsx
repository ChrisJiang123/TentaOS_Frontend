import React from 'react';
import { Bot, Zap } from 'lucide-react';
import { useStrings } from '@/i18n/useStrings';

export default function AgentSidebar({ agents = [] }) {
  const { t } = useStrings();
  const activeCount = agents.filter((a) => a.is_active).length;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden min-w-0">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-white/70 flex items-center gap-2 min-w-0">
          <Bot className="w-4 h-4 shrink-0" />
          <span className="truncate">{t('agentsTitle')}</span>
        </h3>
        <span className="text-[11px] text-white/30 whitespace-nowrap shrink-0">
          {t('agentsActiveCount', { n: activeCount })}
        </span>
      </div>

      {agents.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Bot className="w-6 h-6 text-white/10 mx-auto mb-2" />
          <p className="text-xs text-white/25">{t('agentsEmpty')}</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {agents.map((agent) => (
            <div key={agent.id} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold relative shrink-0"
                  style={{
                    backgroundColor: (agent.avatar_color || '#6B7280') + '20',
                    color: agent.avatar_color || '#6B7280',
                  }}
                >
                  {agent.name?.[0] || '?'}
                  {agent.is_active && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#06060B]">
                      <span className="block w-full h-full rounded-full bg-emerald-400 animate-pulse" />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-white truncate">{agent.name}</p>
                    {agent.is_active && <Zap className="w-3 h-3 text-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-white/30 truncate">{agent.role || agent.type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
