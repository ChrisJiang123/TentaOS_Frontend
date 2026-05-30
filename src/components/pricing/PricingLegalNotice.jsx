import React from 'react';
import { Link } from 'react-router-dom';

export default function PricingLegalNotice() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-xs text-white/45 leading-relaxed space-y-3">
      <p>
        <span className="text-white/70 font-medium">Payment processing.</span> Subscriptions and credit packs are
        sold through our payment provider Creem. TentaOS does not collect or store full card numbers in the
        browser. Checkout is initiated via{' '}
        <code className="text-white/55">POST /api/billing/creem/checkout</code> on our server.
      </p>
      <p>
        <span className="text-white/70 font-medium">Displayed prices.</span> Prices shown on this page are list
        prices in USD before tax. Final amount may vary based on region and Creem checkout.
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[#00E5FF]/90">
        <Link to="/terms" className="hover:text-[#00E5FF]">
          Terms of Service
        </Link>
        <Link to="/refund" className="hover:text-[#00E5FF]">
          Refund Policy
        </Link>
        <Link to="/privacy" className="hover:text-[#00E5FF]">
          Privacy Policy
        </Link>
        <a href="mailto:support@tentaos.com" className="hover:text-[#00E5FF]">
          support@tentaos.com
        </a>
      </div>
    </div>
  );
}
