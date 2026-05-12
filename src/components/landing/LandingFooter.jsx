import React from 'react';
import { Link } from 'react-router-dom';
import TentaLogo from '../brand/TentaLogo';
import { Github, Twitter } from 'lucide-react';

const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Home', href: '/Landing' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Downloads', href: '/Downloads' },
      { label: 'Support', href: '/support' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/Docs' },
      { label: 'Quick Start', href: '/Docs' },
      { label: 'CLI Reference', href: '/Docs/CliReference' },
      { label: 'API Docs', href: '/Docs/ApiOverview' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Changelog', href: '/Docs/Changelog' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/refund' },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <TentaLogo size="md" />
            <p className="text-xs text-white/30 mt-3 max-w-[200px] leading-relaxed">
              The visual AI operating system. See everything. Control everything.
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-white/[0.06] pt-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs text-white/25 leading-relaxed">
              <p>Product: <span className="text-white/40">TentaOS</span></p>
              <p>Company: <span className="text-white/40">Wuhan Luojia Zhihui Technology Co., Ltd.</span></p>
              <p>
                Contact:{' '}
                <a className="text-[#00E5FF]/90 hover:text-[#00E5FF]" href="mailto:support@tentaos.com">
                  support@tentaos.com
                </a>
              </p>
            </div>
            <p className="text-xs text-white/20">© 2026 TentaOS. All rights reserved.</p>
          </div>

          <div className="text-[11px] text-white/25 leading-relaxed space-y-1">
            <p>
              TentaOS is an independent software platform and is not affiliated with OpenAI, Anthropic, Google, DeepSeek, or any other AI model provider. Third-party AI models may be used through their respective APIs to power AI-assisted workflows.
            </p>
            <p>
              Payments are processed by third-party payment providers. TentaOS does not store full card details.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                <Github className="w-3.5 h-3.5 text-white/30 hover:text-white/50" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                <Twitter className="w-3.5 h-3.5 text-white/30 hover:text-white/50" />
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/20">
              <Link to="/pricing" className="hover:text-white/40 transition-colors">Pricing</Link>
              <Link to="/terms" className="hover:text-white/40 transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-white/40 transition-colors">Privacy Policy</Link>
              <Link to="/refund" className="hover:text-white/40 transition-colors">Refund Policy</Link>
              <Link to="/contact" className="hover:text-white/40 transition-colors">Contact</Link>
              <Link to="/support" className="hover:text-white/40 transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}