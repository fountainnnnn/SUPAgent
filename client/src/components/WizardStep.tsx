import type { ReactNode } from 'react';
import { GlassCard } from './ui/GlassCard';

export function WizardStep({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <GlassCard className="p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-ink tracking-tight">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-ink-soft leading-relaxed">{subtitle}</p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </GlassCard>
  );
}
