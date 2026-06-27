import { Spinner } from './Spinner';

export type StepStatus = 'pending' | 'active' | 'done' | 'error';

/** Trailing status indicator for tool-call rows / steps. */
export function StatusDot({ status }: { status: StepStatus }) {
  if (status === 'active') return <Spinner />;
  if (status === 'done') {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-ok" aria-label="done" fill="none">
        <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'error') {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-danger" aria-label="error" fill="none">
        <path d="M8 4v5M8 11.5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return <span className="inline-block h-2 w-2 rounded-full bg-ink-faint/30" aria-hidden />;
}
