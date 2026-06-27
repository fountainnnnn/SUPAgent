import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { FactoryEvent, Stage, Ticket, ArtifactKind } from '@shared/events';
import type { StepStatus } from './ui/StatusDot';
import { AssistantBubble } from './AssistantBubble';
import { ToolCallRow } from './ToolCallRow';
import { StageGroup } from './StageGroup';
import { GapReport } from './GapReport';
import { ReviewCard } from './ReviewCard';
import { Sandbox } from './Sandbox';
import { EmailCard } from './EmailCard';
import { DeployCard } from './DeployCard';
import { GlassCard } from './ui/GlassCard';

// ─── Human-readable stage names ───────────────────────────────────────────────

const STAGE_HUMAN: Record<Stage, string> = {
  intake: 'Intake',
  plan: 'Planning',
  tools: 'Tool selection',
  generate: 'Code generation',
  selftest: 'Self-test',
  review: 'Supervisor review',
  deploy: 'Deploy',
  run: 'Live run',
};

// ─── Grouping helpers ──────────────────────────────────────────────────────────

/** Events that carry a `stage` field and get grouped into StageGroups */
type StepLike = Extract<FactoryEvent, { type: 'step' | 'tool' }>;

function isStepLike(e: FactoryEvent): e is StepLike {
  return e.type === 'step' || e.type === 'tool';
}

/** Consecutive step/tool events grouped into { stage, items[] } chunks */
interface StageChunk {
  kind: 'stage';
  stage: Stage;
  items: StepLike[];
  /** Index of the first event in the chunk (used as key) */
  startIndex: number;
}

interface SingleItem {
  kind: 'single';
  event: FactoryEvent;
  index: number;
}

type StreamItem = StageChunk | SingleItem;

function groupEvents(events: FactoryEvent[]): StreamItem[] {
  const items: StreamItem[] = [];
  let i = 0;

  while (i < events.length) {
    const event = events[i];

    // Skip confirm + spec — rendered as overlays elsewhere
    if (event.type === 'confirm' || event.type === 'spec' || event.type === 'done') {
      i++;
      continue;
    }

    if (isStepLike(event)) {
      // Collect consecutive step/tool events for the same stage
      const stage = event.stage;
      const startIndex = i;
      const chunk: StepLike[] = [];

      while (i < events.length && isStepLike(events[i]) && (events[i] as StepLike).stage === stage) {
        chunk.push(events[i] as StepLike);
        i++;
      }

      items.push({ kind: 'stage', stage, items: chunk, startIndex });
    } else {
      items.push({ kind: 'single', event, index: i });
      i++;
    }
  }

  return items;
}

// ─── Evals artifact card ───────────────────────────────────────────────────────

interface EvalsData {
  passed?: number;
  total?: number;
}

function EvalsCard({ data }: { data: unknown }) {
  const d = (data ?? {}) as EvalsData;
  const passed = d.passed ?? 0;
  const total = d.total ?? 0;
  const allPass = passed === total && total > 0;

  return (
    <GlassCard className="inline-flex items-center gap-3 px-4 py-3">
      <svg viewBox="0 0 16 16" fill="none" className={`h-4 w-4 ${allPass ? 'text-ok' : 'text-warn'}`} aria-hidden>
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5.5 8.5l2 2 3.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm font-medium text-ink">
        Evals{' '}
        <span className={allPass ? 'text-ok' : 'text-warn'}>
          {passed}/{total} passing
        </span>
      </span>
    </GlassCard>
  );
}

// ─── Inbound ticket card ───────────────────────────────────────────────────────

function TicketCard({ from, subject, body }: Ticket) {
  return (
    <GlassCard className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-ink-faint" aria-hidden>
          <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.5 5.5l6.5 4.5 6.5-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
          Inbound
        </span>
        <span className="text-xs font-semibold text-ink ml-1">{from}</span>
        <span className="text-xs text-ink-soft truncate">{subject}</span>
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">{body}</p>
    </GlassCard>
  );
}

