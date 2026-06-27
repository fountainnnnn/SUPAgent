import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Stage } from '@shared/events';

/** Subtle color accent per stage for the header dot. */
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

export function StageGroup({
  stage,
  title,
  active,
  defaultOpen,
  count,
  children,
}: {
  stage: Stage;
  title: string;
  /** True while this is the stage currently streaming (header highlight). */
  active: boolean;
  /** Open by default while streaming; collapses once the section is done. */
  defaultOpen: boolean;
  count?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  // Follow the streaming state: open while current, collapse when finished.
  // Once finished (defaultOpen stays false) the user can still toggle freely.
  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  const done = !active;

  return (
    <div
      className={[
        'rounded-2xl border transition-all duration-300',
        active
          ? 'border-accent/20 bg-white/60 shadow-glass'
          : 'border-black/[0.05] bg-white/30',
      ].join(' ')}
    >
      {/* Stage header — click to expand/collapse */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left transition hover:bg-black/[0.02]"
      >
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${stageDotColor(stage)}`} aria-hidden />
        <span
          className={[
            'text-[11px] font-semibold uppercase tracking-widest',
            active ? 'text-ink-soft' : 'text-ink-faint',
          ].join(' ')}
        >
          {title}
        </span>
        {count != null && (
          <span className="text-[11px] text-ink-faint">
            · {count} step{count === 1 ? '' : 's'}
          </span>
        )}
        {done && (
          <svg viewBox="0 0 16 16" className="h-3 w-3 text-ok" fill="none" aria-label="done">
            <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <svg
          viewBox="0 0 16 16"
          className={`ml-auto h-3.5 w-3.5 text-ink-faint transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none"
          aria-hidden
        >
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Rows */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 px-1 pb-1.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
