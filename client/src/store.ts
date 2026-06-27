import { create } from 'zustand';
import type {
  AgentSpec,
  FactoryEvent,
  QuestionEvent,
  Reply,
  Stage,
  UploadedDoc,
} from '@shared';

// The whole experience is a finite state machine driven by the engine's event
// stream. Components subscribe; the engine writes via apply() and the request*()
// helpers. The UI is a pure function of this state, which is what makes the
// Demo/Real engine swap touch zero UI code.

export type Mode = 'demo' | 'real';

export type AppPhase =
  | 'upload'
  | 'building'
  | 'gap'
  | 'spec_review'
  | 'review'
  | 'sandbox'
  | 'deploy'
  | 'done';

export interface PendingQuestion {
  event: QuestionEvent;
  resolve: (value: string) => void;
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

  docs: UploadedDoc[];
  spec: AgentSpec | null;

  events: FactoryEvent[];
  activeStage: Stage | null;

  pending: { question?: PendingQuestion; specEdit?: PendingSpec } | null;
  answers: Record<string, string>;

  deploy: DeployInfo | null;
  email: EmailInfo | null;

  // ---- setters / lifecycle ----
  setMode: (m: Mode) => void;
  setDocs: (d: UploadedDoc[]) => void;
  setRunning: (r: boolean) => void;
  reset: () => void;

  // ---- engine -> store ----
  apply: (e: FactoryEvent) => void;

  // ---- interactive callbacks passed to engine.run(...) ----
  requestAnswer: (q: QuestionEvent) => Promise<string>;
  requestSpecEdit: (s: AgentSpec) => Promise<AgentSpec>;

  // ---- UI -> store (resolve a pending interaction) ----
  resolveAnswer: (value: string) => void;
  resolveSpecEdit: (s: AgentSpec) => void;
}

const BUILD_STAGES: Stage[] = ['intake', 'plan', 'tools', 'generate', 'selftest'];

function phaseForEvent(e: FactoryEvent, prev: AppPhase): AppPhase {
  switch (e.type) {
    case 'detect':
      return 'building';
    case 'gap':
      return 'gap';
    case 'step':
    case 'tool':
      return BUILD_STAGES.includes(e.stage) ? 'building' : prev;
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
  phase: 'upload',
  running: false,

  docs: [],
  spec: null,

  events: [],
  activeStage: null,

  pending: null,
  answers: {},

  deploy: null,
  email: null,

  setMode: (m) => set({ mode: m }),
  setDocs: (d) => set({ docs: d }),
  setRunning: (r) => set({ running: r }),

  reset: () =>
    set({
      phase: 'upload',
      running: false,
      docs: [],
      spec: null,
      events: [],
      activeStage: null,
      pending: null,
      answers: {},
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
        next.email = {
          ...(s.email ?? { to: e.to, status: 'sending' }),
          to: e.to,
          messageId: e.messageId,
          status: 'sent',
        };
      }
      return next;
    }),

  requestAnswer: (event) =>
    new Promise<string>((resolve) => {
      set((s) => ({
        events: [...s.events, event],
        pending: { ...(s.pending ?? {}), question: { event, resolve } },
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

  resolveAnswer: (value) => {
    const p = get().pending?.question;
    if (!p) return;
    p.resolve(value);
    set((s) => ({
      answers: { ...s.answers, [p.event.id]: value },
      pending: s.pending ? { ...s.pending, question: undefined } : null,
    }));
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
