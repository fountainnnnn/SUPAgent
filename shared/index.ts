// ── Frozen contract barrel + the engine interface (the seam) ──

export * from './types';
export * from './events';

import type { FactoryEvent, ConfirmEvent } from './events';
import type { OrgIntake, AgentSpec } from './types';

/**
 * The single seam between UI and engine.
 * - Demo mode: ScriptedEngine (client-side, hardcoded sequence).
 * - Real mode: CodexEngine (subscribes to /api/build SSE).
 * The UI consumes the yielded events identically in both modes.
 *
 * Interactive pauses are modeled as callbacks the engine awaits:
 *  - onConfirm  -> resolves true/false (the confirm modal)
 *  - onSpecEdit -> resolves the (possibly edited) AgentSpec (the spec-review step)
 */
export interface FactoryEngine {
  run(
    intake: OrgIntake,
    onConfirm: (e: ConfirmEvent) => Promise<boolean>,
    onSpecEdit: (s: AgentSpec) => Promise<AgentSpec>,
  ): AsyncIterable<FactoryEvent>;
}
