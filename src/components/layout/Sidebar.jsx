import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Workflow,
  Users,
  Shield,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Coins,
  Activity,
  LogOut,
  FileText,
  Download,
  Zap,
  Settings2,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TentaLogo from '../brand/TentaLogo';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/LanguageContext';
import { usePendingApprovalsCount } from '@/hooks/usePipelineRuntime';
import { useAuth } from '@/lib/AuthContext';
import { fetchBillingMe, fetchUserMe } from '@/lib/billingAccountApi';

const navKeys = [
  { path: '/Dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { path: '/PipelineStudio', icon: Workflow, key: 'pipeline' },
  { path: '/Agents', icon: Users, key: 'agents' },
  { path: '/Approvals', icon: Shield, key: 'approvals', badgeKey: 'approvals' },
  { path: '/Models', icon: Cpu, key: 'models' },
  { path: '/Usage', icon: Coins, key: 'usage' },
  { path: '/Metrics', icon: Activity, key: 'metrics' },
  { path: '/diagnostics', icon: Stethoscope, key: 'diagnostics' },
  { path: '/Triggers', icon: Zap, key: 'triggers' },
  { path: '/Settings', icon: Settings2, key: 'settings' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const { logout } = useAuth();

  const me = useQuery({
    queryKey: ['users-me', 'sidebar'],
    queryFn: () => fetchUserMe({ timeoutMs: 8000 }),
    retry: 0,
    staleTime: 30_000,
  });
  const billing = useQuery({
    queryKey: ['billing-me', 'sidebar'],
    queryFn: () => fetchBillingMe({ timeoutMs: 8000 }),
    retry: 0,
    staleTime: 30_000,
  });
  const account = useMemo(() => {
    const email = me.data?.email || me.data?.name || '';
    const status = billing.data?.status ?? '—';
    const credits = billing.data?.credits_balance;
    return {
      email,
      status: String(status),
      credits: credits == null ? null : Number(credits),
    };
  }, [me.data, billing.data]);

  const pendingCount = usePendingApprovalsCount();

  return (
    <aside
      className={cn(
        'h-full min-h-0 flex flex-col bg-[#0F141F] border-r border-white/[0.06] transition-[width] duration-300 shrink-0',
        collapsed ? 'w-[72px]' : 'w-[220px]',
      )}
    >
      <div className="h-14 shrink-0 flex items-center px-3 border-b border-white/[0.06]">
        <TentaLogo size="md" iconOnly={collapsed} />
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {navKeys.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/Dashboard' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? t(item.key) : undefined}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors w-full text-left',
                isActive
                  ? 'bg-sky-500/10 text-white'
                  : 'text-white/55 hover:text-white/85 hover:bg-white/[0.04]',
              )}
            >
              <item.icon
                className={cn('w-[17px] h-[17px] shrink-0', isActive ? 'text-sky-400' : 'text-white/45')}
              />
              {!collapsed && (
                <span className="text-[13px] font-medium truncate flex-1">{t(item.key)}</span>
              )}
              {item.badgeKey === 'approvals' && pendingCount > 0 && (
                <span
                  className={cn(
                    'shrink-0 text-[10px] font-bold rounded-full bg-amber-500/25 text-amber-300',
                    collapsed ? 'w-2 h-2 min-w-0 p-0' : 'px-1.5 py-0.5 min-w-[18px] text-center',
                  )}
                >
                  {!collapsed && pendingCount}
                </span>
              )}
              {isActive && !collapsed && !item.badgeKey && (
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-sky-400/90" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/[0.06] p-2 space-y-0.5 bg-[#0F141F]">
        {!collapsed && (
          <div className="px-2.5 py-2 mb-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-white/40 uppercase tracking-wide">{t('accountLabel')}</p>
              <Link
                to="/pricing"
                className="text-[10px] px-1.5 py-0.5 rounded text-white/60 hover:text-white border border-white/10 hover:bg-white/[0.06]"
              >
                {t('pricing')}
              </Link>
            </div>
            <p className="text-[11px] text-white/75 truncate mt-1">{account.email || t('accountAnonymous')}</p>
            <p className="text-[10px] text-white/40 mt-1 truncate">
              {account.status}
              {account.credits != null && ` · ${account.credits.toLocaleString()} cr`}
            </p>
          </div>
        )}

        <Link
          to="/Downloads"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-white/45 hover:text-[#00E5FF] hover:bg-white/[0.04] w-full"
        >
          <Download className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-xs">{t('desktopApp')}</span>}
        </Link>
        <Link
          to="/Docs"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-white/45 hover:text-[#00E5FF] hover:bg-white/[0.04] w-full"
        >
          <FileText className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-xs">{t('devDocs')}</span>}
        </Link>
        <button
          type="button"
          onClick={() => logout(true)}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-white/45 hover:text-red-400 hover:bg-red-500/[0.06] w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-xs font-medium">{t('logout')}</span>}
        </button>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/[0.04] w-full"
        >
          {collapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
          {!collapsed && <span className="text-xs">{t('collapse')}</span>}
        </button>
      </div>
    </aside>
  );
}
