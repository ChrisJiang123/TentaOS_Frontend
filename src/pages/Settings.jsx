// @ts-nocheck
import React from 'react';
import { Settings2, User, Globe, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import engineClient from '@/lib/engineClient';
import {
  ENGINE_URL,
  WS_URL,
  setEngineUrl,
  clearEngineUrlOverride,
  hasEngineUrlOverride,
} from '@/config';
import { useQuery } from '@tanstack/react-query';
import { probeTaskApi, fetchControlPlaneStatus } from '@/lib/controlPlaneApi';
import ExecutionPreferences from '@/components/settings/ExecutionPreferences';
import ExecutionPermissions from '@/components/settings/ExecutionPermissions';
import { getAuthToken } from '@/lib/accountStorage';

export default function Settings() {
  const { user, logout, login, loginDemo, isAuthenticated } = useAuth();
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [authBusy, setAuthBusy] = React.useState(false);
  const { lang, setLang, t } = useLanguage();
  const { data: health, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['engine-health-settings'],
    queryFn: () => engineClient.getHealth(),
    refetchInterval: 15000,
  });
  const conn = engineClient.getConnectionInfo?.() || { state: 'unknown', connected: false };

  const taskApi = useQuery({
    queryKey: ['settings-task-api'],
    queryFn: probeTaskApi,
    retry: 0,
    staleTime: 20_000,
    refetchInterval: 30_000,
  });

  const controlPlane = useQuery({
    queryKey: ['settings-control-plane'],
    queryFn: fetchControlPlaneStatus,
    retry: 0,
    staleTime: 30_000,
  });

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
              {hasEngineUrlOverride() && (
                <p className="text-[11px] text-amber-400/90">当前使用 localStorage 覆盖（无需重新 build）</p>
              )}
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
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <label className="text-xs text-white/40">Engine URL（运行时覆盖）</label>
                <p className="text-sm text-white font-mono break-all">{ENGINE_URL}</p>
                <p className="text-xs text-white/30 font-mono break-all">WS: {WS_URL}</p>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="https://engine.tentaos.com"
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        setEngineUrl(e.currentTarget.value.trim());
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => clearEngineUrlOverride()}
                    className="px-3 py-2 text-xs text-white/40 hover:text-white/60 border border-white/[0.08] rounded-lg shrink-0"
                  >
                    重置
                  </button>
                </div>
                <p className="text-[10px] text-white/20">
                  输入 Engine 地址后按回车，页面会自动刷新。本地开发用 http://localhost:3001；远程 demo 默认 {`https://engine.tentaos.com`}，也可手动填写 ngrok 等地址。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-sm font-medium text-white mb-4">Control plane status</h2>
            <div className="space-y-2">
              <InfoRow label="Active Engine URL" value={ENGINE_URL} />
              <InfoRow label="Inferred WS URL" value={WS_URL} />
              <InfoRow
                label="Health"
                value={
                  healthLoading ? 'Loading…' : healthError ? 'Unreachable' : (health?.status ?? 'OK')
                }
              />
              <InfoRow
                label="Task API (GET /api/tasks)"
                value={
                  taskApi.isLoading
                    ? 'Checking…'
                    : taskApi.data?.ok
                      ? `OK · ${taskApi.data.count ?? 0} tasks`
                      : `Error${taskApi.data?.error ? `: ${taskApi.data.error}` : ''}`
                }
              />
              <InfoRow
                label="Control plane"
                value={
                  controlPlane.isLoading
                    ? 'Checking…'
                    : controlPlane.data?.ok
                      ? controlPlane.data.status?.status || controlPlane.data.status?.phase || 'Connected'
                      : 'Not available yet'
                }
              />
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

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-sm font-medium text-white mb-4">账户登录（Phase 19）</h2>
            {isAuthenticated && getAuthToken() ? (
              <p className="text-xs text-emerald-400/90 mb-3">已使用 Engine token 登录</p>
            ) : (
              <p className="text-xs text-white/40 mb-3">未登录时使用本地模式；登录后偏好与模板同步到账户</p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <input
                type="email"
                placeholder="email@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white"
              />
              <input
                type="password"
                placeholder="密码"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white"
              />
              <button
                type="button"
                disabled={authBusy}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
                data-testid="auth-login-btn"
                onClick={async () => {
                  setAuthBusy(true);
                  try {
                    await login(loginEmail, loginPassword);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setAuthBusy(false);
                  }
                }}
              >
                登录
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-white/10 text-white/60 text-sm"
                onClick={() => loginDemo()}
              >
                本地模式
              </button>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-sm font-medium text-white mb-4">执行偏好（Phase 10）</h2>
            <ExecutionPreferences />
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-sm font-medium text-white mb-4">权限与密钥（Phase 17）</h2>
            <ExecutionPermissions />
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