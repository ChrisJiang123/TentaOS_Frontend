import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import DocsSidebar from './DocsSidebar';
import TentaLogo from '../brand/TentaLogo';
import { Search, ArrowLeft } from 'lucide-react';

const topTabs = [
  { label: 'Guides', path: '/Docs' },
  { label: 'API Reference', path: '/Docs/ApiOverview' },
  { label: 'SDKs', path: '/Docs/PythonSdk' },
  { label: 'CLI', path: '/Docs/CliReference' },
  { label: 'Changelog', path: '/Docs/Changelog' },
];

export default function DocsLayout() {
  return (
    <div className="min-h-screen bg-[#06060B] text-white flex flex-col">
      {/* Top nav */}
      <header className="h-14 border-b border-white/[0.06] flex items-center px-6 gap-6 bg-[#06060B]/80 backdrop-blur-xl sticky top-0 z-50">
        <Link to="/Landing" className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors mr-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <Link to="/Docs">
          <TentaLogo size="sm" />
        </Link>
        <span className="text-white/20 text-sm">|</span>
        <span className="text-sm font-medium text-white/60">Developer Docs</span>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {topTabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className="px-3 py-1.5 text-xs text-white/40 hover:text-white/70 rounded-md hover:bg-white/[0.04] transition-colors"
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/30 text-xs cursor-pointer hover:bg-white/[0.06] transition-colors">
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="ml-4 text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded">⌘K</kbd>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1">
        <DocsSidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}