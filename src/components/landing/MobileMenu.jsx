import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function MobileMenu({ isLoggedIn, onLogin, onDashboard }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.06]"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-56 bg-[#0F1017] border border-white/[0.08] rounded-xl shadow-2xl z-50 p-3 space-y-1">
            <a href="#features" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors">Features</a>
            <a href="#howitworks" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors">How It Works</a>
            <a href="#compare" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors">Compare</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors">Pricing</a>
            <a href="/Docs" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors">Docs</a>
            <div className="border-t border-white/[0.06] pt-2 mt-2">
              {isLoggedIn ? (
                <button onClick={() => { setOpen(false); onDashboard(); }} className="w-full px-3 py-2.5 rounded-lg text-sm text-[#00E5FF] bg-[#00E5FF]/10 text-left font-medium">
                  Dashboard
                </button>
              ) : (
                <button onClick={() => { setOpen(false); onLogin(); }} className="w-full px-3 py-2.5 rounded-lg text-sm text-[#00E5FF] bg-[#00E5FF]/10 text-left font-medium">
                  Sign in / Sign up
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}