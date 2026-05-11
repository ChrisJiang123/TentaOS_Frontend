// @ts-nocheck
import React from 'react';
import StepCard from '../../components/docs/StepCard';
import CodeTabs from '../../components/docs/CodeTabs';
import InfoCard from '../../components/docs/InfoCard';
import Callout from '../../components/docs/Callout';
import TableOfContents from '../../components/docs/TableOfContents';
import { Key, Bot, Cpu, Workflow, Terminal, Globe } from 'lucide-react';
import useSEO from '../../lib/useSEO';

const toc = [
  { id: 'getting-started', label: 'Getting Started', level: 2 },
  { id: 'step-1', label: 'Get API Key', level: 3 },
  { id: 'step-2', label: 'Choose a Model', level: 3 },
  { id: 'step-3', label: 'Install SDK', level: 3 },
  { id: 'step-4', label: 'Make API Call', level: 3 },
  { id: 'get-more', label: 'Get More', level: 2 },
];

export default function QuickStart() {
  useSEO({
    title: 'TentaOS Quick Start Guide — Get Running in 5 Minutes',
    description: 'Learn how to set up TentaOS in under 5 minutes. Get your API key, choose a model, install the SDK, and launch your first multi-agent AI task.',
    keywords: 'TentaOS quick start, AI agent setup, TentaOS SDK, AI workflow tutorial, getting started AI agents, TentaOS documentation',
  });

  return (
    <div className="flex">
      <div className="flex-1 max-w-3xl px-8 py-10">
        <div className="mb-2">
          <span className="text-xs text-[#00E5FF] font-medium">Get Started</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Quick Start</h1>
        <p className="text-white/40 text-sm mb-8">Get up and running with TentaOS in under 5 minutes.</p>

        <Callout variant="info">
          TentaOS supports both <strong className="text-white/80">BYOK</strong> (Bring Your Own Key) and <strong className="text-white/80">Hosted</strong> modes. 
          BYOK lets you use your own API keys from OpenAI, Anthropic, Google, etc. Hosted mode uses TentaOS credits.
        </Callout>

        {/* Getting Started */}
        <h2 id="getting-started" className="text-xl font-semibold text-white mt-12 mb-6 scroll-mt-20">
          Getting Started
        </h2>

        <div id="step-1">
          <StepCard number={1} title="Get API Key">
            <ul className="list-disc list-inside space-y-2 text-white/50">
              <li>Sign up or log in to the <a href="#" className="text-[#00E5FF] hover:underline">TentaOS Dashboard</a></li>
              <li>Navigate to <strong className="text-white/70">Settings → API Keys</strong></li>
              <li>Create a new API key and copy it securely</li>
              <li>For BYOK: add your provider keys in <strong className="text-white/70">Settings → Model Keys</strong></li>
            </ul>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <InfoCard
                icon={Key}
                title="TentaOS Dashboard"
                description="Sign up and manage your API keys."
                href="/Dashboard"
                color="#00E5FF"
              />
              <InfoCard
                icon={Key}
                title="API Keys Management"
                description="Create and rotate your API keys."
                href="/Billing"
                color="#7C3AED"
              />
            </div>
          </StepCard>
        </div>

        <div id="step-2">
          <StepCard number={2} title="Choose a Model">
            <p>TentaOS supports multiple model providers. Select the right model for your task:</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <InfoCard icon={Cpu} title="GPT-4o" description="OpenAI's flagship multimodal model" color="#10B981" />
              <InfoCard icon={Cpu} title="Claude Sonnet" description="Anthropic's balanced performance model" color="#D97706" />
              <InfoCard icon={Cpu} title="Gemini Pro" description="Google's advanced reasoning model" color="#3B82F6" />
              <InfoCard icon={Cpu} title="DeepSeek V3" description="Open-source high-performance model" color="#8B5CF6" />
            </div>
          </StepCard>
        </div>

        <div id="step-3">
          <StepCard number={3} title="Install SDK">
            <p>Install the TentaOS SDK for your preferred language:</p>
            <CodeTabs
              tabs={[
                { label: 'Python', code: `# Install via pip\npip install tentaos\n\n# Verify installation\nimport tentaos\nprint(tentaos.__version__)` },
                { label: 'Node.js', code: `# Install via npm\nnpm install @tentaos/sdk\n\n# Or using yarn\nyarn add @tentaos/sdk` },
                { label: 'CLI', code: `# Install TentaOS CLI\ncurl -fsSL https://cli.tentaos.ai/install.sh | sh\n\n# Verify installation\ntentaos --version` },
              ]}
            />
          </StepCard>
        </div>

        <div id="step-4">
          <StepCard number={4} title="Make Your First API Call">
            <p>Create a task and let TentaOS agents handle it:</p>
            <CodeTabs
              tabs={[
                {
                  label: 'Python',
                  code: `from tentaos import TentaClient\n\nclient = TentaClient(api_key="YOUR_API_KEY")\n\n# Create and run a task\ntask = client.tasks.create(\n    goal="Research the latest AI trends and write a summary",\n    agents=["researcher", "writer"],\n    model="gpt-4o"\n)\n\n# Check task status\nprint(f"Task {task.id}: {task.status}")\n\n# Get results when complete\nresult = client.tasks.wait(task.id)\nprint(result.artifacts)`,
                },
                {
                  label: 'Node.js',
                  code: `import TentaOS from '@tentaos/sdk';\n\nconst client = new TentaOS({ apiKey: 'YOUR_API_KEY' });\n\n// Create and run a task\nconst task = await client.tasks.create({\n  goal: 'Research the latest AI trends and write a summary',\n  agents: ['researcher', 'writer'],\n  model: 'gpt-4o',\n});\n\n// Check task status\nconsole.log(\`Task \${task.id}: \${task.status}\`);\n\n// Get results when complete\nconst result = await client.tasks.wait(task.id);\nconsole.log(result.artifacts);`,
                },
                {
                  label: 'cURL',
                  code: `curl -X POST "https://api.tentaos.ai/v1/tasks" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -d '{\n    "goal": "Research the latest AI trends",\n    "agents": ["researcher", "writer"],\n    "model": "gpt-4o"\n  }'`,
                },
                {
                  label: 'CLI',
                  code: `# Authenticate\ntentaos auth login\n\n# Create a task\ntentaos task create \\\n  --goal "Research the latest AI trends" \\\n  --agents researcher,writer \\\n  --model gpt-4o\n\n# Watch task progress\ntentaos task watch <task_id>`,
                },
              ]}
            />
            <Callout variant="success">
              That's it! TentaOS will automatically plan, assign agents, and execute the workflow. 
              You can monitor progress in real-time via the Dashboard or CLI.
            </Callout>
          </StepCard>
        </div>

        {/* Get More */}
        <h2 id="get-more" className="text-xl font-semibold text-white mt-12 mb-6 scroll-mt-20">
          Get More
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
          <InfoCard icon={Workflow} title="Pipeline Studio" description="Build custom workflows with drag-and-drop" href="/Docs/Workflows" color="#8B5CF6" />
          <InfoCard icon={Bot} title="Custom Agents" description="Create and configure specialized AI agents" href="/Docs/Agents" color="#10B981" />
          <InfoCard icon={Terminal} title="CLI Reference" description="Full command reference for power users" href="/Docs/CliReference" color="#06B6D4" />
          <InfoCard icon={Globe} title="API Reference" description="Complete REST API documentation" href="/Docs/ApiOverview" color="#3B82F6" />
          <InfoCard icon={Key} title="Authentication" description="API key management and security" href="/Docs/Authentication" color="#F59E0B" />
          <InfoCard icon={Cpu} title="Models" description="Supported models and routing config" href="/Docs/ApiModels" color="#EC4899" />
        </div>
      </div>

      <TableOfContents items={toc} />
    </div>
  );
}