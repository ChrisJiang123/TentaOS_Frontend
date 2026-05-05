import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Workflow, Bot, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
  { icon: FileText, label: 'New Task', desc: 'Launch an AI task', path: null, color: '#3B82F6' },
  { icon: Workflow, label: 'Pipeline', desc: 'Build workflows', path: '/PipelineStudio', color: '#8B5CF6' },
  { icon: Bot, label: 'Agents', desc: 'Manage agents', path: '/Agents', color: '#10B981' },
  { icon: Shield, label: 'Approvals', desc: 'Review actions', path: '/Approvals', color: '#F59E0B' },
];

export default function QuickActions({ onNewTask }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {actions.map((action) => {
        const content = (
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]",
            "hover:bg-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer group"
          )}>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: action.color + '12' }}
            >
              <action.icon className="w-4 h-4" style={{ color: action.color }} />
            </div>
            <div>
              <p className="text-xs font-medium text-white group-hover:text-blue-300 transition-colors">{action.label}</p>
              <p className="text-[10px] text-white/30">{action.desc}</p>
            </div>
          </div>
        );

        if (action.path) {
          return <Link key={action.label} to={action.path}>{content}</Link>;
        }
        return <div key={action.label} onClick={onNewTask}>{content}</div>;
      })}
    </div>
  );
}