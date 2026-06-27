import type { AgentSpec } from '../../../shared/types.js';

export interface Session {
  id: string;
  answerResolvers: Map<string, (value: string) => void>;
  specResolver: ((spec: AgentSpec) => void) | null;
  sseController: {
    enqueue: (chunk: string) => void;
    close: () => void;
  } | null;
}

const sessions = new Map<string, Session>();

export function createSession(): Session {
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const session: Session = {
    id,
    answerResolvers: new Map(),
    specResolver: null,
    sseController: null,
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function resolveAnswer(sessionId: string, questionId: string, value: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  const resolver = session.answerResolvers.get(questionId);
  if (!resolver) return false;
  session.answerResolvers.delete(questionId);
  resolver(value);
  return true;
}

export function resolveSpec(sessionId: string, spec: AgentSpec): boolean {
  const session = sessions.get(sessionId);
  if (!session || !session.specResolver) return false;
  const resolver = session.specResolver;
  session.specResolver = null;
  resolver(spec);
  return true;
}

export function deleteSession(id: string): void {
  sessions.delete(id);
}
