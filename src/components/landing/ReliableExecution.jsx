import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Monitor, ShieldCheck, Box } from 'lucide-react';

const cards = [
  { icon: Layers, title: 'Multi-model orchestration', desc: 'Route tasks across providers with clear execution traces.' },
  { icon: Monitor, title: 'Browser + terminal execution', desc: 'Run workflows in browser and shell contexts with observable steps.' },
  { icon: ShieldCheck, title: 'Human approval workflows', desc: 'Require approval before risky actions when you configure gates.' },
  { icon: Box, title: 'Sandbox-first architecture', desc: 'Isolate execution paths to reduce blast radius during beta.' },
];

export default function ReliableExecution() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            Built for reliable AI execution
          </h2>
          <p className="text-sm text-white/40 mt-2 max-w-lg mx-auto">
            Infrastructure-focused controls for teams that need observable, approval-based automation.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
            >
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center mb-3">
                <c.icon className="w-4 h-4 text-[#00E5FF]/80" />
              </div>
              <h3 className="text-sm font-medium text-white mb-1">{c.title}</h3>
              <p className="text-xs text-white/45 leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
