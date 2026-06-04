import React from 'react';
import CodeTabs from '../../components/docs/CodeTabs';
import Callout from '../../components/docs/Callout';
import TableOfContents from '../../components/docs/TableOfContents';

const toc = [
  { id: 'overview', label: 'Overview', level: 2 },
  { id: 'built-in', label: 'Built-in Agents', level: 2 },
  { id: 'permissions', label: 'Permission Levels', level: 2 },
  { id: 'tools', label: 'Agent Tools', level: 2 },
  { id: 'custom', label: 'Custom Agents', level: 2 },
];

const agents = [
  { name: 'Planner', role: 'planner', color: '#3B82F6', desc: 'Decomposes goals into step-by-step workflows. Decides which agents to assign to each step.' },
  { name: 'Researcher', role: 'researcher', color: '#8B5CF6', desc: 'Searches the web, reads documents, and gathers information needed by other agents.' },
  { name: 'Coder', role: 'coder', color: '#10B981', desc: 'Writes, debugs, and executes code. Supports multiple languages and sandboxed execution.' },
  { name: 'Writer', role: 'writer', color: '#F59E0B', desc: 'Produces text content — blog posts, emails, reports, summaries, documentation.' },
  { name: 'Operator', role: 'operator', color: '#EF4444', desc: 'Executes external actions — API calls, file operations, deployments, data processing.' },
  { name: 'Reviewer', role: 'reviewer', color: '#06B6D4', desc: 'Reviews outputs from other agents for quality, accuracy, and compliance.' },
];

const permissions = [
  { level: 'observe', desc: 'Can only observe task state. No actions allowed.', risk: 'None' },
  { level: 'suggest', desc: 'Can suggest actions that require user approval before execution.', risk: 'Low' },
  { level: 'execute', desc: 'Can execute actions but critical ones go through approval gates.', risk: 'Medium' },
  { level: 'autonomous', desc: 'Full autonomy. No approval needed for any action.', risk: 'High' },
];

export default function AgentsDocs() {
  return (
    <div className="flex">
      <div className="flex-1 max-w-3xl px-8 py-10">
        <div className="mb-2">
          <span className="text-xs text-[#00E5FF] font-medium">Core Concepts</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Agents</h1>
        <p className="text-white/40 text-sm mb-8">Agents are specialized AI workers that collaborate on tasks. Each agent has a role, model, tools, and permission level.</p>

        <h2 id="overview" className="text-xl font-semibold text-white mt-8 mb-4 scroll-mt-20">Overview</h2>
        <p className="text-sm text-white/50 mb-4">
          TentaOS uses a multi-agent architecture where each agent specializes in a specific role. The Planner agent orchestrates the workflow, delegating steps to the most appropriate agent. Agents can use tools, call APIs, and produce artifacts.
        </p>

        <h2 id="built-in" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Built-in Agents</h2>
        <div className="space-y-3 mb-6">
          {agents.map(a => (
            <div key={a.role} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: a.color + '20', color: a.color }}>
                {a.name[0]}
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">{a.name} <code className="text-xs text-white/30 ml-1">{a.role}</code></h3>
                <p className="text-xs text-white/45 mt-1">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 id="permissions" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Permission Levels</h2>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden mb-6">
          <div className="grid grid-cols-3 gap-0 border-b border-white/[0.06] p-3 text-xs font-medium text-white/40">
            <span>Level</span><span>Behavior</span><span>Risk</span>
          </div>
          {permissions.map(p => (
            <div key={p.level} className="grid grid-cols-3 gap-0 border-b border-white/[0.04] p-3 text-xs last:border-0">
              <code className="text-[#00E5FF] font-mono">{p.level}</code>
              <span className="text-white/50">{p.desc}</span>
              <span className="text-white/40">{p.risk}</span>
            </div>
          ))}
        </div>
        <Callout variant="warning">
          Use <strong className="text-white/80">autonomous</strong> mode with caution. Agents in autonomous mode can execute any action without your approval, including sending emails, making API calls, and writing files.
        </Callout>

        <h2 id="tools" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Agent Tools</h2>
        <p className="text-sm text-white/50 mb-4">Each agent can be equipped with tools that extend their capabilities:</p>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {[
            { name: 'web_search', label: '🔍 Web Search', desc: 'Google, Bing, DuckDuckGo' },
            { name: 'browser', label: '🌐 Browser', desc: 'Navigate & scrape web pages' },
            { name: 'code_executor', label: '⚡ Code Executor', desc: 'Sandboxed code execution' },
            { name: 'file_manager', label: '📁 File Manager', desc: 'Read, write, organize files' },
            { name: 'doc_generator', label: '📄 Doc Generator', desc: 'Create PDFs, docs, slides' },
            { name: 'http_client', label: '🔗 HTTP Client', desc: 'Make API requests' },
          ].map(t => (
            <div key={t.name} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
              <p className="text-xs font-medium text-white/70">{t.label}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{t.desc}</p>
            </div>
          ))}
        </div>

        <h2 id="custom" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Custom Agents</h2>
        <p className="text-sm text-white/50 mb-4">Create specialized agents with custom system prompts and tool configurations:</p>
        <CodeTabs tabs={[
          { label: 'Dashboard', code: '# Navigate to Agents page\n# Click "Create Agent"\n# Configure:\n#   - Name: "SEO Writer"\n#   - Role: writer\n#   - Model: gpt-4o\n#   - System Prompt: "You are an SEO expert..."\n#   - Tools: web_search, doc_generator\n#   - Permission: execute' },
          { label: 'Python', code: `agent = client.agents.create(\n    name="SEO Writer",\n    role="writer",\n    model="gpt-4o",\n    system_prompt="You are an expert SEO content writer...",\n    tools=["web_search", "doc_generator"],\n    permission_level="execute",\n    cost_limit=10.0\n)` },
          { label: 'CLI', code: `tentaos agent create \\\n  --name "SEO Writer" \\\n  --role writer \\\n  --model gpt-4o \\\n  --prompt "You are an expert SEO content writer..." \\\n  --tools web_search,doc_generator \\\n  --permission execute` },
        ]} />
      </div>
      <TableOfContents items={toc} />
    </div>
  );
}