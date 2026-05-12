// @ts-nocheck
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, ArrowLeft, CheckCircle2, Loader2, Monitor, Apple, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import TentaLogo from '../components/brand/TentaLogo';
import { toast } from '@/components/ui/use-toast';
import { generateOfflineHTML } from '../lib/generateOfflineHTML';
import useSEO from '../lib/useSEO';
import LandingFooter from '../components/landing/LandingFooter';

export default function Downloads() {
  const [downloading, setDownloading] = useState(false);

  useSEO({
    title: 'Download TentaOS Dashboard — Offline Desktop App for Windows, macOS & Linux',
    description: 'Download TentaOS for your platform. Available for macOS, Windows, and Linux. Get started in minutes.',
    keywords: 'TentaOS download, offline AI dashboard, desktop AI app, TentaOS desktop, AI workflow desktop app',
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const html = generateOfflineHTML();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'TentaOS-Dashboard.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Download complete', description: 'TentaOS-Dashboard.html has been saved.' });
    } catch (err) {
      toast({ title: 'Download failed', description: err.message, variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06060B] text-white">
      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-[#06060B]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/Landing" className="text-white/40 hover:text-white/60 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <TentaLogo size="sm" />
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-xs text-[#00E5FF] mb-4">
            v1.0.0-beta · Offline Edition
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Download TentaOS Dashboard
          </h1>
          <p className="text-white/40 max-w-xl mx-auto">
            Download a fully self-contained offline HTML version of the TentaOS Dashboard. 
            Open it in any browser — no internet or installation required.
          </p>
        </motion.div>

        {/* Main Download Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#00E5FF]/[0.06] to-purple-500/[0.04] border border-[#00E5FF]/20 rounded-2xl p-8 text-center mb-12"
        >
          <div className="w-20 h-20 rounded-2xl bg-[#00E5FF]/10 flex items-center justify-center mx-auto mb-6">
            <Download className="w-10 h-10 text-[#00E5FF]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">TentaOS-Dashboard.html</h2>
          <p className="text-sm text-white/40 mb-6">
            Single-file offline dashboard with full UI, dark theme, and interactive demo data.
          </p>
          <Button
            size="lg"
            onClick={handleDownload}
            disabled={downloading}
            className="bg-[#00E5FF] text-[#06060B] hover:bg-[#00E5FF]/80 h-13 px-10 text-base font-semibold rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all"
          >
            {downloading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Download className="w-5 h-5 mr-2" /> Download Offline Dashboard</>
            )}
          </Button>
          <p className="text-xs text-white/25 mt-4">~50 KB · Works in Chrome, Firefox, Safari, Edge</p>
        </motion.div>

        {/* What's Included */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 mb-12">
          <h2 className="text-lg font-semibold text-white mb-5">What's in the offline version</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Full Dashboard UI with dark theme',
              'Task management interface',
              'Agent monitoring sidebar',
              'Stats & metrics overview',
              'Pipeline Studio preview',
              'Interactive demo data',
              'No internet required',
              'Single HTML file — no dependencies',
            ].map(f => (
              <div key={f} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-white/60">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Support */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-white mb-4">Works everywhere</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Apple, label: 'macOS', desc: 'Safari, Chrome, Firefox' },
              { icon: Monitor, label: 'Windows', desc: 'Chrome, Edge, Firefox' },
              { icon: Terminal, label: 'Linux', desc: 'Chrome, Firefox' },
            ].map(p => (
              <div key={p.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
                <p.icon className="w-6 h-6 mx-auto mb-2 text-white/40" />
                <p className="text-sm font-medium text-white/70">{p.label}</p>
                <p className="text-xs text-white/30 mt-0.5">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}