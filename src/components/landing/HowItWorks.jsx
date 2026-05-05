import React from 'react';
import { Sparkles, Workflow, Eye, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const steps = [
  { num: '01', icon: Sparkles, title: 'Describe Your Goal', desc: 'Type what you want done in natural language — research, code, write, automate', color: '#3B82F6' },
  { num: '02', icon: Workflow, title: 'AI Plans the Workflow', desc: 'TentaOS decomposes your goal into steps and assigns specialized agents', color: '#8B5CF6' },
  { num: '03', icon: Eye, title: 'Watch It Execute', desc: 'See every agent step in real-time. Approve critical actions before they happen', color: '#10B981' },
  { num: '04', icon: CheckCircle2, title: 'Get Results', desc: 'Receive artifacts, reports, code — everything auditable and replayable', color: '#00E5FF' },
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            How it works
          </h2>
          <p className="text-white/40 mt-3 max-w-xl mx-auto">
            From goal to result in four simple steps
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] w-[75%] h-px">
            <div className="h-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20" />
            <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-blue-500/30 to-transparent animate-pulse" />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative group"
            >
              <div className="text-center">
                <div className="relative inline-flex mb-5">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 3 }}
                    className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center mx-auto",
                      "ring-1 ring-white/[0.06] group-hover:ring-2 transition-all duration-300"
                    )}
                    style={{ backgroundColor: step.color + '10' }}
                  >
                    <step.icon className="w-8 h-8" style={{ color: step.color }} />
                    {/* Glow on hover */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                      style={{ backgroundColor: step.color + '15' }}
                    />
                  </motion.div>
                  <span
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-[#06060B]"
                    style={{ backgroundColor: step.color + '30', color: step.color }}
                  >
                    {step.num}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed max-w-[220px] mx-auto">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}