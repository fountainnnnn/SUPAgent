import { Spinner } from './ui/Spinner';

export function StatusPill({
  label,
  tone = 'idle',
}: {
  label: string;
  tone?: 'idle' | 'busy' | 'live';
}) {
  const toneStyles: Record<'idle' | 'busy' | 'live', string> = {
    idle: 'bg-black/[0.05] text-ink-soft',
    busy: 'bg-black/[0.05] text-ink-soft',
    live: 'bg-ok/10 text-ok',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${toneStyles[tone]}`}
    >
      {tone === 'busy' && <Spinner />}
      {tone === 'live' && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
      )}
      {label}
    </span>
  );
}
