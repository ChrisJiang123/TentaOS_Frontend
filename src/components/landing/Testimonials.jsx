import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "TentaOS changed how we work with AI. Seeing every agent step in real-time gives us confidence we never had before.",
    name: "Alex Chen",
    role: "CTO, DataForge",
    avatar: "A",
    color: "#3B82F6",
  },
  {
    quote: "The approval gates are a game-changer. We can let agents work autonomously on safe tasks and approve critical ones manually.",
    name: "Sarah Kim",
    role: "Head of AI, NovaTech",
    avatar: "S",
    color: "#8B5CF6",
  },
  {
    quote: "Pipeline Studio lets us build complex multi-agent workflows visually. What took us weeks now takes minutes.",
    name: "Marcus Rivera",
    role: "Lead Engineer, BuildStack",
    avatar: "M",
    color: "#10B981",
  },
  {
    quote: "Running local models through TentaOS gives us privacy and cost control. The BYOK model is unbeatable.",
    name: "Priya Patel",
    role: "VP Engineering, SecureAI",
    avatar: "P",
    color: "#F59E0B",
  },
  {
    quote: "The cost tracking alone paid for itself. We went from guessing API spend to having real-time visibility on every task.",
    name: "James Wu",
    role: "Founder, OptiScale",
    avatar: "J",
    color: "#06B6D4",
  },
  {
    quote: "Our team of 12 engineers uses TentaOS daily. The shared workspace and audit logs make collaboration seamless.",
    name: "Elena Rossi",
    role: "Engineering Manager, CloudFirst",
    avatar: "E",
    color: "#EC4899",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Trusted by builders
          </h2>
          <p className="text-white/40 mt-3">
            See what teams say about TentaOS
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 group"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-6 group-hover:text-white/70 transition-colors">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white/[0.06]"
                  style={{ backgroundColor: t.color + '20', color: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-white/30">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}