import { create } from 'zustand';
import type {
  AgentSpec,
  ConfirmEvent,
  FactoryEvent,
  OrgIntake,
  Reply,
  Stage,
} from '@shared';

// The whole experience is a finite state machine driven by the engine's event
// stream. Components subscribe; the engine writes via apply() and the request*()
// helpers. The UI is a pure function of this state, which is what makes the
// Demo/Real engine swap touch zero UI code.

export type Mode = 'demo' | 'real';

export type AppPhase =
  | 'intake'
  | 'gap'
  | 'building'
  | 'spec_review'
  | 'review'
  | 'sandbox'
  | 'deploy'
  | 'done';

export interface PendingConfirm {
  event: ConfirmEvent;
  resolve: (ok: boolean) => void;
}
export interface PendingSpec {
  spec: AgentSpec;
  resolve: (s: AgentSpec) => void;
}

export interface DeployInfo {
  url: string;
  repoUrl?: string;
}
export interface EmailInfo {
  to: string;
  subject?: string;
  body?: string;
  messageId?: string;
  status: 'sending' | 'sent' | 'failed';
}

export interface AppState {
  mode: Mode;
  phase: AppPhase;
  running: boolean;

  intake: OrgIntake | null;
  spec: AgentSpec | null;

  events: FactoryEvent[];
  activeStage: Stage | null;

  pending: { confirm?: PendingConfirm; specEdit?: PendingSpec } | null;

  deploy: DeployInfo | null;
  email: EmailInfo | null;

  // ---- setters / lifecycle ----
  setMode: (m: Mode) => void;
  setIntake: (i: OrgIntake) => void;
  setRunning: (r: boolean) => void;
  reset: () => void;

  // ---- engine -> store ----
  apply: (e: FactoryEvent) => void;

  // ---- interactive callbacks passed to engine.run(...) ----
  requestConfirm: (e: ConfirmEvent) => Promise<boolean>;
  requestSpecEdit: (s: AgentSpec) => Promise<AgentSpec>;

  // ---- UI -> store (resolve a pending interaction) ----
  resolveConfirm: (ok: boolean) => void;
  resolveSpecEdit: (s: AgentSpec) => void;
}

const BUILD_STAGES: Stage[] = ['intake', 'plan', 'tools', 'generate', 'selftest'];

function phaseForEvent(e: FactoryEvent, prev: AppPhase): AppPhase {
  switch (e.type) {
    case 'gap':
      return 'gap';
    case 'step':
    case 'tool':
      return BUILD_STAGES.includes((e as { stage: Stage }).stage) ? 'building' : prev;
    case 'review':
      return 'review';
    case 'sandbox':
      return 'sandbox';
    case 'artifact':
      return e.kind === 'endpoint' || e.kind === 'repo' ? 'deploy' : prev;
    case 'done':
      return 'done';
    default:
      return prev;
  }
}

export const useStore = create<AppState>((set, get) => ({
  mode: 'demo',
  phase: 'intake',
  running: false,

  intake: null,
  spec: null,

  events: [],
  activeStage: null,

  pending: null,

  deploy: null,
  email: null,

  setMode: (m) => set({ mode: m }),
  setIntake: (i) => set({ intake: i }),
  setRunning: (r) => set({ running: r }),

  reset: () =>
    set({
      phase: 'intake',
      running: false,
      spec: null,
      events: [],
      activeStage: null,
      pending: null,
      deploy: null,
      email: null,
    }),

  apply: (e) =>
    set((s) => {
      const next: Partial<AppState> = {
        events: [...s.events, e],
        phase: phaseForEvent(e, s.phase),
      };
      if (e.type === 'step' || e.type === 'tool') next.activeStage = e.stage;
      if (e.type === 'spec') next.spec = e.spec;
      if (e.type === 'artifact' && e.kind === 'endpoint') {
        next.deploy = { ...(s.deploy ?? { url: '' }), ...(e.data as DeployInfo) };
      }
      if (e.type === 'artifact' && e.kind === 'repo') {
        next.deploy = { url: s.deploy?.url ?? '', ...(e.data as Partial<DeployInfo>) };
      }
      if (e.type === 'reply') {
        const r = e as Reply & { type: 'reply' };
        next.email = { to: r.to, subject: r.subject, body: r.body, status: 'sending' };
      }
      if (e.type === 'email_sent') {
        next.email = { ...(s.email ?? { to: e.to, status: 'sending' }), to: e.to, messageId: e.messageId, status: 'sent' };
      }
      return next;
    }),

  requestConfirm: (event) =>
    new Promise<boolean>((resolve) => {
      set((s) => ({
        events: [...s.events, event],
        pending: { ...(s.pending ?? {}), confirm: { event, resolve } },
      }));
    }),

  requestSpecEdit: (spec) =>
    new Promise<AgentSpec>((resolve) => {
      set((s) => ({
        spec,
        phase: 'spec_review',
        events: [...s.events, { type: 'spec', spec }],
        pending: { ...(s.pending ?? {}), specEdit: { spec, resolve } },
      }));
    }),

  resolveConfirm: (ok) => {
    const p = get().pending?.confirm;
    if (!p) return;
    p.resolve(ok);
    set((s) => ({ pending: s.pending ? { ...s.pending, confirm: undefined } : null }));
  },

  resolveSpecEdit: (edited) => {
    const p = get().pending?.specEdit;
    if (!p) return;
    p.resolve(edited);
    set((s) => ({
      spec: edited,
      pending: s.pending ? { ...s.pending, specEdit: undefined } : null,
    }));
  },
}));
