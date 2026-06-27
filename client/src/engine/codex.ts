import type {
  FactoryEngine,
  FactoryEvent,
  AgentSpec,
  UploadedDoc,
  QuestionEvent,
} from '@shared';

// ─── SSE line parser ──────────────────────────────────────────────────────────

/**
 * Reads an SSE stream line-by-line and yields the `data:` payloads.
 * Skips comment lines, blank lines, and non-data fields.
 */
async function* sseDataLines(reader: ReadableStreamDefaultReader<string>): AsyncGenerator<string> {
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += value;

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
      const rawLine = buffer.slice(0, newlineIdx).replace(/\r$/, '');
      buffer = buffer.slice(newlineIdx + 1);

      if (rawLine.startsWith('data:')) {
        const payload = rawLine.slice(5).trimStart();
        if (payload) yield payload;
      }
      // comment lines (': ...') and other fields (event:, id:, retry:) are ignored
    }
  }

  // flush any remaining data in buffer
  if (buffer.startsWith('data:')) {
    const payload = buffer.slice(5).trimStart();
    if (payload) yield payload;
  }
}

// ─── CodexEngine ─────────────────────────────────────────────────────────────

export class CodexEngine implements FactoryEngine {
  async *run(
    docs: UploadedDoc[],
    onAnswer: (q: QuestionEvent) => Promise<string>,
    onSpecEdit: (s: AgentSpec) => Promise<AgentSpec>,
  ): AsyncIterable<FactoryEvent> {
    // ── Initiate build session ────────────────────────────────────────────────
    let response: Response;
    try {
      response = await fetch('/api/build', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
        body: JSON.stringify({ docs }),
      });
    } catch (err) {
      throw new Error(`Failed to connect to /api/build: ${String(err)}`);
    }

    // ── 501: server not wired yet ─────────────────────────────────────────────
    if (response.status === 501) {
      yield {
        type: 'assistant',
        text: 'Real mode requires an OpenAI API key. Set OPENAI_API_KEY in server/.env and restart.',
      };
      yield { type: 'done' };
      return;
    }

    // ── Other non-2xx ─────────────────────────────────────────────────────────
    if (!response.ok) {
      let detail = '';
      try {
        detail = await response.text();
      } catch { /* ignore */ }
      throw new Error(`/api/build returned ${response.status}${detail ? `: ${detail}` : ''}`);
    }

    // ── Extract session ID ────────────────────────────────────────────────────
    const sessionId = response.headers.get('X-Session-Id') ?? '';

    // ── Set up text decoder for the SSE body ──────────────────────────────────
    if (!response.body) {
      throw new Error('/api/build response has no body');
    }

    const textReader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader();

    // ── Consume SSE stream ────────────────────────────────────────────────────
    for await (const dataPayload of sseDataLines(textReader)) {
      let event: FactoryEvent;
      try {
        event = JSON.parse(dataPayload) as FactoryEvent;
      } catch {
        throw new Error(`Received malformed SSE data line: ${dataPayload}`);
      }

      // ── Interactive pause: question ───────────────────────────────────────
      if (event.type === 'question') {
        yield event;

        const answer = await onAnswer(event);

        await fetch('/api/build/answer', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, questionId: event.id, value: answer }),
        }).catch((err: unknown) => {
          throw new Error(`Failed to POST answer: ${String(err)}`);
        });

        continue;
      }

      // ── Interactive pause: spec ───────────────────────────────────────────
      if (event.type === 'spec') {
        yield event;

        const editedSpec = await onSpecEdit(event.spec);

        await fetch('/api/build/spec', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, spec: editedSpec }),
        }).catch((err: unknown) => {
          throw new Error(`Failed to POST spec: ${String(err)}`);
        });

        continue;
      }

      // ── Terminal event ────────────────────────────────────────────────────
      if (event.type === 'done') {
        yield event;
        return;
      }

      // ── All other events — pass straight through ──────────────────────────
      yield event;
    }

    // Stream ended without a `done` event — emit one defensively
    yield { type: 'done' };
  }
}
