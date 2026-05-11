// @ts-nocheck
import React from 'react';
import { Settings2, User, Globe, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import engineClient from '@/lib/engineClient';
import { ENGINE_URL, WS_URL } from '@/config';
import { useQuery } from '@tanstack/react-query';

export default function Settings() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { data: health, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['engine-health-settings'],
    queryFn: () => engineClient.getHealth(),
    refetchInterval: 15000,
  });
  const conn = engineClient.getConnectionInfo();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      data-testid="settings-page"
      className="min-h-screen p-6 lg:p-8"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Settings2 className="w-6 h-6 text-[#00E5FF]" />
            <h1 className="text-2xl font-semibold text-white tracking-tight">{t('settingsTitle')}</h1>
          </div>
          <p className="text-sm text-white/40 mt-1">{t('settingsSubtitle')}</p>
        </div>

        <div className="space-y-6">
          {/* Engine / API Section */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Settings2 className="w-4 h-4 text-white/50" />
              <h2 className="text-sm font-medium text-white">Engine Status & API</h2>
            </div>

            <div className="space-y-3">
              <InfoRow label="ENGINE_URL" value={ENGINE_URL} />
              <InfoRow label="WS_URL" value={WS_URL} />
              <InfoRow label="WebSocket" value={`${conn.state}${conn.connected ? ' (connected)' : ''}`} />
              <InfoRow
                label="Health"
                value={
                  healthLoading
                    ? 'Loading…'
                    : healthError
                      ? 'Error'
                      : (health?.status ?? 'OK')
                }
              />
              <div className="pt-3 text-xs text-white/35">
                这里是本地配置占位。后续可在 Engine 提供配置/鉴权接口后接入真实设置面板。
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-4 h-4 text-white/50" />
              <h2 className="text-sm font-medium text-white">{t('accountSection')}</h2>
            </div>
            <div className="space-y-4">
              <InfoRow label={t('fullName')} value={user?.full_name || '—'} />
              <InfoRow label={t('email')} value={user?.email || '—'} />
              <InfoRow label={t('role')} value={user?.role || 'user'} capitalize />
              <InfoRow
                label={t('memberSince')}
                value={user?.created_date ? new Date(user.created_date).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              />
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Globe className="w-4 h-4 text-white/50" />
              <h2 className="text-sm font-medium text-white">{t('preferencesSection')}</h2>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-3">{t('languageDesc')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setLang('en')}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
                    lang === 'en'
                      ? "bg-[#00E5FF]/10 border-[#00E5FF]/30 text-[#00E5FF]"
                      : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white/70 hover:border-white/[0.15]"
                  )}
                >
                  🇺🇸 {t('english')}
                </button>
                <button
                  onClick={() => setLang('zh')}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
                    lang === 'zh'
                      ? "bg-[#00E5FF]/10 border-[#00E5FF]/30 text-[#00E5FF]"
                      : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white/70 hover:border-white/[0.15]"
                  )}
                >
                  🇨🇳 {t('chinese')}
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/[0.03] border border-red-500/[0.1] rounded-2xl p-6">
            <h2 className="text-sm font-medium text-red-400 mb-3">{t('dangerZone')}</h2>
            <p className="text-xs text-white/40 mb-4">{t('logoutDesc')}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout(true)}
              className="border-red-500/20 text-red-400 hover:bg-red-500/10 h-8 text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value, capitalize }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span className={cn("text-sm text-white/80", capitalize && "capitalize")}>{value}</span>
    </div>
  );
}