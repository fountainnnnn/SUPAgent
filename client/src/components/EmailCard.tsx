import { Spinner } from './ui/Spinner';
import { GlassCard } from './ui/GlassCard';

interface EmailCardProps {
  to: string;
  subject?: string;
  body?: string;
  status: 'sending' | 'sent' | 'failed';
  messageId?: string;
}

function SentIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-ok" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FailedIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-danger" aria-hidden>
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function StatusBadge({ status }: { status: EmailCardProps['status'] }) {
  if (status === 'sending') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
        <Spinner />
        Sending
      </span>
    );
  }
  if (status === 'sent') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ok font-medium">
        <SentIcon />
        Sent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-danger font-medium">
      <FailedIcon />
      Failed
    </span>
  );
}

export function EmailCard({ to, subject, body, status, messageId }: EmailCardProps) {
  return (
    <GlassCard className="p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {/* Envelope icon */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-accent" aria-hidden>
              <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M1.5 5.5l6.5 4.5 6.5-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-ink">Email</span>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1 mb-3 rounded-xl bg-black/[0.03] px-3 py-2.5">
        <div className="flex gap-2">
          <span className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">To</span>
          <span className="text-xs text-ink-soft truncate">{to}</span>
        </div>
        {subject && (
          <div className="flex gap-2">
            <span className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Subject</span>
            <span className="text-xs text-ink-soft truncate">{subject}</span>
          </div>
        )}
        {messageId && (
          <div className="flex gap-2">
            <span className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">ID</span>
            <span className="font-mono text-[11px] text-ink-faint truncate">{messageId}</span>
          </div>
        )}
      </div>

      {/* Body preview */}
      {body && (
        <p className="line-clamp-3 text-xs leading-relaxed text-ink-soft">{body}</p>
      )}
    </GlassCard>
  );
}
