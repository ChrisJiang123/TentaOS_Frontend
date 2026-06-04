import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Workflow, Bot, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStrings } from '@/i18n/useStrings';

export default function QuickActions({ onNewTask }) {
  const { t } = useStrings();

  const actions = [
    { icon: FileText, label: t('newTask'), desc: t('newTaskDesc'), path: null, color: '#3B82F6' },
    { icon: Workflow, label: t('pipelineAction'), desc: t('pipelineDesc'), path: '/PipelineStudio', color: '#8B5CF6' },
    { icon: Bot, label: t('agentsAction'), desc: t('agentsDesc'), path: '/Agents', color: '#10B981' },
    { icon: Shield, label: t('approvals'), desc: t('approvalSubtitle'), path: '/Approvals', color: '#F59E0B' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-0">
      {actions.map((action) => {
        const content = (
          <div
            className={cn(
              'flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] min-w-0',
              'hover:bg-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer group',
            )}
          >
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: action.color + '12' }}
            >
              <action.icon className="w-4 h-4" style={{ color: action.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white group-hover:text-blue-300 transition-colors truncate">
                {action.label}
              </p>
              <p className="text-[10px] text-white/30 truncate hidden sm:block">{action.desc}</p>
            </div>
          </div>
        );

        if (action.path) {
          return (
            <Link key={action.label} to={action.path}>
              {content}
            </Link>
          );
        }
        return (
          <div key={action.label} onClick={onNewTask}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
