import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Workflow, Users, Shield, 
  Cpu, ChevronLeft, ChevronRight, Receipt,
  LogOut, DollarSign, FileText, Download, Zap, Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TentaLogo from '../brand/TentaLogo';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/LanguageContext';
import engineClient from '@/lib/engineClient';
import { useAuth } from '@/lib/AuthContext';
import { fetchBillingMe, fetchUserMe } from '@/lib/billingAccountApi';

const navKeys = [
  { path: '/Dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { path: '/PipelineStudio', icon: Workflow, key: 'pipeline' },
  { path: '/Agents', icon: Users, key: 'agents' },
  { path: '/Approvals', icon: Shield, key: 'approvals', badgeKey: 'approvals' },
  { path: '/Models', icon: Cpu, key: 'models' },
  { path: '/Pricing', icon: DollarSign, key: 'pricing' },
  { path: '/Billing', icon: Receipt, key: 'billing' },
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
      plan: String(billing.data?.plan ?? billing.data?.tier ?? 'free'),
    };
  }, [me.data, billing.data]);

  const { data: approvals = [] } = useQuery({
    queryKey: ['approvals-badge'],
    queryFn: async () => {
      const list = await engineClient.getApprovals();
      return Array.isArray(list) ? list : (list?.approvals || []);
    },
    refetchInterval: 30000,
  });
  const pendingCount = approvals.filter((a) => (a?.status || 'pending') === 'pending').length;

  return (
    <div className={cn(
      "h-screen bg-[#0F141F] border-r border-slate-500/10 flex flex-col transition-all duration-300 sticky top-0",
      collapsed ? "w-[68px]" : "w-[240px]"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/[0.06]">
        <div className="flex items-center overflow-hidden">
          <TentaLogo size="md" iconOnly={collapsed} />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navKeys.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/Dashboard' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-sky-500/[0.07] text-white border border-sky-400/15" 
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.04] border border-transparent"
              )}
            >
              <item.icon className={cn("w-[18px] h-[18px] flex-shrink-0", isActive && "text-sky-400")} />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{t(item.key)}</span>
              )}
              {item.badgeKey === 'approvals' && pendingCount > 0 && (
                <span className={cn(
                  "ml-auto text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400",
                  collapsed ? "w-2 h-2 p-0" : "px-1.5 py-0.5 min-w-[20px] text-center"
                )}>
                  {!collapsed && pendingCount}
                </span>
              )}
              {isActive && !collapsed && !item.badgeKey && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400/80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="py-3 px-2 border-t border-white/[0.06] space-y-1">
        <div className={cn("px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] mb-2", collapsed && "px-2")}>
          {!collapsed ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] text-white/35">Account</p>
                  <p className="text-xs text-white/75 truncate">{account.email || '未登录/匿名'}</p>
                </div>
                <Link
                  to="/pricing"
                  className="text-[11px] px-2 py-1 rounded-md bg-[#00E5FF] text-[#06060B] hover:bg-[#00E5FF]/90 transition-colors"
                >
                  Upgrade
                </Link>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
                <span>Status: <span className="text-white/75">{account.status}</span></span>
                {account.credits != null && (
                  <span className="whitespace-nowrap">· Credits: <span className="text-white/75">{account.credits.toLocaleString()}</span></span>
                )}
              </div>
              {(me.isError || billing.isError) && (
                <p className="mt-2 text-[11px] text-amber-300/80">
                  Billing 未连接或暂不可用
                </p>
              )}
            </>
          ) : (
            <Link to="/pricing" className="block w-full text-center text-[10px] text-white/60 hover:text-white/80">
              $
            </Link>
          )}
        </div>
        <Link
          to="/Downloads"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/40 hover:text-[#00E5FF] hover:bg-white/[0.04] transition-all w-full"
        >
          <Download className="w-4 h-4" />
          {!collapsed && <span className="text-xs">{t('desktopApp')}</span>}
        </Link>
        <Link
          to="/Docs"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/40 hover:text-[#00E5FF] hover:bg-white/[0.04] transition-all w-full"
        >
          <FileText className="w-4 h-4" />
          {!collapsed && <span className="text-xs">{t('devDocs')}</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-all w-full"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-xs">{t('collapse')}</span>}
        </button>
        <button
          onClick={() => logout(true)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/[0.04] transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="text-xs">{t('logout')}</span>}
        </button>
      </div>
    </div>
  );
}