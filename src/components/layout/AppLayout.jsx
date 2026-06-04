import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import engineClient from '@/lib/engineClient';
import { engineTaskStore } from '@/lib/engineTaskStore';
import PipelineRunStatusBar from '@/components/debug/PipelineRunStatusBar';
import RuntimeDebugPanel from '@/components/debug/RuntimeDebugPanel';
import PageErrorBoundary from '@/components/common/PageErrorBoundary';

/** Routed page slot — ErrorBoundary scoped to Outlet only; resets on route change. */
function RoutedPageContent() {
  const location = useLocation();
  return (
    <PageErrorBoundary key={location.pathname} resetKey={location.pathname}>
      <Outlet />
    </PageErrorBoundary>
  );
}

export default function AppLayout() {
  useEffect(() => {
    engineClient.connect();
    engineTaskStore.refreshList().catch((err) => {
      console.error('[AppLayout] refreshList failed', err);
    });
    return () => engineClient.disconnect();
  }, []);

  return (
    <div className="flex h-dvh max-h-[100dvh] w-full overflow-hidden bg-[#06060B]">
      <div className="hidden lg:flex h-full min-h-0 shrink-0">
        <Sidebar />
      </div>
      <MobileNav />
      <main
        id="app-scroll-container"
        className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden pt-14 lg:pt-0 flex flex-col"
      >
        <PipelineRunStatusBar />
        <div className="flex-1 min-h-0 flex flex-col">
          <RoutedPageContent />
        </div>
      </main>
      <RuntimeDebugPanel />
    </div>
  );
}
