// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import StepCard from '../../components/docs/StepCard';
import CodeTabs from '../../components/docs/CodeTabs';
import Callout from '../../components/docs/Callout';
import TableOfContents from '../../components/docs/TableOfContents';
import { Download, Monitor, Terminal, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const toc = [
  { id: 'desktop-app', label: 'Desktop App', level: 2 },
  { id: 'cli', label: 'CLI', level: 2 },
  { id: 'python-sdk', label: 'Python SDK', level: 2 },
  { id: 'node-sdk', label: 'Node.js SDK', level: 2 },
  { id: 'web-app', label: 'Web App', level: 2 },
  { id: 'verify', label: 'Verify Installation', level: 2 },
];

export default function Installation() {
  return (
    <div className="flex">
      <div className="flex-1 max-w-3xl px-8 py-10">
        <div className="mb-2">
          <span className="text-xs text-[#00E5FF] font-medium">Get Started</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Installation</h1>
        <p className="text-white/40 text-sm mb-8">Install TentaOS on your platform of choice — Desktop, CLI, SDK, or Web.</p>

        {/* Desktop App */}
        <h2 id="desktop-app" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-[#00E5FF]" /> Desktop App
        </h2>
        <p className="text-sm text-white/50 mb-4">
          The TentaOS Desktop app gives you the full Dashboard, Pipeline Studio, and integrated terminal in a native application. 
          It supports local models via Ollama and offline task queuing.
        </p>
        <div className="flex gap-3 mb-4">
          <Link to="/Downloads">
            <Button size="sm" className="bg-[#00E5FF] text-[#06060B] hover:bg-[#00E5FF]/80 h-9 px-4 text-xs font-semibold">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download Desktop App
            </Button>
          </Link>
        </div>
        <Callout variant="info">
          Supported platforms: <strong className="text-white/80">macOS 12+</strong> (Apple Silicon & Intel), <strong className="text-white/80">Windows 10/11</strong> (64-bit), <strong className="text-white/80">Linux</strong> (Ubuntu 20.04+, Fedora 36+, Arch).
        </Callout>

        {/* CLI */}
        <h2 id="cli" className="text-xl font-semibold text-white mt-12 mb-4 scroll-mt-20 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-[#00E5FF]" /> CLI
        </h2>
        <p className="text-sm text-white/50 mb-4">
          The TentaOS CLI provides full control from your terminal — create tasks, manage agents, build workflows, and monitor runs.
        </p>
        <CodeTabs tabs={[
          { label: 'curl', code: '# macOS / Linux\ncurl -fsSL https://cli.tentaos.ai/install.sh | sh\n\n# Verify\ntentaos --version' },
          { label: 'npm', code: 'npm install -g @tentaos/cli\n\ntentaos --version' },
          { label: 'pip', code: 'pip install tentaos-cli\n\ntentaos --version' },
          { label: 'Homebrew', code: 'brew install tentaos/tap/tentaos\n\ntentaos --version' },
        ]} />
        <div className="mt-4">
          <StepCard number={1} title="Authenticate">
            <CodeTabs tabs={[
              { label: 'Interactive', code: '# Opens browser for OAuth login\ntentaos auth login' },
              { label: 'API Key', code: '# Use an API key (CI/CD, scripts)\ntentaos auth login --api-key YOUR_API_KEY' },
            ]} />
          </StepCard>
        </div>

        {/* Python SDK */}
        <h2 id="python-sdk" className="text-xl font-semibold text-white mt-12 mb-4 scroll-mt-20">Python SDK</h2>
        <CodeTabs tabs={[
          { label: 'pip', code: 'pip install tentaos' },
          { label: 'poetry', code: 'poetry add tentaos' },
        ]} />
        <div className="mt-4 bg-black/30 border border-white/[0.06] rounded-lg p-4">
          <pre className="text-xs text-white/60 font-mono whitespace-pre">{`from tentaos import TentaClient

client = TentaClient(api_key="YOUR_API_KEY")

# Quick test
task = client.tasks.create(
    goal="Say hello",
    agents=["writer"]
)
print(task.status)  # "queued"`}</pre>
        </div>

        {/* Node SDK */}
        <h2 id="node-sdk" className="text-xl font-semibold text-white mt-12 mb-4 scroll-mt-20">Node.js SDK</h2>
        <CodeTabs tabs={[
          { label: 'npm', code: 'npm install @tentaos/sdk' },
          { label: 'yarn', code: 'yarn add @tentaos/sdk' },
          { label: 'pnpm', code: 'pnpm add @tentaos/sdk' },
        ]} />
        <div className="mt-4 bg-black/30 border border-white/[0.06] rounded-lg p-4">
          <pre className="text-xs text-white/60 font-mono whitespace-pre">{`import TentaOS from '@tentaos/sdk';

const client = new TentaOS({ apiKey: 'YOUR_API_KEY' });

const task = await client.tasks.create({
  goal: 'Say hello',
  agents: ['writer'],
});
console.log(task.status); // "queued"`}</pre>
        </div>

        {/* Web App */}
        <h2 id="web-app" className="text-xl font-semibold text-white mt-12 mb-4 scroll-mt-20 flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#00E5FF]" /> Web App
        </h2>
        <p className="text-sm text-white/50 mb-4">
          No installation needed — the TentaOS web app runs directly in your browser at{' '}
          <a href="https://tentaos.com" className="text-[#00E5FF] hover:underline">tentaos.com</a>.
          Sign up, configure your models, and start launching tasks immediately.
        </p>

        {/* Verify */}
        <h2 id="verify" className="text-xl font-semibold text-white mt-12 mb-4 scroll-mt-20">Verify Installation</h2>
        <CodeTabs tabs={[
          { label: 'CLI', code: 'tentaos --version\n# TentaOS CLI v1.0.0\n\ntentaos auth status\n# Authenticated as: you@example.com' },
          { label: 'Python', code: 'python -c "import tentaos; print(tentaos.__version__)"\n# 1.0.0' },
          { label: 'Node.js', code: 'node -e "console.log(require(\'@tentaos/sdk\').version)"\n// 1.0.0' },
        ]} />
        <Callout variant="success">
          You're all set! Head to the <Link to="/Docs" className="text-[#00E5FF] hover:underline">Quick Start</Link> guide to launch your first task.
        </Callout>
      </div>
      <TableOfContents items={toc} />
    </div>
  );
}