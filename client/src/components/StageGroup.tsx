import type { ReactNode } from 'react';
import type { Stage } from '@shared/events';

const STAGE_ORDER: Stage[] = ['intake', 'plan', 'tools', 'generate', 'selftest', 'review', 'deploy', 'run'];

function stageIndex(s: Stage): number {
  return STAGE_ORDER.indexOf(s);
}

/** Returns a subtle color accent per stage for the header dot */
function stageDotColor(stage: Stage): string {
  switch (stage) {
    case 'intake': return 'bg-ink-faint';
    case 'plan': return 'bg-accent';
    case 'tools': return 'bg-warn';
    case 'generate': return 'bg-accent';
    case 'selftest': return 'bg-ok';
    case 'review': return 'bg-warn';
    case 'deploy': return 'bg-ok';
    case 'run': return 'bg-accent';
  }
}

// Suppresses TS unused-variable warning for stageIndex (used as a type-check reference)
void stageIndex;

export function StageGroup({
  stage,
  title,
  active,
  children,
}: {
  stage: Stage;
  title: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={[
        'flex flex-col gap-0.5 rounded-2xl border transition-all duration-300',
        active
          ? 'border-accent/20 bg-white/60 shadow-glass'
          : 'border-transparent bg-transparent opacity-60',
      ].join(' ')}
    >
      {/* Stage header */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${stageDotColor(stage)}`} aria-hidden />
        <span
          className={[
            'text-[11px] font-semibold uppercase tracking-widest',
            active ? 'text-ink-soft' : 'text-ink-faint',
          ].join(' ')}
        >
          {title}
        </span>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-0.5 px-1 pb-1.5">{children}</div>
    </div>
  );
}
