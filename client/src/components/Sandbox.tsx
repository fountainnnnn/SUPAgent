import type { Ticket, Reply } from '@shared/events';
import { GlassCard } from './ui/GlassCard';
import { BlockedCard } from './BlockedCard';

interface SandboxProps {
  ticket: Ticket;
  reply?: Reply;
  blocked?: { reason: string };
}

function TicketBubble({ ticket }: { ticket: Ticket }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {/* Inbound arrow icon */}
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-ink-faint" aria-hidden>
          <path d="M13 3L3 13M3 6v7h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
          Inbound ticket
        </span>
      </div>

      <div className="rounded-2xl rounded-tl-sm bg-black/[0.04] px-4 py-3">
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-xs font-semibold text-ink">{ticket.from}</span>
          <span className="text-[11px] text-ink-faint">{ticket.subject}</span>
        </div>
        <p className="text-sm leading-relaxed text-ink-soft whitespace-pre-wrap">{ticket.body}</p>
      </div>
    </div>
  );
}

function ReplyBubble({ reply }: { reply: Reply }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 justify-end">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
          Draft reply
        </span>
        {/* Outbound arrow icon */}
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-ink-faint" aria-hidden>
          <path d="M3 13L13 3M13 10V3H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="self-end max-w-[90%] glass rounded-2xl rounded-tr-sm px-4 py-3 shadow-glass">
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-[11px] text-ink-faint">to</span>
          <span className="text-xs font-semibold text-ink">{reply.to}</span>
          <span className="text-[11px] text-ink-faint">{reply.subject}</span>
        </div>
        <p className="text-sm leading-relaxed text-ink whitespace-pre-wrap">{reply.body}</p>
      </div>
    </div>
  );
}

export function Sandbox({ ticket, reply, blocked }: SandboxProps) {
  return (
    <GlassCard className="p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
        Sandbox test
      </p>

      <div className="flex flex-col gap-4">
        <TicketBubble ticket={ticket} />

        {blocked ? (
          <BlockedCard reason={blocked.reason} />
        ) : reply ? (
          <ReplyBubble reply={reply} />
        ) : null}
      </div>
    </GlassCard>
  );
}
