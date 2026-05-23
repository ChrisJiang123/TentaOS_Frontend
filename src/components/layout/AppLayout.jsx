import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import engineClient from '@/lib/engineClient';
import PipelineRunStatusBar from '@/components/debug/PipelineRunStatusBar';
import RuntimeDebugPanel from '@/components/debug/RuntimeDebugPanel';

export default function AppLayout() {
  useEffect(() => {
    engineClient.connect();
    return () => engineClient.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#06060B]">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <MobileNav />
      <main id="app-scroll-container" className="flex-1 overflow-auto pt-14 lg:pt-0 flex flex-col">
        <PipelineRunStatusBar />
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </main>
      <RuntimeDebugPanel />
    </div>
  );
}
