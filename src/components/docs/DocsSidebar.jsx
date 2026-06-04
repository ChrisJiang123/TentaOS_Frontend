import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

const sections = [
  {
    title: 'Get Started',
    items: [
      { path: '/Docs', label: 'Quick Start' },
      { path: '/Docs/Installation', label: 'Installation' },
      { path: '/Docs/Authentication', label: 'Authentication' },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { path: '/Docs/Tasks', label: 'Tasks' },
      { path: '/Docs/Agents', label: 'Agents' },
      { path: '/Docs/Workflows', label: 'Workflows' },
      { path: '/Docs/Approvals', label: 'Approval Gates' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { path: '/Docs/ApiOverview', label: 'Overview' },
      { path: '/Docs/ApiTasks', label: 'Tasks API' },
      { path: '/Docs/ApiAgents', label: 'Agents API' },
      { path: '/Docs/ApiModels', label: 'Models API' },
    ],
  },
  {
    title: 'SDKs',
    items: [
      { path: '/Docs/PythonSdk', label: 'Python SDK' },
      { path: '/Docs/NodeSdk', label: 'Node.js SDK' },
      { path: '/Docs/CliReference', label: 'CLI Reference' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { path: '/Docs/Changelog', label: 'Changelog' },
      { path: '/Docs/Faq', label: 'FAQ' },
    ],
  },
];

export default function DocsSidebar() {
  const location = useLocation();

  return (
    <div className="w-[240px] flex-shrink-0 border-r border-white/[0.06] h-full overflow-y-auto py-6 px-4 space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-2 px-2">
            {section.title}
          </h3>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                    isActive
                      ? "text-[#00E5FF] bg-[#00E5FF]/[0.06]"
                      : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]"
                  )}
                >
                  {isActive && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                  <span className={cn(!isActive && "ml-5")}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}