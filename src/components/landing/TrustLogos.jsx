import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, DollarSign, Clock, Eye } from 'lucide-react';

const badges = [
  { icon: Cpu, label: '5+ AI Models' },
  { icon: DollarSign, label: '$0.01/task' },
  { icon: Clock, label: '60s Average' },
  { icon: Eye, label: 'Full Transparency' },
];

export default function TrustLogos() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 py-8">
      {badges.map((badge, i) => (
        <motion.div
          key={badge.label}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06]"
        >
          <badge.icon className="w-3.5 h-3.5 text-white/30" />
          <span className="text-xs text-white/40">{badge.label}</span>
        </motion.div>
      ))}
    </div>
  );
}