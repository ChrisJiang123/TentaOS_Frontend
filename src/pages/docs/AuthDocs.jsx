import React from 'react';
import CodeTabs from '../../components/docs/CodeTabs';
import Callout from '../../components/docs/Callout';
import TableOfContents from '../../components/docs/TableOfContents';

const toc = [
  { id: 'api-keys', label: 'API Keys', level: 2 },
  { id: 'oauth', label: 'OAuth / Browser Login', level: 2 },
  { id: 'model-keys', label: 'Model Provider Keys (BYOK)', level: 2 },
  { id: 'security', label: 'Security Best Practices', level: 2 },
];

export default function AuthDocs() {
  return (
    <div className="flex">
      <div className="flex-1 max-w-3xl px-8 py-10">
        <div className="mb-2">
          <span className="text-xs text-[#00E5FF] font-medium">Get Started</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Authentication</h1>
        <p className="text-white/40 text-sm mb-8">Learn how to authenticate with TentaOS via API keys, OAuth, and model provider keys.</p>

        <h2 id="api-keys" className="text-xl font-semibold text-white mt-8 mb-4 scroll-mt-20">API Keys</h2>
        <p className="text-sm text-white/50 mb-4">
          API keys are the primary method for authenticating with the TentaOS API and SDKs. Each key is scoped to your account and can be rotated at any time.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-white/50 mb-4">
          <li>Go to <strong className="text-white/70">Dashboard → Settings → API Keys</strong></li>
          <li>Click <strong className="text-white/70">Create New Key</strong></li>
          <li>Give it a name (e.g. "My Laptop", "CI/CD")</li>
          <li>Copy the key immediately — it won't be shown again</li>
        </ol>
        <CodeTabs tabs={[
          { label: 'Python', code: `from tentaos import TentaClient\n\nclient = TentaClient(api_key="tnt_sk_...")` },
          { label: 'Node.js', code: `import TentaOS from '@tentaos/sdk';\n\nconst client = new TentaOS({ apiKey: 'tnt_sk_...' });` },
          { label: 'cURL', code: `curl -H "Authorization: Bearer tnt_sk_..." \\\n  https://api.tentaos.ai/v1/tasks` },
          { label: 'CLI', code: `tentaos auth login --api-key tnt_sk_...` },
        ]} />
        <Callout variant="warning">
          Never commit API keys to version control. Use environment variables or secret managers.
        </Callout>

        <h2 id="oauth" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">OAuth / Browser Login</h2>
        <p className="text-sm text-white/50 mb-4">
          The CLI and Desktop app support browser-based OAuth login. This is the easiest way to authenticate for interactive use.
        </p>
        <CodeTabs tabs={[
          { label: 'CLI', code: `# Opens your browser for login\ntentaos auth login\n\n# After login, credentials are stored in\n# ~/.tentaos/credentials.json` },
        ]} />

        <h2 id="model-keys" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Model Provider Keys (BYOK)</h2>
        <p className="text-sm text-white/50 mb-4">
          In BYOK mode, you provide your own API keys for model providers. These keys are encrypted and stored securely — TentaOS never logs or shares them.
        </p>
        <div className="space-y-2 mb-4">
          {[
            { provider: 'OpenAI', key: 'OPENAI_API_KEY', url: 'platform.openai.com' },
            { provider: 'Anthropic', key: 'ANTHROPIC_API_KEY', url: 'console.anthropic.com' },
            { provider: 'Google AI', key: 'GOOGLE_AI_KEY', url: 'aistudio.google.dev' },
            { provider: 'DeepSeek', key: 'DEEPSEEK_API_KEY', url: 'platform.deepseek.com' },
          ].map(p => (
            <div key={p.provider} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
              <div>
                <span className="text-sm text-white/70">{p.provider}</span>
                <code className="text-xs text-white/30 ml-2">{p.key}</code>
              </div>
              <span className="text-xs text-white/30">{p.url}</span>
            </div>
          ))}
        </div>
        <CodeTabs tabs={[
          { label: 'Dashboard', code: '# Settings → Model Keys → Add Key\n# Select provider, paste your key, save.' },
          { label: 'CLI', code: `tentaos config set openai_key sk-...\ntentaos config set anthropic_key sk-ant-...` },
        ]} />

        <h2 id="security" className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20">Security Best Practices</h2>
        <ul className="space-y-2 text-sm text-white/50">
          <li className="flex items-start gap-2"><span className="text-[#00E5FF]">•</span>Use separate API keys for development and production</li>
          <li className="flex items-start gap-2"><span className="text-[#00E5FF]">•</span>Rotate keys regularly (at least every 90 days)</li>
          <li className="flex items-start gap-2"><span className="text-[#00E5FF]">•</span>Store keys in environment variables, not in code</li>
          <li className="flex items-start gap-2"><span className="text-[#00E5FF]">•</span>Use the least-privilege principle for model provider keys</li>
          <li className="flex items-start gap-2"><span className="text-[#00E5FF]">•</span>Monitor API key usage in the Billing dashboard</li>
        </ul>
      </div>
      <TableOfContents items={toc} />
    </div>
  );
}