// @ts-nocheck
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import engineClient from '@/lib/engineClient';
import {
  loginWithEmail,
  loginDemo,
  refreshSession,
  fetchAuthMe,
  logoutLocal,
  getStoredUser,
} from '@/lib/authApi';
import { getAuthToken } from '@/lib/accountStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const checkAppState = useCallback(async () => {
    try {
      setIsLoadingPublicSettings(true);
      setIsLoadingAuth(true);
      setAuthError(null);

      const health = await engineClient.getHealth();
      setAppPublicSettings({ engine: health });

      const token = getAuthToken();
      if (token) {
        await refreshSession().catch(() => null);
        const me = await fetchAuthMe();
        if (me) {
          setUser(me);
          setIsAuthenticated(true);
        } else {
          setUser(getStoredUser() || { full_name: 'User' });
          setIsAuthenticated(true);
        }
      } else {
        const stored = getStoredUser();
        if (stored) {
          setUser(stored);
          setIsAuthenticated(true);
        } else {
          const demo = await loginDemo();
          setUser(demo.user);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Engine health check failed:', error);
      const stored = getStoredUser();
      setUser(stored || { full_name: 'Local User' });
      setIsAuthenticated(true);
    }

    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
  }, []);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  const login = async (email, password) => {
    const { user: u } = await loginWithEmail(email, password);
    setUser(u);
    setIsAuthenticated(true);
    return u;
  };

  const loginDemoMode = async () => {
    const { user: u } = await loginDemo();
    setUser(u);
    setIsAuthenticated(true);
    return u;
  };

  const logout = (shouldRedirect = true) => {
    logoutLocal();
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect && typeof window !== 'undefined') {
      window.location.href = '/Landing';
    }
  };

  const navigateToLogin = () => {
    if (typeof window !== 'undefined') window.location.href = '/Settings';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
        login,
        loginDemo: loginDemoMode,
      }}
    >
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
