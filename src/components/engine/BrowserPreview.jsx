import React, { useState, useEffect } from 'react';
import engineClient from '@/lib/engineClient';
import { Monitor } from 'lucide-react';

export default function BrowserPreview() {
  const [screenshot, setScreenshot] = useState(null);

  useEffect(() => {
    return engineClient.on('browser_action', (data) => {
      const shot = data.screenshot ?? data.image ?? data.screenshot_base64;
      if (shot) {
        setScreenshot(typeof shot === 'string' && shot.startsWith('data:') ? shot : `data:image/jpeg;base64,${shot}`);
      }
    });
  }, []);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <Monitor className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-medium text-white">浏览器预览</span>
      </div>
      <div className="p-3">
        {screenshot ? (
          <img
            src={screenshot}
            alt="Browser preview"
            className="w-full rounded-lg border border-white/[0.06]"
          />
        ) : (
          <div className="flex items-center justify-center h-48 text-white/20 text-sm">
            <div className="text-center">
              <Monitor className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>浏览器空闲中</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}