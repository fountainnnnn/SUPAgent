import express from 'express';
import type { Request, Response } from 'express';
import { createSession, getSession, resolveAnswer, resolveSpec } from './pipeline/session.js';
import { pipelineRunner } from './pipeline/runner.js';
import type { AgentSpec } from '../../shared/types.js';
import type { UploadedDoc } from './pipeline/runner.js';

const router = express.Router();

// ── POST /api/build ──────────────────────────────────────────────────────────
// Body: { docs: UploadedDoc[] }
// Returns: SSE stream of FactoryEvent JSON lines; X-Session-Id header
router.post('/', (req: Request, res: Response): void => {
  const docs: UploadedDoc[] = Array.isArray(req.body?.docs) ? req.body.docs : [];
  console.log(`[build] ${docs.length} docs received:`, docs.map(d => `${d.name} (${d.content ? d.content.length : 0} chars)`));

  const session = createSession();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Session-Id', session.id);
  res.flushHeaders();

  // Wire up the SSE controller so session can track it (not strictly needed for now)
  session.sseController = {
    enqueue: (chunk: string) => res.write(chunk),
    close: () => res.end(),
  };

  const openaiKey = process.env.OPENAI_API_KEY;

  (async () => {
    try {
      for await (const event of pipelineRunner(docs, session.id, openaiKey)) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.write(`data: ${JSON.stringify({ type: 'assistant', text: `Pipeline error: ${message}` })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    } finally {
      res.end();
    }
  })();
});

// ── POST /api/build/answer ───────────────────────────────────────────────────
// Body: { sessionId: string, questionId: string, value: string }
router.post('/answer', (req: Request, res: Response): void => {
  const { sessionId, questionId, value } = req.body ?? {};

  if (!sessionId || !questionId || value === undefined) {
    res.status(400).json({ error: 'sessionId, questionId, and value are required' });
    return;
  }

  const session = getSession(sessionId as string);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const ok = resolveAnswer(sessionId as string, questionId as string, value as string);
  if (!ok) {
    res.status(409).json({ error: 'No pending question with that id' });
    return;
  }

  res.json({ ok: true });
});

// ── POST /api/build/spec ─────────────────────────────────────────────────────
// Body: { sessionId: string, spec: AgentSpec }
router.post('/spec', (req: Request, res: Response): void => {
  const { sessionId, spec } = req.body ?? {};

  if (!sessionId || !spec) {
    res.status(400).json({ error: 'sessionId and spec are required' });
    return;
  }

  const session = getSession(sessionId as string);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const ok = resolveSpec(sessionId as string, spec as AgentSpec);
  if (!ok) {
    res.status(409).json({ error: 'No pending spec edit for this session' });
    return;
  }

  res.json({ ok: true });
});

export default router;
