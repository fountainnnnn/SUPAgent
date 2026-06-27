import { ModeToggle } from './ModeToggle';
import { StatusPill } from './StatusPill';
import { Logo } from './Logo';

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
      <div className="mx-auto flex h-14 max-w-[1040px] items-center justify-between px-5">
        <Logo />

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <StatusPill label={status} tone={tone} />
          <ModeToggle mode={mode} onModeChange={onModeChange} />
        </div>
      </div>
    </header>
  );
}
