// @ts-nocheck
import React, { createContext, useState, useContext, useEffect } from 'react';
import engineClient from '@/lib/engineClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setIsLoadingAuth(true);
      setAuthError(null);

      // 暂时移除 base44 认证：改为 Engine health 探活
      const health = await engineClient.getHealth();
      setAppPublicSettings({ engine: health });

      // 目前视为“无需登录”的本地模式
      setUser({ full_name: 'Local User' });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Engine health check failed:', error);
      // Engine 不可用时，仍允许进入前端（避免 auth 重定向/404）
      setUser({ full_name: 'Local User' });
      setIsAuthenticated(true);
    }

    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
  };

  const checkUserAuth = async () => {
    // legacy no-op (base44 removed)
    setIsAuthenticated(true);
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('base44_access_token');
        localStorage.removeItem('token');
      } catch {
        // ignore
      }
      if (shouldRedirect) window.location.href = '/Landing';
    }
  };

  const navigateToLogin = () => {
    // legacy no-op (base44 removed)
    if (typeof window !== 'undefined') window.location.href = '/Dashboard';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
