import type { Ticket } from '@shared/events';
import { GlassCard } from './ui/GlassCard';

export function BlockedCard({ reason, ticket }: { reason: string; ticket?: Ticket }) {
  return (
    <GlassCard className="border border-danger/20 bg-danger/5 p-4">
      <div className="flex items-start gap-3">
        {/* Shield icon */}
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger/10">
          <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-danger" aria-hidden>
            <path
              d="M8 1.5L2.5 3.5v4c0 3 2.5 5.5 5.5 6 3-0.5 5.5-3 5.5-6v-4L8 1.5z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path d="M8 5.5v3M8 10v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-sm font-semibold text-danger">Guardrail triggered</p>
          <p className="text-sm text-ink-soft leading-relaxed">{reason}</p>

          {ticket && (
            <div className="mt-2 rounded-xl border border-black/5 bg-white/40 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint mb-1">
                Original ticket
              </p>
              <p className="text-xs text-ink-soft">
                <span className="font-medium text-ink">{ticket.from}</span>
                {' — '}
                {ticket.subject}
              </p>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
