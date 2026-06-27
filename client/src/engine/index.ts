import type { FactoryEngine } from '@shared';
import { ScriptedEngine } from './scripted';
import { CodexEngine } from './codex';

export { ScriptedEngine } from './scripted';
export { CodexEngine } from './codex';

export function getEngine(mode: 'demo' | 'real'): FactoryEngine {
  return mode === 'demo' ? new ScriptedEngine() : new CodexEngine();
}
