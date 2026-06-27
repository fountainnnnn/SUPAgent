import type { Stage } from '@shared/events';
import type { StepStatus } from './ui/StatusDot';
import { StatusDot } from './ui/StatusDot';

const STAGE_LABELS: Record<Stage, string> = {
  intake: 'Intake',
  plan: 'Plan',
  tools: 'Tools',
  generate: 'Generate',
  selftest: 'Self-test',
  review: 'Review',
  deploy: 'Deploy',
  run: 'Run',
};

/** Leading glyph for each stage */
function StageGlyph({ stage }: { stage: Stage }) {
  const cls = 'h-3.5 w-3.5 shrink-0 text-ink-faint';
  switch (stage) {
    case 'intake':
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cls} aria-hidden>
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 8h6M5 5.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'plan':
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cls} aria-hidden>
          <path d="M3 4.5h10M3 8h7M3 11.5h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'tools':
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cls} aria-hidden>
          <path d="M11.5 2.5c.5 1.5-.5 3-2 3.5L4 11.5a1.5 1.5 0 002 2l5.5-5.5c1.5-.5 3-1.5 2-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case 'generate':
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cls} aria-hidden>
          <path d="M8 2v2M8 12v2M2 8h2M12 8h2M4.2 4.2l1.4 1.4M10.4 10.4l1.4 1.4M4.2 11.8l1.4-1.4M10.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'selftest':
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cls} aria-hidden>
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5.5 8.5l2 2 3.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'review':
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cls} aria-hidden>
          <path d="M2.5 2.5h11v10a1 1 0 01-1 1H3.5a1 1 0 01-1-1v-10z" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 6h6M5 8.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'deploy':
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cls} aria-hidden>
          <path d="M8 11V4M5 7l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2.5 13.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'run':
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cls} aria-hidden>
          <path d="M5 3.5l8 4.5-8 4.5V3.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function ToolCallRow({
  stage,
  name,
  detail,
  status,
}: {
  stage: Stage;
  name: string;
  detail: string;
  status: StepStatus;
}) {
  const isActive = status === 'active';
  const isDone = status === 'done';

  return (
    <div
      className={[
        'flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200',
        isActive ? 'bg-accent-ghost/60 shadow-glass' : '',
        isDone ? 'opacity-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <StageGlyph stage={stage} />

      <span className="label-tag shrink-0">{STAGE_LABELS[stage]}</span>

      <span
        className={[
          'flex-1 truncate font-mono text-xs leading-snug',
          isActive ? 'text-ink' : 'text-ink-soft',
        ].join(' ')}
      >
        <span className="font-medium not-italic">{name}</span>
        <span className="text-ink-faint"> · </span>
        <span>{detail}</span>
      </span>

      <StatusDot status={status} />
    </div>
  );
}
