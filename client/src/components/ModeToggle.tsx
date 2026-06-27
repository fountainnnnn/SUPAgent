import { SegmentedControl } from './ui/SegmentedControl';

const MODE_OPTIONS: { label: string; value: 'demo' | 'real' }[] = [
  { label: 'Demo', value: 'demo' },
  { label: 'Real', value: 'real' },
];

export function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: 'demo' | 'real';
  onModeChange: (m: 'demo' | 'real') => void;
}) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <SegmentedControl
        options={MODE_OPTIONS}
        value={mode}
        onChange={onModeChange}
        groupId="mode"
        size="sm"
      />
      {mode === 'real' && (
        <span className="text-[10px] text-ink-faint leading-none pr-0.5">uses Codex</span>
      )}
    </div>
  );
}
