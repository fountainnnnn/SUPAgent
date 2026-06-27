import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { FactoryEvent, Stage, Ticket, ArtifactKind } from '@shared/events';
import type { AgentSpec } from '@shared/types';
import type { StepStatus } from './ui/StatusDot';
import { AssistantBubble } from './AssistantBubble';
import { ToolCallRow } from './ToolCallRow';
import { StageGroup } from './StageGroup';
import { GapReport } from './GapReport';
import { SpecReview } from './SpecReview';
import { ReviewCard } from './ReviewCard';
import { Sandbox } from './Sandbox';
import { EmailCard } from './EmailCard';
import { DeployCard } from './DeployCard';
import { QuestionCard } from './QuestionCard';
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

// ─── User bubble (right-aligned) ──────────────────────────────────────────────

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="px-1 text-[11px] font-medium text-ink-faint">You</span>
      <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-accent px-4 py-3 shadow-glass">
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-white">{text}</p>
      </div>
    </div>
  );
}

// ─── Detect card ──────────────────────────────────────────────────────────────

function DetectCard({
  agentType,
  org,
  confidence,
}: {
  agentType: string;
  org: string;
  confidence: string;
}) {
  return (
    <GlassCard className="inline-flex flex-col gap-0.5 px-4 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
        Detected
      </span>
      <span className="text-base font-semibold text-ink leading-tight">{agentType}</span>
      <span className="text-xs text-ink-soft">
        {org} &middot; confidence {confidence}
      </span>
    </GlassCard>
  );
}

// ─── Grouping helpers ──────────────────────────────────────────────────────────

type StepLike = Extract<FactoryEvent, { type: 'step' | 'tool' }>;

function isStepLike(e: FactoryEvent): e is StepLike {
  return e.type === 'step' || e.type === 'tool';
}

interface StageChunk {
  kind: 'stage';
  stage: Stage;
  items: StepLike[];
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

    // Skip terminal event — not rendered inline
    if (event.type === 'done') {
      i++;
      continue;
    }

    if (isStepLike(event)) {
      const stage = event.stage;
      const startIndex = i;
      const chunk: StepLike[] = [];

      while (
        i < events.length &&
        isStepLike(events[i]) &&
        (events[i] as StepLike).stage === stage
      ) {
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
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className={`h-4 w-4 ${allPass ? 'text-ok' : 'text-warn'}`}
        aria-hidden
      >
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M5.5 8.5l2 2 3.5-4"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="h-3.5 w-3.5 text-ink-faint"
          aria-hidden
        >
          <rect
            x="1.5"
            y="3.5"
            width="13"
            height="9"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <path
            d="M1.5 5.5l6.5 4.5 6.5-4.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
          Inbound
        </span>
        <span className="ml-1 text-xs font-semibold text-ink">{from}</span>
        <span className="truncate text-xs text-ink-soft">{subject}</span>
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">{body}</p>
    </GlassCard>
  );
}

// ─── Fade-up wrapper ──────────────────────────────────────────────────────────

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

interface RenderCtx {
  hasEmailSent: boolean;
  lastReply?: Extract<FactoryEvent, { type: 'reply' }>;
  pendingQuestionId?: string | null;
  answers: Record<string, string>;
  specPending: boolean;
  onAnswer: (value: string) => void;
  onSpecConfirm: (edited: AgentSpec) => void;
}

function renderSingle(
  event: FactoryEvent,
  key: string | number,
  ctx: RenderCtx,
): React.ReactNode {
  switch (event.type) {
    case 'usermsg':
      return (
        <FadeUp key={key}>
          <UserBubble text={event.text} />
        </FadeUp>
      );

    case 'detect':
      return (
        <FadeUp key={key}>
          <DetectCard
            agentType={event.agentType}
            org={event.org}
            confidence={event.confidence}
          />
        </FadeUp>
      );

    case 'question':
      return (
        <FadeUp key={key}>
          <QuestionCard
            prompt={event.prompt}
            options={event.options}
            allowText={event.allowText}
            selected={ctx.answers[event.id]}
            disabled={event.id !== ctx.pendingQuestionId}
            onAnswer={ctx.onAnswer}
          />
        </FadeUp>
      );

    case 'spec':
      return (
        <FadeUp key={key}>
          <SpecReview
            spec={event.spec}
            onConfirm={ctx.onSpecConfirm}
            confirmed={!ctx.specPending}
          />
        </FadeUp>
      );

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
      // Once email_sent exists, skip the transient "sending" card to avoid a duplicate.
      if (ctx.hasEmailSent) return null;
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
          <EmailCard
            to={event.to}
            subject={ctx.lastReply?.subject}
            body={ctx.lastReply?.body}
            status="sent"
            messageId={event.messageId}
          />
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

export interface ChatStreamProps {
  events: FactoryEvent[];
  activeStage: Stage | null;
  /** Pause auto-scroll while a blocking interaction (e.g. spec review) is on screen. */
  paused?: boolean;
  /** The id of the question currently awaiting an answer, or null/undefined if none. */
  pendingQuestionId?: string | null;
  /** Map of question id -> chosen answer value. */
  answers: Record<string, string>;
  /** True while the spec review is awaiting confirmation (keeps the spec card editable). */
  specPending?: boolean;
  /** Called when the user picks or types an answer for the pending question. */
  onAnswer: (value: string) => void;
  /** Called when the user confirms (possibly edited) the agent spec. */
  onSpecConfirm: (edited: AgentSpec) => void;
}

export function ChatStream({
  events,
  activeStage,
  paused = false,
  pendingQuestionId,
  answers,
  specPending = false,
  onAnswer,
  onSpecConfirm,
}: ChatStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events, paused]);

  const streamItems = groupEvents(events);

  const ctx: RenderCtx = {
    hasEmailSent: events.some((e) => e.type === 'email_sent'),
    lastReply: [...events]
      .reverse()
      .find(
        (e): e is Extract<FactoryEvent, { type: 'reply' }> => e.type === 'reply',
      ),
    pendingQuestionId,
    answers,
    specPending,
    onAnswer,
    onSpecConfirm,
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      {streamItems.map((item, idx) => {
        const isLast = idx === streamItems.length - 1;

        if (item.kind === 'single') {
          return renderSingle(item.event, item.index, ctx);
        }

        // Stage group — consecutive step/tool events for the same stage.
        // "Streaming" (open + spinner) only while it's the last item in the stream;
        // once anything appears after it (next stage, a follow-up, etc.) it collapses.
        const { stage, items, startIndex } = item;
        const isActive = stage === activeStage;
        const streaming = isLast;

        const rows = items.map((rowEvent, rowIdx): React.ReactNode => {
          const status: StepStatus =
            streaming && rowIdx === items.length - 1 ? 'active' : 'done';

          if (rowEvent.type === 'tool') {
            return (
              <ToolCallRow
                key={`${startIndex}-${rowIdx}`}
                stage={rowEvent.stage}
                name={rowEvent.name}
                detail={rowEvent.detail}
                status={status}
              />
            );
          }
          // step event
          return (
            <ToolCallRow
              key={`${startIndex}-${rowIdx}`}
              stage={rowEvent.stage}
              name={rowEvent.label}
              detail=""
              status={status}
            />
          );
        });

        return (
          <FadeUp key={startIndex}>
            <StageGroup
              stage={stage}
              title={STAGE_HUMAN[stage]}
              active={isActive || streaming}
              defaultOpen={streaming}
              count={items.length}
            >
              {rows}
            </StageGroup>
          </FadeUp>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
