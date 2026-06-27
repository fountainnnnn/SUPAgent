import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// P0 minimal boot. Subagent D adds: /api/send (real SMTP), /api/guardrail-check
// (caps + allow-list + identity gate), and /api/build (Phase-2 SSE stub).

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'agent-factory-server' });
});

const PORT = Number(process.env.PORT ?? 8787);
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
