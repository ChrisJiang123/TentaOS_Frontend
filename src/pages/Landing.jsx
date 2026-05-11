// @ts-nocheck
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Shield, Workflow, Bot, Terminal, 
  ArrowRight, CheckCircle2, Star,
  Cpu, Monitor, Rocket, LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import TentaLogo from '../components/brand/TentaLogo';
import useSEO from '../lib/useSEO';
import HowItWorks from '../components/landing/HowItWorks';
import LandingFooter from '../components/landing/LandingFooter';
import MobileMenu from '../components/landing/MobileMenu';
import TrustLogos from '../components/landing/TrustLogos';
import LiveMetrics from '../components/landing/LiveMetrics';
import EmailCapture from '../components/landing/EmailCapture';

const features = [
  { icon: Eye, title: 'Visual Supervision', desc: 'See every step your AI agents take in real-time with beautiful workflow visualizations', color: '#3B82F6' },
  { icon: Shield, title: 'Approval Gates', desc: 'Critical actions require your approval before execution. Stay in control always', color: '#F59E0B' },
  { icon: Workflow, title: 'Pipeline Studio', desc: 'Build or auto-generate workflows with drag-and-drop. Like n8n for AI agents', color: '#8B5CF6' },
  { icon: Bot, title: 'Multi-Agent', desc: '6 specialized agents work together — Planner, Researcher, Coder, Writer, Operator, Reviewer', color: '#10B981' },
  { icon: Cpu, title: 'Model Freedom', desc: 'Use any model — local (Ollama), cloud (OpenAI, Anthropic), or TentaOS packs', color: '#EC4899' },
  { icon: Terminal, title: 'Dual Mode', desc: 'GUI for beginners, CLI for power users. Same engine, different interfaces', color: '#06B6D4' },
];

const comparison = [
  { feature: 'Visual Workflow Monitoring', tentaos: true, openclaw: false, perplexity: false },
  { feature: 'Approval Gates', tentaos: true, openclaw: false, perplexity: false },
  { feature: 'Drag & Drop Pipeline Editor', tentaos: true, openclaw: false, perplexity: false },
  { feature: 'App + Terminal Modes', tentaos: true, openclaw: false, perplexity: false },
  { feature: 'Local Model Support', tentaos: true, openclaw: true, perplexity: false },
  { feature: 'Per-task Sandbox Isolation', tentaos: true, openclaw: true, perplexity: false },
  { feature: 'Full Execution Replay', tentaos: true, openclaw: false, perplexity: false },
  { feature: 'Cost Tracking', tentaos: true, openclaw: false, perplexity: false },
];

const plans = [
  { name: 'Free', price: '$0', period: '/mo', features: ['3 tasks/day', '1 workspace', 'Community models', 'Basic workflows'], cta: 'Get Started', popular: false, paddlePlan: null },
  { name: 'Starter', price: '$19', period: '/mo', features: ['Unlimited workflows', 'BYOK support', 'Replay & Logs', 'Priority support'], cta: 'Start Starter', popular: false, paddlePlan: 'starter' },
  { name: 'Pro', price: '$49', period: '/mo', features: ['Everything in Starter', '10K credits/mo', 'Usage analytics', 'All integrations'], cta: 'Start Pro', popular: true, paddlePlan: 'pro' },
  { name: 'Team', price: '$149', period: '/mo', features: ['Everything in Pro', '5 seats', 'Shared workspace', '100K credits/mo'], cta: 'Start Team', popular: false, paddlePlan: 'team' },
];

