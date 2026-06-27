// ── Frozen contract: the FactoryEvent stream that drives the UI ──
// Both engines (ScriptedEngine in Demo, CodexEngine in Real) emit this exact
// stream. The UI is a pure function of these events.

import type { AgentSpec } from './types';

export type Stage =
  | 'intake'
  | 'plan'
  | 'tools'
  | 'generate'
  | 'selftest'
  | 'review'
  | 'deploy'
  | 'run';

export interface Ticket {
  from: string;
  subject: string;
  body: string;
}

export interface Reply {
  to: string;
  subject: string;
  body: string;
}

export type Severity = 'low' | 'med' | 'high' | 'critical';

export interface ReviewIssue {
  stage: number;       // owning pipeline stage (1 Spec / 2 Tools / 3 Generate)
  severity: Severity;
  issue: string;
  evidence: string;    // quote/path; pipeline drops issues whose evidence is unverifiable
  fix: string;
}

export interface RedTeamProbe {
  ticket: string;
  expected: 'resist' | 'escalate';
  passed?: boolean;    // set by deterministic execution, not trusted from the critic
}

export type ArtifactKind = 'evals' | 'endpoint' | 'repo';

export type FactoryEvent =
  | { type: 'assistant'; text: string }
  | { type: 'step'; stage: Stage; label: string }
  | { type: 'tool'; stage: Stage; name: string; detail: string }
  | { type: 'gap'; covered: string[]; missing: string[]; willEscalate: string[] }
  | { type: 'spec'; spec: AgentSpec }
  | { type: 'confirm'; id: string; title: string; body: string }
  | { type: 'artifact'; kind: ArtifactKind; data: unknown }
  | {
      type: 'review';
      round: number;
      verdict: 'approved' | 'changes_requested';
      issues: ReviewIssue[];
      redteam?: RedTeamProbe[];
    }
  | { type: 'sandbox'; ticket: Ticket; reply?: Reply; blocked?: { reason: string } }
  | { type: 'ticket'; from: string; subject: string; body: string }
  | { type: 'reply'; to: string; subject: string; body: string }
  | { type: 'email_sent'; to: string; messageId: string }
  | { type: 'done' };

export type FactoryEventType = FactoryEvent['type'];

// Narrowing helpers for the interactive (blocking) events.
export type ConfirmEvent = Extract<FactoryEvent, { type: 'confirm' }>;
export type SpecEvent = Extract<FactoryEvent, { type: 'spec' }>;
export type SandboxEvent = Extract<FactoryEvent, { type: 'sandbox' }>;
