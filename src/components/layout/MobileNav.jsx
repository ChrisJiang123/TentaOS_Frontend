import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Workflow, Users, Shield, 
  Cpu, Receipt, DollarSign, Menu, X, FileText, LogOut, Download, Zap, Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import TentaLogo from '../brand/TentaLogo';
import { useLanguage } from '@/lib/LanguageContext';
import engineClient from '@/lib/engineClient';
import { useAuth } from '@/lib/AuthContext';

const navKeys = [
  { path: '/Dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { path: '/PipelineStudio', icon: Workflow, key: 'pipeline' },
  { path: '/Agents', icon: Users, key: 'agents' },
  { path: '/Approvals', icon: Shield, key: 'approvals' },
  { path: '/Models', icon: Cpu, key: 'models' },
  { path: '/Pricing', icon: DollarSign, key: 'pricing' },
  { path: '/Billing', icon: Receipt, key: 'billing' },
  { path: '/Triggers', icon: Zap, key: 'triggers' },
  { path: '/Settings', icon: Settings2, key: 'settings' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const { logout } = useAuth();

  const { data: approvals = [] } = useQuery({
    queryKey: ['approvals-badge-mobile'],
    queryFn: async () => {
      const list = await engineClient.getApprovals();
      return Array.isArray(list) ? list : (list?.approvals || []);
    },
    refetchInterval: 30000,
  });
  const pendingCount = approvals.filter((a) => (a?.status || 'pending') === 'pending').length;

  return (
    <>
      {/* Top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#0A0E1A]/95 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4">
        <TentaLogo size="sm" />
        <button
          onClick={() => setOpen(!open)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.06]"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />
      )}

      {/* Slide-out menu */}
      <div className={cn(
        "lg:hidden fixed top-14 right-0 bottom-0 z-50 w-64 bg-[#0A0E1A] border-l border-white/[0.06] transform transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        <nav className="p-3 space-y-1">
          {navKeys.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                  isActive
                    ? "bg-sky-500/[0.07] text-white border border-sky-400/15"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.04] border border-transparent"
                )}
              >
                <item.icon className={cn("w-[18px] h-[18px]", isActive && "text-sky-400")} />
                <span className="text-sm font-medium flex-1">{t(item.key)}</span>
                {item.key === 'approvals' && pendingCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 min-w-[20px] text-center">{pendingCount}</span>
                )}
              </Link>
            );
          })}
          <div className="border-t border-white/[0.06] mt-3 pt-3 space-y-1">
            <Link
              to="/Downloads"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/40 hover:text-[#00E5FF] hover:bg-white/[0.04] transition-all"
            >
              <Download className="w-[18px] h-[18px]" />
              <span className="text-sm font-medium">{t('desktopApp')}</span>
            </Link>
            <Link
              to="/Docs"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/40 hover:text-[#00E5FF] hover:bg-white/[0.04] transition-all"
            >
              <FileText className="w-[18px] h-[18px]" />
              <span className="text-sm font-medium">{t('docs')}</span>
            </Link>
            <button
              onClick={() => { setOpen(false); logout(true); }}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/[0.04] transition-all w-full"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span className="text-sm font-medium">{t('logout')}</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}