function FadeIn({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  useSEO({
    title: 'TentaOS — Visual AI Operating System | Launch AI Tasks Your Way',
    description: 'Visual AI Operating System that lets you launch AI tasks, monitor agents, and approve actions with complete control and transparency.',
    keywords: 'AI operating system, visual AI agents, multi-agent workflow, AI task automation, approval gates, pipeline builder, BYOK AI, AI cost tracking, TentaOS',
  });

  useEffect(() => {
    // base44 认证已移除：Landing 永远可访问
  }, []);

  useEffect(() => {
    if (!document.getElementById('paddle-js')) {
      const script = document.createElement('script');
      script.id = 'paddle-js';
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      document.head.appendChild(script);
    }
  }, []);

  const handlePlanSelect = async (plan) => {
    if (!plan.paddlePlan) {
      navigate('/Dashboard');
      return;
    }
    try {
      // base44 计费已移除：保留 UI，但不触发请求
      navigate('/Pricing');
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  const handleLaunchWebApp = () => {
    navigate('/Dashboard');
  };

  return (
    <div className="min-h-screen bg-[#06060B] text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#06060B]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <TentaLogo size="md" />
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#howitworks" className="hover:text-white transition-colors">How It Works</a>
            <a href="#compare" className="hover:text-white transition-colors">Compare</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link to="/Docs" className="hover:text-white transition-colors">Docs</Link>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/Dashboard')}
              className="hidden sm:inline-flex text-white/70 hover:text-[#00E5FF] hover:bg-white/[0.06] h-9 px-4 text-xs font-medium"
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              Login
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/Dashboard')}
              className="hidden sm:inline-flex bg-[#00E5FF] text-[#06060B] hover:bg-[#00E5FF]/80 h-9 px-5 text-xs font-semibold shadow-[0_0_12px_rgba(0,229,255,0.3)] hover:shadow-[0_0_20px_rgba(0,229,255,0.5)] transition-all"
            >
              Sign up
            </Button>
            <MobileMenu
              isLoggedIn={false}
              onLogin={() => navigate('/Dashboard')}
              onDashboard={() => navigate('/Dashboard')}
            />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs text-white/60 mb-8">
              <Star className="w-3 h-3 text-amber-400" />
              Visual AI Operating System — Now in Beta
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              Launch AI tasks
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                your way.
              </span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-lg text-white/50 mt-6 max-w-2xl mx-auto leading-relaxed">
              Use the App if you want simplicity. Use the Terminal if you want full control. 
              Every step visible. Every action approved. Every result auditable.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Button
                size="lg"
                onClick={handleLaunchWebApp}
                className="bg-[#00E5FF] text-[#06060B] hover:bg-[#00E5FF]/90 h-13 px-8 text-base font-semibold rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] hover:-translate-y-1 transition-all duration-300"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Launch Web App
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/Downloads')}
                className="border-2 border-[#00E5FF]/30 bg-transparent hover:bg-[#00E5FF]/[0.05] h-13 px-8 text-base font-semibold rounded-xl hover:-translate-y-1 transition-all duration-300 text-[#00E5FF]"
              >
                <Monitor className="w-5 h-5 mr-2" />
                Download Dashboard
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/Dashboard')}
                className="border-2 border-white/20 bg-transparent hover:bg-white/[0.05] h-13 px-8 text-base font-semibold rounded-xl hover:-translate-y-1 transition-all duration-300 text-white"
              >
                <Eye className="w-5 h-5 mr-2" />
                Demo
              </Button>
            </div>
            <EmailCapture />
            <p className="text-sm text-white/30 mt-4">
              No account required to try the web app. Desktop available for Windows, macOS & Linux.
            </p>
          </FadeIn>

          {/* Hero Visual */}
          <FadeIn delay={0.4}>
            <div className="mt-16 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-[#06060B] via-transparent to-transparent z-10 pointer-events-none" />
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  {['Planner', 'Researcher', 'Writer', 'Reviewer'].map((agent, i) => (
                    <React.Fragment key={agent}>
                      <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2">
                        <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                          {agent[0]}
                        </div>
                        <span className="text-xs text-white/60">{agent}</span>
                        <CheckCircle2 className={cn("w-3 h-3", i < 3 ? "text-emerald-400" : "text-white/20")} />
                      </div>
                      {i < 3 && <ArrowRight className="w-4 h-4 text-white/15" />}
                    </React.Fragment>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 text-left">
                  {[
                    { label: 'Tasks Running', value: '3', color: 'text-blue-400' },
                    { label: 'Cost This Session', value: '$0.47', color: 'text-emerald-400' },
                    { label: 'Agents Active', value: '6', color: 'text-purple-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/[0.03] rounded-lg p-3">
                      <p className="text-xs text-white/40">{s.label}</p>
                      <p className={cn("text-xl font-semibold mt-1", s.color)}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Trust Badges */}
          <FadeIn delay={0.5}>
            <TrustLogos />
          </FadeIn>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                See everything. Control everything.
              </h2>
              <p className="text-white/40 mt-3 max-w-xl mx-auto">
                TentaOS gives you full visibility and control over your AI agents
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 0.05}>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: feature.color + '15' }}>
                    <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-base font-medium text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{feature.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Live Metrics */}
      <LiveMetrics />

      {/* How It Works */}
      <div id="howitworks">
        <HowItWorks />
      </div>



      {/* Comparison */}
      <section id="compare" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">TentaOS vs Others</h2>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 gap-0 border-b border-white/[0.06] p-4 text-xs font-medium">
                <span className="text-white/40">Feature</span>
                <span className="text-center text-blue-400">TentaOS</span>
                <span className="text-center text-white/40">OpenClaw</span>
                <span className="text-center text-white/40">Others</span>
              </div>
              {comparison.map((row, i) => (
                <div key={i} className="grid grid-cols-4 gap-0 border-b border-white/[0.03] p-4 text-xs hover:bg-white/[0.02]">
                  <span className="text-white/60">{row.feature}</span>
                  <span className="text-center">{row.tentaos ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : '—'}</span>
                  <span className="text-center">{row.openclaw ? <CheckCircle2 className="w-4 h-4 text-white/30 mx-auto" /> : <span className="text-white/20">—</span>}</span>
                  <span className="text-center">{row.perplexity ? <CheckCircle2 className="w-4 h-4 text-white/30 mx-auto" /> : <span className="text-white/20">—</span>}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Simple, transparent pricing</h2>
              <p className="text-white/40 mt-3">Start free, scale as you grow</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.1}>
                <div className={cn(
                  "rounded-xl p-6 border transition-all",
                  plan.popular 
                    ? "bg-blue-500/[0.08] border-blue-500/30 ring-1 ring-blue-500/20" 
                    : "bg-white/[0.02] border-white/[0.06]"
                )}>
                  {plan.popular && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 mb-3 inline-block">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-white/40">{plan.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn(
                      "w-full mt-6 h-10 text-sm",
                      plan.popular 
                        ? "bg-blue-600 hover:bg-blue-500 text-white" 
                        : "bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.1]"
                    )}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Ready to see your AI work?
            </h2>
            <p className="text-white/40 mb-8">
              TentaOS — See everything. Control everything. Trust your AI.
            </p>
            <Button
              size="lg"
              onClick={handleLaunchWebApp}
              className="bg-[#00E5FF] text-[#06060B] hover:bg-[#00E5FF]/90 h-12 px-8 text-sm font-semibold rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] hover:-translate-y-1 transition-all duration-300"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Launch TentaOS <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}