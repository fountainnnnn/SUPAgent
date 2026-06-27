import { useState, useRef, useCallback } from 'react';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';
import { useStore } from '../store';
import type { AgentSpec } from '@shared/types';

interface DeployCardProps {
  url: string;
  repoUrl?: string;
  agentRole?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:bg-black/5 hover:text-ink active:scale-[0.97]"
      aria-label="Copy"
    >
      {copied ? (
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-ok" aria-hidden>
          <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
          <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-xl bg-black/[0.04] px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
          {title}
        </p>
        <CopyButton text={code} />
      </div>
      <pre className="font-mono text-[11px] leading-relaxed text-ink-soft whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mt-5 mb-2 text-xs font-semibold text-ink">
      {children}
    </h4>
  );
}

function RunbookModal({ spec, onClose }: { spec: AgentSpec; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    if (!printRef.current) return;
    const html = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Agent Runbook</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,system-ui,sans-serif;color:#1a1a1a;padding:48px 56px;max-width:900px;margin:0 auto;line-height:1.6}
h1{font-size:24px;font-weight:700;margin-bottom:4px}
h2{font-size:15px;font-weight:700;margin-top:28px;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e5e5e5}
h3{font-size:13px;font-weight:600;margin-bottom:4px}
p,li{font-size:13px}
ul{padding-left:20px;margin-bottom:8px}
li{margin-bottom:4px}
table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:13px}
th,td{text-align:left;padding:8px 12px;border:1px solid #e5e5e5}
th{background:#f5f5f5;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.03em}
.subtitle{color:#666;font-size:14px;margin-bottom:24px}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
.badge-auto{background:#dcfce7;color:#166534}
.badge-approval{background:#fef9c3;color:#854d0e}
.badge-never{background:#fee2e2;color:#991b1b}
.source{color:#888;font-size:11px;font-style:italic;display:block;margin-top:2px}
.section-card{background:#fafafa;border:1px solid #eee;border-radius:8px;padding:14px 16px;margin-bottom:10px}
@media print{body{padding:24px 32px}h2{break-after:avoid}table{break-inside:avoid}}
</style></head><body>${html}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  }, []);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">Agent Runbook</h2>
          <div className="flex items-center gap-2">
            <Button variant="primary" className="text-xs" onClick={handleDownload}>
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
                <path d="M8 2v8m0 0l-3-3m3 3l3-3M3 12v1.5h10V12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download as PDF
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-soft transition hover:bg-black/5 hover:text-ink"
              aria-label="Close"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5" ref={printRef}>
          <h1>{spec.role}</h1>
          <p className="subtitle">Tone: {spec.tone}</p>

          {/* Policies */}
          <h2>Policies</h2>
          {spec.policies.map((p, i) => (
            <div key={i} className="section-card">
              <h3>{p.name}</h3>
              <p>{p.rule}</p>
              {p.source && <span className="source">Source: {p.source}</span>}
            </div>
          ))}

          {/* Escalation Matrix */}
          <h2>Escalation Matrix</h2>
          <table>
            <thead>
              <tr><th>Condition</th><th>Threshold</th><th>Action</th></tr>
            </thead>
            <tbody>
              {spec.escalation.map((e, i) => (
                <tr key={i}>
                  <td>{e.condition}</td>
                  <td>{e.threshold}</td>
                  <td>{e.action}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Authority */}
          <h2>Authority Levels</h2>
          <table>
            <thead>
              <tr><th>Action</th><th>Level</th></tr>
            </thead>
            <tbody>
              {spec.authority.map((a, i) => (
                <tr key={i}>
                  <td>{a.action}</td>
                  <td>
                    <span className={`badge ${a.level === 'auto' ? 'badge-auto' : a.level === 'approval' ? 'badge-approval' : 'badge-never'}`}>
                      {a.level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Capabilities */}
          <h2>Capabilities</h2>
          <ul>
            {spec.capabilities.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>

          {/* Unknowns */}
          {spec.unknowns.length > 0 && (
            <>
              <h2>Open Questions / Unknowns</h2>
              <ul>
                {spec.unknowns.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function DeployCard({ url, repoUrl, agentRole }: DeployCardProps) {
  const [showIntegration, setShowIntegration] = useState(false);
  const [showRunbook, setShowRunbook] = useState(false);
  const spec = useStore(s => s.spec);

  const curlExample = `curl -X POST ${url} \\
  -H "Authorization: Bearer <your-api-key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "I need help with my order #12345",
    "customer_id": "cust_abc123",
    "channel": "api"
  }'`;

  const responseExample = `{
  "reply": "I'd be happy to help with order #12345...",
  "actions_taken": ["lookup_order"],
  "escalated": false,
  "confidence": 0.94
}`;

  const nodeExample = `import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const response = await fetch("${url}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + process.env.AGENT_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    message: customerMessage,
    customer_id: customerId,
    channel: "api",
  }),
});

const { reply, actions_taken, escalated } = await response.json();`;

  const webhookExample = `// Webhook payload (POST to your callback URL)
{
  "event": "escalation",
  "agent_id": "${url.split('/').pop()}",
  "ticket": { "from": "...", "subject": "...", "body": "..." },
  "reason": "Refund exceeds agent authority",
  "timestamp": "2026-06-27T12:00:00Z"
}`;

  const envExample = `# .env
AGENT_ENDPOINT=${url}
AGENT_API_KEY=<your-api-key>
NODE_ENV=production`;

  return (
    <GlassCard strong className="p-5">
      {/* Live badge */}
      <div className="mb-4 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ok" />
        </span>
        <span className="text-sm font-semibold text-ok">Endpoint live</span>
        {agentRole && (
          <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] font-medium text-ink-soft">
            {agentRole}
          </span>
        )}
      </div>

      {/* URL row */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-black/5 bg-black/[0.03] px-3 py-2.5">
        <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden>
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2 8h12M8 2c-1.5 2-2 4-2 6s.5 4 2 6M8 2c1.5 2 2 4 2 6s-.5 4-2 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span className="flex-1 truncate font-mono text-xs text-ink">{url}</span>
        <CopyButton text={url} />
      </div>

      {/* Action buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        {repoUrl && (
          <Button variant="secondary" className="text-xs" onClick={() => window.open(repoUrl, '_blank')}>
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
              <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm0 2c.7 0 1.4.12 2 .34V8c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1V3.84A5.5 5.5 0 018 3.5zm4.2 2.8c.2.5.3 1.07.3 1.7 0 2.76-2.02 5.05-4.67 5.46L8 8h3.5c.26 0 .5-.06.7-.2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            Download repo
          </Button>
        )}
        <Button
          variant="secondary"
          className="text-xs"
          onClick={() => setShowRunbook(true)}
          disabled={!spec}
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
            <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Download PDF runbook
        </Button>
        <Button
          variant="secondary"
          className="text-xs"
          onClick={() => setShowIntegration(v => !v)}
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
            <path d="M5 3L2 8l3 5M11 3l3 5-3 5M9.5 2l-3 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {showIntegration ? 'Hide' : 'Show'} integration guide
        </Button>
      </div>

      {/* Quick-start env */}
      <CodeBlock title=".env" code={envExample} />

      {/* Expandable integration guide */}
      {showIntegration && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <SectionHeader>API endpoint</SectionHeader>
          <div className="rounded-xl border border-black/5 bg-black/[0.02] px-3 py-2.5 text-xs text-ink-soft space-y-1">
            <p><span className="font-semibold text-ink">POST</span> <span className="font-mono">{url}</span></p>
            <p>Send a customer message and receive an AI-generated reply. The agent applies all configured policies, escalation rules, and guardrails automatically.</p>
          </div>

          <SectionHeader>Request &mdash; cURL</SectionHeader>
          <CodeBlock title="shell" code={curlExample} />

          <SectionHeader>Response</SectionHeader>
          <CodeBlock title="json" code={responseExample} />

          <SectionHeader>Node.js / TypeScript</SectionHeader>
          <CodeBlock title="typescript" code={nodeExample} />

          <SectionHeader>Webhook (escalations)</SectionHeader>
          <div className="mb-2 text-xs text-ink-soft">
            Configure a callback URL in your agent settings to receive escalation events when the agent encounters tickets outside its authority.
          </div>
          <CodeBlock title="json" code={webhookExample} />

          <SectionHeader>Rate limits &amp; auth</SectionHeader>
          <div className="rounded-xl border border-black/5 bg-black/[0.02] px-3 py-2.5 text-xs text-ink-soft space-y-1">
            <p><span className="font-semibold text-ink">Auth:</span> Bearer token in the <code className="rounded bg-black/[0.06] px-1">Authorization</code> header.</p>
            <p><span className="font-semibold text-ink">Rate limit:</span> 100 req/min per API key. Burst up to 20 concurrent.</p>
            <p><span className="font-semibold text-ink">Timeout:</span> 30s max response time. Long-running requests return a <code className="rounded bg-black/[0.06] px-1">202</code> with a polling URL.</p>
          </div>
        </div>
      )}

      {showRunbook && spec && (
        <RunbookModal spec={spec} onClose={() => setShowRunbook(false)} />
      )}
    </GlassCard>
  );
}
