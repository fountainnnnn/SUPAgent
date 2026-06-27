// ── Frozen contract barrel + the engine interface (the seam) ──

export * from './types';
export * from './events';

import type { FactoryEvent, QuestionEvent } from './events';
import type { AgentSpec } from './types';

/** A document the user uploaded to start a build. */
export interface UploadedDoc {
  name: string;
  sizeKb?: number;
  /** Base64-encoded file content (populated for Real mode uploads). */
  content?: string;
}

/**
 * The single seam between UI and engine.
 * - Demo mode: ScriptedEngine (client-side, hardcoded sequence).
 * - Real mode: CodexEngine (subscribes to /api/build SSE).
 * The UI consumes the yielded events identically in both modes.
 *
 * The flow is document-driven: the user uploads documents, the engine detects the
 * agent type and infers configuration, asking inline follow-up questions as needed.
 *
 * Interactive pauses are modeled as callbacks the engine awaits:
 *  - onAnswer   -> resolves the chosen value of an inline question (confirms use
 *                  options yes/no; gap-fills use the provided options or free text)
 *  - onSpecEdit -> resolves the (possibly edited) AgentSpec (the inline spec review)
 */
export interface FactoryEngine {
  run(
    docs: UploadedDoc[],
    onAnswer: (q: QuestionEvent) => Promise<string>,
    onSpecEdit: (s: AgentSpec) => Promise<AgentSpec>,
  ): AsyncIterable<FactoryEvent>;
}
