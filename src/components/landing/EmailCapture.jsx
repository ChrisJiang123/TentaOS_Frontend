import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

/** Contact capture — no third-party form until configured; directs to contact. */
export default function EmailCapture() {
  return (
    <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
      <p className="text-xs text-white/40 text-center sm:text-left flex items-center gap-2">
        <Mail className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
        Questions? Reach our team directly.
      </p>
      <Link
        to="/contact"
        className="whitespace-nowrap px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white text-sm font-medium hover:bg-white/[0.10] transition-colors"
      >
        Contact us
      </Link>
    </div>
  );
}
