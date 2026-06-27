import { useState } from 'react';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';

interface DeployCardProps {
  url: string;
  repoUrl?: string;
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
      aria-label="Copy URL"
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

const ENV_EXAMPLE = `# .env.example
AGENT_ENDPOINT=<your-url>
AGENT_API_KEY=<your-key>
NODE_ENV=production`;

export function DeployCard({ url, repoUrl }: DeployCardProps) {
  return (
    <GlassCard strong className="p-5">
      {/* Live badge */}
      <div className="mb-4 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ok" />
        </span>
        <span className="text-sm font-semibold text-ok">Endpoint live</span>
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
        <Button variant="secondary" className="text-xs" onClick={() => window.open('#', '_blank')}>
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
            <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Download PDF runbook
        </Button>
      </div>

      {/* .env.example */}
      <div className="rounded-xl bg-black/[0.04] px-3 py-2.5">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
          .env.example
        </p>
        <pre className="font-mono text-[11px] leading-relaxed text-ink-soft whitespace-pre-wrap">
          {ENV_EXAMPLE}
        </pre>
      </div>
    </GlassCard>
  );
}
