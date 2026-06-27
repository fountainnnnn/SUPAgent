import type { ReviewIssue, RedTeamProbe } from '@shared/events';
import { GlassCard } from './ui/GlassCard';

const SEVERITY_STYLES: Record<ReviewIssue['severity'], { label: string; cls: string }> = {
  low: { label: 'Low', cls: 'bg-ink-faint/10 text-ink-soft' },
  med: { label: 'Med', cls: 'bg-warn/10 text-warn' },
  high: { label: 'High', cls: 'bg-danger/10 text-danger' },
  critical: { label: 'Critical', cls: 'bg-danger/20 text-danger font-semibold' },
};

const STAGE_NAMES: Record<number, string> = {
  1: 'Spec',
  2: 'Tools',
  3: 'Generate',
};

function IssueRow({ issue }: { issue: ReviewIssue }) {
  const sev = SEVERITY_STYLES[issue.severity];
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-black/5 bg-black/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${sev.cls}`}>
          {sev.label}
        </span>
        {STAGE_NAMES[issue.stage] && (
          <span className="label-tag">{STAGE_NAMES[issue.stage]}</span>
        )}
        <span className="text-xs font-medium text-ink leading-snug">{issue.issue}</span>
      </div>
      {issue.evidence && (
        <p className="rounded-lg bg-black/[0.04] px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-ink-soft break-all">
          {issue.evidence}
        </p>
      )}
      {issue.fix && (
        <p className="text-[11px] text-ink-soft leading-relaxed">
          <span className="font-semibold text-ink">Fix: </span>
          {issue.fix}
        </p>
      )}
    </div>
  );
}

function RedTeamRow({ probe }: { probe: RedTeamProbe }) {
  const passed = probe.passed === true;
  const failed = probe.passed === false;

  return (
    <div className="flex items-start gap-2.5 py-1.5">
      {/* Status glyph */}
      <div className="mt-0.5 shrink-0">
        {passed ? (
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-ok" aria-hidden>
            <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : failed ? (
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-danger" aria-hidden>
            <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <span className="inline-block h-2 w-2 rounded-full bg-ink-faint/30" aria-hidden />
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-ink-soft leading-snug">{probe.ticket}</p>
        <p className={`text-[11px] font-medium ${passed ? 'text-ok' : failed ? 'text-danger' : 'text-ink-faint'}`}>
          {probe.expected === 'resist' ? 'Should resist' : 'Should escalate'}
          {probe.passed !== undefined && (passed ? ' — passed' : ' — failed')}
        </p>
      </div>
    </div>
  );
}

interface ReviewCardProps {
  round: number;
  verdict: 'approved' | 'changes_requested';
  issues: ReviewIssue[];
  redteam?: RedTeamProbe[];
}

export function ReviewCard({ round, verdict, issues, redteam }: ReviewCardProps) {
  const approved = verdict === 'approved';

  return (
    <GlassCard className={`p-4 ${approved ? 'border border-ok/20' : 'border border-warn/20'}`}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Supervisor icon */}
          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${approved ? 'bg-ok/10' : 'bg-warn/10'}`}>
            <svg viewBox="0 0 16 16" fill="none" className={`h-4 w-4 ${approved ? 'text-ok' : 'text-warn'}`} aria-hidden>
              <circle cx="8" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M3 13c0-2.21 2.239-4 5-4s5 1.79 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-ink">Supervisor · Round {round}</span>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            approved ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'
          }`}
        >
          {approved ? 'Approved' : 'Changes requested'}
        </span>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div className="mb-3 flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
            Issues ({issues.length})
          </p>
          {issues.map((issue, i) => (
            <IssueRow key={i} issue={issue} />
          ))}
        </div>
      )}

      {/* Red-team */}
      {redteam && redteam.length > 0 && (
        <div className="border-t border-black/5 pt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
            Red-team probes
          </p>
          <div className="flex flex-col divide-y divide-black/5">
            {redteam.map((probe, i) => (
              <RedTeamRow key={i} probe={probe} />
            ))}
          </div>
        </div>
      )}

      {approved && issues.length === 0 && (
        <p className="text-sm text-ok">All checks passed. Agent is ready.</p>
      )}
    </GlassCard>
  );
}
