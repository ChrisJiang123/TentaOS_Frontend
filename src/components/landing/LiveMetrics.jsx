import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const metrics = [
  { label: 'Tasks Completed', target: 47823, suffix: '+', color: '#3B82F6' },
  { label: 'Agents Active', target: 12540, suffix: '+', color: '#10B981' },
  { label: 'Avg Response Time', target: 1.2, suffix: 's', decimals: 1, color: '#F59E0B' },
  { label: 'Cost Saved', target: 89, suffix: '%', color: '#8B5CF6' },
];

function AnimatedCounter({ target, suffix = '', decimals = 0 }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setValue(current);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  const formatted = decimals > 0
    ? value.toFixed(decimals)
    : value >= 1000
      ? Math.floor(value).toLocaleString()
      : Math.floor(value);

  return <span>{formatted}{suffix}</span>;
}

export default function LiveMetrics() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
            >
              <p className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: m.color }}>
                <AnimatedCounter target={m.target} suffix={m.suffix} decimals={m.decimals} />
              </p>
              <p className="text-xs text-white/40 mt-2">{m.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}