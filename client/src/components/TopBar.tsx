import { ModeToggle } from './ModeToggle';
import { StatusPill } from './StatusPill';

export function TopBar({
  mode,
  onModeChange,
  status,
  tone = 'idle',
}: {
  mode: 'demo' | 'real';
  onModeChange: (m: 'demo' | 'real') => void;
  status: string;
  tone?: 'idle' | 'busy' | 'live';
}) {
  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-black/[0.06]">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-5">
        {/* Product name */}
        <span className="text-sm font-semibold tracking-tight text-ink">
          Agent Factory
        </span>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <StatusPill label={status} tone={tone} />
          <ModeToggle mode={mode} onModeChange={onModeChange} />
        </div>
      </div>
    </header>
  );
}
