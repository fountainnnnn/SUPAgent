import { motion } from 'framer-motion';

/**
 * Apple-style segmented control with a sliding active pill.
 * `groupId` MUST be unique per on-screen instance (it's the framer layoutId);
 * e.g. "mode" for the top-bar toggle, `auth-${i}` per authority-table row.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  groupId,
  size = 'md',
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  groupId: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="relative inline-flex rounded-full bg-black/[0.06] p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`relative z-10 rounded-full font-medium transition-colors ${
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-1.5 text-sm'
            } ${active ? 'text-ink' : 'text-ink-soft hover:text-ink'}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${groupId}`}
                className="absolute inset-0 -z-10 rounded-full bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
