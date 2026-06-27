import { motion } from 'framer-motion';
import { Button } from './ui/Button';

interface GapReportProps {
  covered: string[];
  missing: string[];
  willEscalate: string[];
  onProceed?: () => void;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0 text-ok" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MissingIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0 text-danger" aria-hidden>
      <path d="M8 4v5M8 11.5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function EscalateIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0 text-warn" aria-hidden>
      <path d="M8 2.5v7M8 11.5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface ColumnProps {
  title: string;
  items: string[];
  Icon: () => JSX.Element;
  accent: string;
}

function Column({ title, items, Icon, accent }: ColumnProps) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <p className={`text-[11px] font-semibold uppercase tracking-widest ${accent}`}>{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-ink-faint italic">None</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <Icon />
              <span className="text-xs text-ink-soft leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function GapReport({ covered, missing, willEscalate, onProceed }: GapReportProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="glass rounded-2xl p-4 shadow-glass"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-faint">
        Gap analysis
      </p>

      <div className="grid grid-cols-3 gap-4 border-t border-black/5 pt-3">
        <Column
          title="Covered"
          items={covered}
          Icon={CheckIcon}
          accent="text-ok"
        />
        <Column
          title="Missing"
          items={missing}
          Icon={MissingIcon}
          accent="text-danger"
        />
        <Column
          title="Will escalate"
          items={willEscalate}
          Icon={EscalateIcon}
          accent="text-warn"
        />
      </div>

      {onProceed && (
        <div className="mt-4 flex justify-end border-t border-black/5 pt-3">
          <Button variant="primary" onClick={onProceed}>
            Proceed
          </Button>
        </div>
      )}
    </motion.div>
  );
}
