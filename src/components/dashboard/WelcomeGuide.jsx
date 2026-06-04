import React from 'react';
import { Rocket, Activity, Plug, Workflow, Cpu, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: Sparkles,
    color: '#3B82F6',
    title: '欢迎来到 TentaOS',
    desc: '你可以先用演示额度探索功能，再连接本地 Engine 开始真实任务。',
  },
  {
    icon: Activity,
    color: '#10B981',
    title: '从健康检查开始',
    desc: '先查看部署/引擎健康状态，确认本地 Engine 已连接。',
    link: '/diagnostics',
  },
  {
    icon: Plug,
    color: '#06B6D4',
    title: '连接本地 Engine',
    desc: '未连接时会以演示/Mock 模式运行（不会伪造付费状态）。',
    link: '/Settings',
  },
  {
    icon: Cpu,
    color: '#06B6D4',
    title: '查看示例 Cortex Trace',
    desc: '示例数据会明确标注为 Sample，用于演示与上手。',
    link: '/Dashboard',
  },
  {
    icon: Workflow,
    color: '#8B5CF6',
    title: '探索 Tentacle Runtime',
    desc: '体验 Pipeline Studio 与工作流编排。',
    link: '/PipelineStudio',
  },
  {
    icon: Rocket,
    color: '#3B82F6',
    title: '升级或购买积分',
    desc: '订阅与积分购买会跳转到 Creem 结账（支持取消/失败提示）。',
    link: '/pricing',
  },
];

export default function WelcomeGuide() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-500/[0.06] to-purple-500/[0.04] border border-white/[0.08] rounded-2xl p-8"
    >
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
          <Rocket className="w-7 h-7 text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Welcome to TentaOS</h2>
        <p className="text-sm text-white/40 max-w-md mx-auto">
          Your AI operating system is ready. Here's how to get started:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
          >
            {step.link ? (
              <Link to={step.link} className="block">
                <StepCard step={step} />
              </Link>
            ) : (
              <StepCard step={step} />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function StepCard({ step }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all group cursor-pointer">
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: step.color + '15' }}
        >
          <step.icon className="w-4 h-4" style={{ color: step.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white mb-0.5 flex items-center gap-1.5">
            {step.title}
            {step.link && <ArrowRight className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors" />}
          </h3>
          <p className="text-xs text-white/40">{step.desc}</p>
        </div>
      </div>
    </div>
  );
}