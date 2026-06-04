// @ts-nocheck
import React from 'react';
import CodeTabs from '../../components/docs/CodeTabs';
import Callout from '../../components/docs/Callout';
import TableOfContents from '../../components/docs/TableOfContents';

const toc = [
  { id: 'install', label: 'Installation', level: 2 },
  { id: 'auth', label: 'Authentication', level: 2 },
  { id: 'tasks', label: 'Task Commands', level: 2 },
  { id: 'agents', label: 'Agent Commands', level: 2 },
  { id: 'workflows', label: 'Workflow Commands', level: 2 },
  { id: 'config', label: 'Configuration', level: 2 },
];

function CmdRef({ cmd, desc, flags }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 mb-2">
      <code className="text-sm text-[#00E5FF] font-mono">{cmd}</code>
      <p className="text-xs text-white/45 mt-1">{desc}</p>
      {flags && (
        <div className="mt-2 space-y-1">
          {flags.map(f => (
            <div key={f.flag} className="flex items-start gap-2 text-xs">
              <code className="text-white/50 font-mono whitespace-nowrap">{f.flag}</code>
              <span className="text-white/30">{f.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CliDocs() {
  return (
    <div className="flex">
      <div className="flex-1 max-w-3xl px-8 py-10">
        <div className="mb-2">
          <span className="text-xs text-[#00E5FF] font-medium">SDKs & Tools</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">CLI Reference</h1>
        <p className="text-white/40 text-sm mb-8">Complete command reference for the TentaOS CLI.</p>

        <h2 id="install" className="text-xl font-semibold text-white mt-8 mb-4 scroll-mt-20">Installation</h2>
        <CodeTabs tabs={[
          { label: 'curl', code: 'curl -fsSL https://cli.tentaos.ai/install.sh | sh' },
          { label: 'npm', code: 'npm install -g @tentaos/cli' },
          { label: 'Homebrew', code: 'brew install tentaos/tap/tentaos' },
        ]} />

        <h2 id="auth" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Authentication</h2>
        <CmdRef cmd="tentaos auth login" desc="Authenticate via browser OAuth flow" />
        <CmdRef cmd="tentaos auth login --api-key <key>" desc="Authenticate with an API key (for CI/CD)" />
        <CmdRef cmd="tentaos auth status" desc="Show current authentication status" />
        <CmdRef cmd="tentaos auth logout" desc="Clear stored credentials" />

        <h2 id="tasks" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Task Commands</h2>
        <CmdRef
          cmd="tentaos task create"
          desc="Create and launch a new task"
          flags={[
            { flag: '--goal <text>', desc: 'Task goal description (required)' },
            { flag: '--agents <list>', desc: 'Comma-separated agent roles' },
            { flag: '--model <id>', desc: 'Model to use (e.g. gpt-4o)' },
            { flag: '--priority <level>', desc: 'low | medium | high' },
            { flag: '--cost-limit <amount>', desc: 'Max cost in USD' },
            { flag: '--approve', desc: 'Require approval for all actions' },
            { flag: '--workflow <id>', desc: 'Use a specific workflow' },
          ]}
        />
        <CmdRef cmd="tentaos task list" desc="List recent tasks" flags={[
          { flag: '--status <status>', desc: 'Filter by status' },
          { flag: '--limit <n>', desc: 'Number of results' },
        ]} />
        <CmdRef cmd="tentaos task watch <id>" desc="Watch task progress in real-time (live output)" />
        <CmdRef cmd="tentaos task cancel <id>" desc="Cancel a running task" />
        <CmdRef cmd="tentaos task artifacts <id>" desc="List task artifacts" />
        <CmdRef cmd="tentaos task download <id>" desc="Download all task artifacts" flags={[
          { flag: '--output <dir>', desc: 'Output directory (default: ./output)' },
        ]} />

        <h2 id="agents" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Agent Commands</h2>
        <CmdRef cmd="tentaos agent list" desc="List all configured agents" />
        <CmdRef cmd="tentaos agent create" desc="Create a custom agent" flags={[
          { flag: '--name <name>', desc: 'Agent display name' },
          { flag: '--role <role>', desc: 'planner | researcher | coder | writer | operator | reviewer' },
          { flag: '--model <id>', desc: 'Model ID' },
          { flag: '--tools <list>', desc: 'Comma-separated tool names' },
          { flag: '--permission <level>', desc: 'observe | suggest | execute | autonomous' },
        ]} />
        <CmdRef cmd="tentaos agent toggle <id>" desc="Enable or disable an agent" />

        <h2 id="workflows" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Workflow Commands</h2>
        <CmdRef cmd="tentaos workflow list" desc="List all workflows" />
        <CmdRef cmd="tentaos workflow generate" desc="AI-generate a workflow from description" flags={[
          { flag: '--desc <text>', desc: 'Workflow description' },
          { flag: '--pack <name>', desc: 'growth | builder | custom' },
        ]} />
        <CmdRef cmd="tentaos workflow run <id>" desc="Execute a workflow as a task" />
        <CmdRef cmd="tentaos workflow export <id>" desc="Export workflow as JSON" />

        <h2 id="config" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Configuration</h2>
        <CmdRef cmd="tentaos config set <key> <value>" desc="Set a configuration value" />
        <CmdRef cmd="tentaos config get <key>" desc="Get a configuration value" />
        <CmdRef cmd="tentaos config list" desc="Show all configuration" />
        <Callout variant="info">
          Configuration is stored in <code className="text-xs bg-white/[0.06] px-1 py-0.5 rounded">~/.tentaos/config.json</code>. Common settings include <code className="text-xs bg-white/[0.06] px-1 py-0.5 rounded">default_model</code>, <code className="text-xs bg-white/[0.06] px-1 py-0.5 rounded">default_agents</code>, and <code className="text-xs bg-white/[0.06] px-1 py-0.5 rounded">output_dir</code>.
        </Callout>
      </div>
      <TableOfContents items={toc} />
    </div>
  );
}