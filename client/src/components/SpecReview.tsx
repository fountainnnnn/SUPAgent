import { useState } from 'react';
import type { AgentSpec, SpecPolicy, SpecEscalation, SpecAuthority, AuthorityLevel } from '@shared/types';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';
import { SegmentedControl } from './ui/SegmentedControl';

const AUTHORITY_OPTIONS: { label: string; value: AuthorityLevel }[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Approval', value: 'approval' },
  { label: 'Never', value: 'never' },
];

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
      {children}
    </p>
  );
}

interface InlineTextProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
}

function InlineText({ value, onChange, className = '', multiline }: InlineTextProps) {
  const base =
    'w-full rounded-lg border border-transparent bg-transparent px-0 py-0.5 text-sm text-ink outline-none transition hover:bg-black/[0.03] focus:border-accent/30 focus:bg-white/60 focus:shadow-glass';
  if (multiline) {
    return (
      <textarea
        className={`${base} resize-none leading-relaxed ${className}`}
        value={value}
        rows={2}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      type="text"
      className={`${base} ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function SpecReview({
  spec,
  onConfirm,
  confirmed = false,
}: {
  spec: AgentSpec;
  onConfirm: (edited: AgentSpec) => void;
  confirmed?: boolean;
}) {
  const [edited, setEdited] = useState<AgentSpec>(() => ({
    ...spec,
    policies: spec.policies.map((p) => ({ ...p })),
    escalation: spec.escalation.map((e) => ({ ...e })),
    authority: spec.authority.map((a) => ({ ...a })),
    capabilities: [...spec.capabilities],
    unknowns: [...spec.unknowns],
  }));

  function updateField<K extends keyof AgentSpec>(key: K, value: AgentSpec[K]) {
    setEdited((prev) => ({ ...prev, [key]: value }));
  }

  function updatePolicy(i: number, patch: Partial<SpecPolicy>) {
    setEdited((prev) => {
      const policies = prev.policies.map((p, idx) => (idx === i ? { ...p, ...patch } : p));
      return { ...prev, policies };
    });
  }

  function updateEscalation(i: number, patch: Partial<SpecEscalation>) {
    setEdited((prev) => {
      const escalation = prev.escalation.map((e, idx) =>
        idx === i ? { ...e, ...patch } : e
      );
      return { ...prev, escalation };
    });
  }

  function updateAuthority(i: number, patch: Partial<SpecAuthority>) {
    setEdited((prev) => {
      const authority = prev.authority.map((a, idx) =>
        idx === i ? { ...a, ...patch } : a
      );
      return { ...prev, authority };
    });
  }

  return (
    <div className={`flex flex-col gap-4 ${confirmed ? 'pointer-events-none' : ''}`}>
      {/* Role + Tone */}
      <GlassCard className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionHeader>Role</SectionHeader>
            <InlineText
              value={edited.role}
              onChange={(v) => updateField('role', v)}
            />
          </div>
          <div>
            <SectionHeader>Tone</SectionHeader>
            <InlineText
              value={edited.tone}
              onChange={(v) => updateField('tone', v)}
            />
          </div>
        </div>
      </GlassCard>

      {/* Policies */}
      {edited.policies.length > 0 && (
        <GlassCard className="p-4">
          <SectionHeader>Policies ({edited.policies.length})</SectionHeader>
          <div className="flex flex-col gap-3">
            {edited.policies.map((policy, i) => (
              <div key={i} className="rounded-xl border border-black/5 bg-black/[0.02] px-3 py-2.5">
                <InlineText
                  value={policy.name}
                  onChange={(v) => updatePolicy(i, { name: v })}
                  className="font-semibold"
                />
                <InlineText
                  value={policy.rule}
                  onChange={(v) => updatePolicy(i, { rule: v })}
                  multiline
                  className="mt-1 text-ink-soft"
                />
                {policy.source && (
                  <p className="mt-1 font-mono text-[11px] text-ink-faint truncate">
                    Source: {policy.source}
                  </p>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Escalation */}
      {edited.escalation.length > 0 && (
        <GlassCard className="p-4">
          <SectionHeader>Escalation ({edited.escalation.length})</SectionHeader>
          <div className="flex flex-col gap-3">
            {edited.escalation.map((esc, i) => (
              <div key={i} className="rounded-xl border border-black/5 bg-black/[0.02] px-3 py-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[11px] text-ink-faint mb-0.5">Condition</p>
                    <InlineText
                      value={esc.condition}
                      onChange={(v) => updateEscalation(i, { condition: v })}
                    />
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-faint mb-0.5">Threshold</p>
                    <InlineText
                      value={esc.threshold}
                      onChange={(v) => updateEscalation(i, { threshold: v })}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-[11px] text-ink-faint mb-0.5">Action</p>
                  <InlineText
                    value={esc.action}
                    onChange={(v) => updateEscalation(i, { action: v })}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Authority */}
      {edited.authority.length > 0 && (
        <GlassCard className="p-4">
          <SectionHeader>Authority</SectionHeader>
          <div className="flex flex-col divide-y divide-black/[0.05]">
            {edited.authority.map((auth, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                <InlineText
                  value={auth.action}
                  onChange={(v) => updateAuthority(i, { action: v })}
                  className="flex-1"
                />
                <SegmentedControl<AuthorityLevel>
                  options={AUTHORITY_OPTIONS}
                  value={auth.level}
                  onChange={(v) => updateAuthority(i, { level: v })}
                  groupId={`spec-auth-${i}`}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Capabilities */}
      {edited.capabilities.length > 0 && (
        <GlassCard className="p-4">
          <SectionHeader>Capabilities</SectionHeader>
          <div className="flex flex-wrap gap-2">
            {edited.capabilities.map((cap, i) => (
              <span key={i} className="label-tag">{cap}</span>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Confirm button / confirmed state */}
      <div className="flex justify-end">
        {confirmed ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-ok/10 px-3 py-1.5 text-sm font-medium text-ok">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
              <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Spec confirmed
          </span>
        ) : (
          <Button variant="primary" onClick={() => onConfirm(edited)}>
            Looks right — generate
          </Button>
        )}
      </div>
    </div>
  );
}
