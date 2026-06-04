import React from 'react';
import CodeTabs from '../../components/docs/CodeTabs';
import Callout from '../../components/docs/Callout';
import TableOfContents from '../../components/docs/TableOfContents';

const toc = [
  { id: 'overview', label: 'Overview', level: 2 },
  { id: 'action-types', label: 'Action Types', level: 2 },
  { id: 'risk-levels', label: 'Risk Levels', level: 2 },
  { id: 'managing', label: 'Managing Approvals', level: 2 },
  { id: 'auto-rules', label: 'Auto-Approval Rules', level: 2 },
];

export default function ApprovalsDocs() {
  return (
    <div className="flex">
      <div className="flex-1 max-w-3xl px-8 py-10">
        <div className="mb-2">
          <span className="text-xs text-[#00E5FF] font-medium">Core Concepts</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Approval Gates</h1>
        <p className="text-white/40 text-sm mb-8">Approval gates ensure humans stay in control of critical AI actions.</p>

        <h2 id="overview" className="text-xl font-semibold text-white mt-8 mb-4 scroll-mt-20">Overview</h2>
        <p className="text-sm text-white/50 mb-4">
          When an agent attempts a critical action — sending an email, making an API call, spending money, or publishing content — TentaOS can pause execution and request human approval. This "human-in-the-loop" approach ensures AI never takes irreversible actions without your consent.
        </p>
        <Callout variant="info">
          Approval gates are automatic for agents with <strong className="text-white/80">execute</strong> permission level. Agents with <strong className="text-white/80">autonomous</strong> permission skip approvals entirely.
        </Callout>

        <h2 id="action-types" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Action Types</h2>
        <div className="space-y-2 mb-6">
          {[
            { type: 'send_email', emoji: '📧', label: 'Send Email', desc: 'Outgoing email to external recipients' },
            { type: 'publish', emoji: '🚀', label: 'Publish', desc: 'Publishing content to an external platform' },
            { type: 'spend', emoji: '💰', label: 'Spend', desc: 'Financial transactions or purchases' },
            { type: 'delete', emoji: '🗑', label: 'Delete', desc: 'Deleting files, records, or resources' },
            { type: 'external_write', emoji: '✏️', label: 'External Write', desc: 'Writing to external APIs or databases' },
            { type: 'execute_code', emoji: '⚡', label: 'Execute Code', desc: 'Running generated code in the sandbox' },
          ].map(a => (
            <div key={a.type} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
              <span className="text-lg">{a.emoji}</span>
              <div>
                <span className="text-xs font-medium text-white">{a.label}</span>
                <code className="text-[10px] text-white/30 ml-2">{a.type}</code>
                <p className="text-[11px] text-white/40">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 id="risk-levels" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Risk Levels</h2>
        <p className="text-sm text-white/50 mb-4">Each approval is assigned a risk level based on the action type and context:</p>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { level: 'low', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', desc: 'Read-only or reversible' },
            { level: 'medium', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', desc: 'Writes with undo' },
            { level: 'high', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', desc: 'External side effects' },
            { level: 'critical', color: 'bg-red-500/10 text-red-400 border-red-500/20', desc: 'Irreversible actions' },
          ].map(r => (
            <div key={r.level} className={`rounded-lg p-3 border ${r.color}`}>
              <p className="text-xs font-medium capitalize">{r.level}</p>
              <p className="text-[10px] opacity-60 mt-0.5">{r.desc}</p>
            </div>
          ))}
        </div>

        <h2 id="managing" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Managing Approvals</h2>
        <CodeTabs tabs={[
          { label: 'Dashboard', code: '# Navigate to the Approval Center\n# Each pending approval shows:\n#   - Action summary\n#   - Agent name\n#   - Risk level badge\n#   - Preview of the action\n#\n# Actions: Approve / Reject / Request Revision' },
          { label: 'CLI', code: `# List pending approvals\ntentaos approvals list --status pending\n\n# Approve\ntentaos approvals approve <approval_id>\n\n# Reject\ntentaos approvals reject <approval_id> --reason "Too risky"\n\n# Request revision\ntentaos approvals revise <approval_id>` },
          { label: 'API', code: `curl -X PATCH "https://api.tentaos.ai/v1/approvals/<id>" \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -d '{"status": "approved"}'` },
        ]} />

        <h2 id="auto-rules" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Auto-Approval Rules</h2>
        <p className="text-sm text-white/50 mb-4">
          For trusted workflows, configure auto-approval rules to skip the approval step for low-risk actions:
        </p>
        <CodeTabs tabs={[
          { label: 'Example', code: `# Auto-approve low-risk actions from the writer agent\nclient.rules.create(\n    agent="writer",\n    action_types=["execute_code"],\n    max_risk_level="low",\n    auto_approve=True\n)` },
        ]} />
        <Callout variant="warning">
          Auto-approval rules bypass human review. Only use them for well-tested, low-risk workflows.
        </Callout>
      </div>
      <TableOfContents items={toc} />
    </div>
  );
}