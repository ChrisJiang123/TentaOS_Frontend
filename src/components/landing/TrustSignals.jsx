import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Box, RotateCcw, ScrollText } from 'lucide-react';

const signals = [
  { icon: Shield, title: 'Human approval before risky actions', desc: 'Configure gates so sensitive steps wait for your decision.' },
  { icon: Box, title: 'Sandboxed execution', desc: 'Run tasks in isolated paths designed to limit unintended side effects.' },
  { icon: RotateCcw, title: 'Rollback support', desc: 'Revert workflow changes when your pipeline configuration allows it.' },
  { icon: ScrollText, title: 'Transparent execution logs', desc: 'Review traces and step history instead of black-box chat replies.' },
];

export default function TrustSignals() {
  return (
    <section className="py-14 px-6 border-t border-white/[0.04]">
      <div className="max-w-4xl mx-auto">
        <p className="text-[11px] uppercase tracking-wider text-white/35 text-center mb-6">Trust &amp; safety</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {signals.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="flex gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
            >
              <s.icon className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-white/80">{s.title}</p>
                <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
