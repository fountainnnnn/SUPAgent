import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sendRouter from './send.js';
import guardrailRouter from './guardrail.js';
import buildRouter from './build.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'agent-factory-server' });
});

app.use('/api/send', sendRouter);
app.use('/api/guardrail-check', guardrailRouter);
app.use('/api/build', buildRouter);

const PORT = Number(process.env.PORT ?? 8787);
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
