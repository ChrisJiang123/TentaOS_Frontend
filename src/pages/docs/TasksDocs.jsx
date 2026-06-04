import React from 'react';
import CodeTabs from '../../components/docs/CodeTabs';
import Callout from '../../components/docs/Callout';
import TableOfContents from '../../components/docs/TableOfContents';

const toc = [
  { id: 'overview', label: 'Overview', level: 2 },
  { id: 'lifecycle', label: 'Task Lifecycle', level: 2 },
  { id: 'creating', label: 'Creating Tasks', level: 2 },
  { id: 'monitoring', label: 'Monitoring', level: 2 },
  { id: 'artifacts', label: 'Artifacts', level: 2 },
  { id: 'cost-control', label: 'Cost Control', level: 2 },
];

const statuses = [
  { status: 'queued', desc: 'Task received, waiting for an available agent slot', color: 'text-white/50' },
  { status: 'planning', desc: 'Planner agent is decomposing the goal into steps', color: 'text-blue-400' },
  { status: 'running', desc: 'Agents are actively executing the workflow', color: 'text-emerald-400' },
  { status: 'paused', desc: 'Manually paused or hit a rate limit', color: 'text-amber-400' },
  { status: 'awaiting_approval', desc: 'An action requires human approval before continuing', color: 'text-orange-400' },
  { status: 'completed', desc: 'All steps finished successfully', color: 'text-green-400' },
  { status: 'failed', desc: 'An unrecoverable error occurred', color: 'text-red-400' },
  { status: 'cancelled', desc: 'User cancelled the task', color: 'text-white/30' },
];

export default function TasksDocs() {
  return (
    <div className="flex">
      <div className="flex-1 max-w-3xl px-8 py-10">
        <div className="mb-2">
          <span className="text-xs text-[#00E5FF] font-medium">Core Concepts</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Tasks</h1>
        <p className="text-white/40 text-sm mb-8">Tasks are the primary unit of work in TentaOS. Each task has a goal, a set of assigned agents, and a lifecycle.</p>

        <h2 id="overview" className="text-xl font-semibold text-white mt-8 mb-4 scroll-mt-20">Overview</h2>
        <p className="text-sm text-white/50 mb-4">
          A Task represents a single unit of work submitted to TentaOS. When you create a task, the system:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-white/50 mb-6">
          <li>Receives your goal and optional configuration</li>
          <li>The <strong className="text-white/70">Planner</strong> agent decomposes the goal into a workflow of steps</li>
          <li>Each step is assigned to the most appropriate agent</li>
          <li>Agents execute steps in order, with approval gates where configured</li>
          <li>Artifacts (files, code, text) are collected and returned</li>
        </ol>

        <h2 id="lifecycle" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Task Lifecycle</h2>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden mb-6">
          {statuses.map((s, i) => (
            <div key={s.status} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
              <code className={`text-xs font-mono font-semibold w-36 ${s.color}`}>{s.status}</code>
              <span className="text-xs text-white/50">{s.desc}</span>
            </div>
          ))}
        </div>
        <Callout variant="info">
          Tasks in <strong className="text-white/80">awaiting_approval</strong> will pause until you approve or reject the pending action in the Approval Center.
        </Callout>

        <h2 id="creating" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Creating Tasks</h2>
        <CodeTabs tabs={[
          { label: 'Dashboard', code: '# In the Dashboard, type your goal in the input bar\n# and press Enter or click "Launch"\n\n# Example goal:\n"Research the top 5 JavaScript frameworks in 2026\nand write a comparison blog post"' },
          { label: 'Python', code: `from tentaos import TentaClient\n\nclient = TentaClient(api_key="YOUR_KEY")\n\ntask = client.tasks.create(\n    goal="Research top 5 JS frameworks and write a comparison",\n    agents=["researcher", "writer"],\n    model="gpt-4o",\n    priority="high",\n    approval_required=True  # require approval for write actions\n)\n\nprint(f"Task {task.id} created: {task.status}")` },
          { label: 'CLI', code: `tentaos task create \\\n  --goal "Research top 5 JS frameworks and write a comparison" \\\n  --agents researcher,writer \\\n  --model gpt-4o \\\n  --priority high \\\n  --approve\n\n# Watch progress\ntentaos task watch <task_id>` },
          { label: 'cURL', code: `curl -X POST "https://api.tentaos.ai/v1/tasks" \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "goal": "Research top 5 JS frameworks and write a comparison",\n    "agents": ["researcher", "writer"],\n    "model": "gpt-4o",\n    "priority": "high"\n  }'` },
        ]} />

        <h2 id="monitoring" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Monitoring Tasks</h2>
        <p className="text-sm text-white/50 mb-4">There are multiple ways to monitor task progress:</p>
        <ul className="space-y-2 text-sm text-white/50 mb-4">
          <li className="flex items-start gap-2">
            <span className="text-[#00E5FF] mt-0.5">•</span>
            <span><strong className="text-white/70">Dashboard</strong> — Real-time progress bars, cost tracking, and timeline view</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00E5FF] mt-0.5">•</span>
            <span><strong className="text-white/70">CLI</strong> — <code className="text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">tentaos task watch {"<task_id>"}</code> for live terminal output</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00E5FF] mt-0.5">•</span>
            <span><strong className="text-white/70">API Polling</strong> — <code className="text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">GET /v1/tasks/:id</code> returns current status and progress</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00E5FF] mt-0.5">•</span>
            <span><strong className="text-white/70">Webhooks</strong> — Configure webhooks to receive real-time status updates</span>
          </li>
        </ul>

        <h2 id="artifacts" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Artifacts</h2>
        <p className="text-sm text-white/50 mb-4">
          Artifacts are the outputs produced by agents during task execution. They can be files, code snippets, documents, images, or data.
        </p>
        <CodeTabs tabs={[
          { label: 'Python', code: `# Get task artifacts\nresult = client.tasks.wait(task.id)\n\nfor artifact in result.artifacts:\n    print(f"{artifact.title} ({artifact.type})")\n    print(f"  URL: {artifact.url}")` },
          { label: 'CLI', code: `# List artifacts\ntentaos task artifacts <task_id>\n\n# Download all artifacts\ntentaos task download <task_id> --output ./output/` },
        ]} />

        <h2 id="cost-control" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Cost Control</h2>
        <p className="text-sm text-white/50 mb-4">
          Every task tracks token usage and estimated cost in real-time. You can set cost limits per task:
        </p>
        <CodeTabs tabs={[
          { label: 'Python', code: `task = client.tasks.create(\n    goal="Generate a marketing plan",\n    cost_limit=5.00,  # Max $5.00 for this task\n    agents=["planner", "writer"]\n)` },
          { label: 'CLI', code: `tentaos task create \\\n  --goal "Generate a marketing plan" \\\n  --cost-limit 5.00 \\\n  --agents planner,writer` },
        ]} />
        <Callout variant="warning">
          When a task hits its cost limit, it pauses automatically and waits for your approval to continue or cancel.
        </Callout>
      </div>
      <TableOfContents items={toc} />
    </div>
  );
}