// ─── Fade-up wrapper for each stream item ─────────────────────────────────────

function FadeUp({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// ─── Single-event renderer ────────────────────────────────────────────────────

function renderSingle(event: FactoryEvent, key: string | number): React.ReactNode {
  switch (event.type) {
    case 'assistant':
      return (
        <FadeUp key={key}>
          <AssistantBubble text={event.text} />
        </FadeUp>
      );

    case 'gap':
      return (
        <FadeUp key={key}>
          <GapReport
            covered={event.covered}
            missing={event.missing}
            willEscalate={event.willEscalate}
          />
        </FadeUp>
      );

    case 'review':
      return (
        <FadeUp key={key}>
          <ReviewCard
            round={event.round}
            verdict={event.verdict}
            issues={event.issues}
            redteam={event.redteam}
          />
        </FadeUp>
      );

    case 'sandbox':
      return (
        <FadeUp key={key}>
          <Sandbox ticket={event.ticket} reply={event.reply} blocked={event.blocked} />
        </FadeUp>
      );

    case 'ticket':
      return (
        <FadeUp key={key}>
          <TicketCard from={event.from} subject={event.subject} body={event.body} />
        </FadeUp>
      );

    case 'reply':
      return (
        <FadeUp key={key}>
          <EmailCard
            to={event.to}
            subject={event.subject}
            body={event.body}
            status="sending"
          />
        </FadeUp>
      );

    case 'email_sent':
      return (
        <FadeUp key={key}>
          <EmailCard to={event.to} status="sent" messageId={event.messageId} />
        </FadeUp>
      );

    case 'artifact': {
      const kind = event.kind as ArtifactKind;
      if (kind === 'endpoint') {
        const d = event.data as { url?: string };
        return (
          <FadeUp key={key}>
            <DeployCard url={d.url ?? '#'} />
          </FadeUp>
        );
      }
      if (kind === 'repo') {
        const d = event.data as { url?: string; repoUrl?: string };
        return (
          <FadeUp key={key}>
            <DeployCard url={d.url ?? '#'} repoUrl={d.repoUrl} />
          </FadeUp>
        );
      }
      if (kind === 'evals') {
        return (
          <FadeUp key={key}>
            <EvalsCard data={event.data} />
          </FadeUp>
        );
      }
      return null;
    }

    default:
      return null;
  }
}

// ─── ChatStream ───────────────────────────────────────────────────────────────

interface ChatStreamProps {
  events: FactoryEvent[];
  activeStage: Stage | null;
}

export function ChatStream({ events, activeStage }: ChatStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const streamItems = groupEvents(events);

  return (
    <div className="flex flex-col gap-3 pb-4">
      {streamItems.map((item) => {
        if (item.kind === 'single') {
          return renderSingle(item.event, item.index);
        }

        // Stage group
        const { stage, items, startIndex } = item;
        const isActive = stage === activeStage;

        // Determine status for each row
        const rows = items.map((rowEvent, rowIdx): React.ReactNode => {
          let status: StepStatus;
          if (!isActive) {
            // All done if group is not active
            status = 'done';
          } else {
            // Within the active group: last step is active, rest are done
            status = rowIdx === items.length - 1 ? 'active' : 'done';
          }

          if (rowEvent.type === 'tool') {
            return (
              <ToolCallRow
                key={startIndex + rowIdx}
                stage={rowEvent.stage}
                name={rowEvent.name}
                detail={rowEvent.detail}
                status={status}
              />
            );
          }
          // step event — render as a ToolCallRow with the label as detail
          return (
            <ToolCallRow
              key={startIndex + rowIdx}
              stage={rowEvent.stage}
              name={rowEvent.label}
              detail=""
              status={status}
            />
          );
        });

        return (
          <FadeUp key={startIndex}>
            <StageGroup stage={stage} title={STAGE_HUMAN[stage]} active={isActive}>
              {rows}
            </StageGroup>
          </FadeUp>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
