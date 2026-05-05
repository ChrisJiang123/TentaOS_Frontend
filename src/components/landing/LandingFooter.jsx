import React from 'react';
import { Link } from 'react-router-dom';
import TentaLogo from '../brand/TentaLogo';
import { Github, Twitter } from 'lucide-react';

const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', href: '/Dashboard' },
      { label: 'Pipeline Studio', href: '/PipelineStudio' },
      { label: 'Pricing', href: '/Pricing' },
      { label: 'Downloads', href: '/Downloads' },
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
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Changelog', href: '/Docs/Changelog' },
      { label: 'Contact', href: '#' },
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
        <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">© 2026 TentaOS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                <Github className="w-3.5 h-3.5 text-white/30 hover:text-white/50" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                <Twitter className="w-3.5 h-3.5 text-white/30 hover:text-white/50" />
              </a>
            </div>
            <div className="flex items-center gap-6 text-xs text-white/20">
              <a href="#" className="hover:text-white/40 transition-colors">Privacy</a>
              <a href="#" className="hover:text-white/40 transition-colors">Terms</a>
              <a href="#" className="hover:text-white/40 transition-colors">Security</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}