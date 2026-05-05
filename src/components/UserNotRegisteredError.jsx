import React from 'react';
import { AlertTriangle, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TentaLogo from './brand/TentaLogo';

export default function UserNotRegisteredError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#06060B] p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <TentaLogo size="md" />
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Access Restricted</h1>
            <p className="text-sm text-white/50 mb-6 leading-relaxed">
              You are not registered to use this application. Please contact the administrator to request access.
            </p>

            <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-left mb-6">
              <p className="text-xs text-white/40 mb-2 font-medium">If this is an error, try:</p>
              <ul className="space-y-2 text-xs text-white/50">
                <li className="flex items-start gap-2">
                  <span className="text-white/20 mt-0.5">•</span>
                  Verify you are logged in with the correct account
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/20 mt-0.5">•</span>
                  Contact the app administrator for access
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/20 mt-0.5">•</span>
                  Try logging out and back in again
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                className="border-white/10 text-white/70 hover:text-white bg-transparent hover:bg-white/5"
                onClick={() => window.location.href = '/Landing'}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Home
              </Button>
              <Button
                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20"
                onClick={() => window.location.href = '/Landing'}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}