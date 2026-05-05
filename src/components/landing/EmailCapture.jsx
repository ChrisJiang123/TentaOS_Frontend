import React, { useState } from 'react';
import { Mail, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmailCapture() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await fetch('https://formspree.io/f/YOUR_FORMSPREE_ID', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'landing_hero', timestamp: new Date().toISOString() }),
      });
    } catch (e) {
      // analytics（base44）已移除：这里静默忽略
    }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mt-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400">You're on the list! We'll notify you when new features drop.</span>
        </motion.div>
      ) : (
        <motion.div key="form" className="mt-5">
          <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
            <div className="relative flex-1 w-full">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-sm placeholder:text-white/30 outline-none focus:border-[#00E5FF]/40 transition-colors"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Get Early Access
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-2 text-center">{error}</p>}
          <p className="text-[11px] text-white/20 mt-2 text-center">No spam. Unsubscribe anytime.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}