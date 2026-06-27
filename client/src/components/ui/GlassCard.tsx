import type { ReactNode } from 'react';

/** Core glass surface primitive. Use `strong` for elevated/modal surfaces. */
export function GlassCard({
  children,
  className = '',
  strong = false,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div className={`${strong ? 'glass-strong' : 'glass'} rounded-2xl ${className}`}>{children}</div>
  );
}
