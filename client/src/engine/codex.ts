import type {
  FactoryEngine,
  FactoryEvent,
  AgentSpec,
  UploadedDoc,
  QuestionEvent,
} from '@shared';

/**
 * Phase-2 placeholder.
 * In Phase 2 this engine will subscribe to /api/build SSE and relay real
 * pipeline events. For now it yields a single explanatory message then done.
 */
export class CodexEngine implements FactoryEngine {
  async *run(
    _docs: UploadedDoc[],
    _onAnswer: (q: QuestionEvent) => Promise<string>,
    _onSpecEdit: (s: AgentSpec) => Promise<AgentSpec>,
  ): AsyncIterable<FactoryEvent> {
    yield {
      type: 'assistant',
      text: 'The real Codex pipeline connects here in Phase 2. It will stream live build events from /api/build via SSE, replacing this placeholder.',
    };

    yield { type: 'done' };
  }
}
