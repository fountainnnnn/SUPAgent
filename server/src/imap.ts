import { ImapFlow } from 'imapflow';
import { EventEmitter } from 'events';
import express from 'express';

export interface InboundEmail {
  uid: number;
  from: string;
  subject: string;
  body: string;
  receivedAt: string;
}

// Shared event bus — pipeline/runner.ts can listen to 'ticket' events
export const inboxBus = new EventEmitter();

let latestTicket: InboundEmail | null = null;

function getConfig() {
  return {
    host: process.env.EMAIL_IMAP_HOST ?? '127.0.0.1',
    port: Number(process.env.EMAIL_IMAP_PORT ?? 1143),
    secure: process.env.EMAIL_IMAP_SECURE === 'true',
    user: process.env.EMAIL_IMAP_USER ?? '',
    pass: process.env.EMAIL_IMAP_PASSWORD ?? '',
    pollSeconds: Number(process.env.EMAIL_POLL_SECONDS ?? 20),
  };
}

async function fetchUnseen(): Promise<InboundEmail[]> {
  const { host, port, secure, user, pass } = getConfig();
  if (!user || !pass) return [];

  const client = new ImapFlow({
    host,
    port,
    secure,
    auth: { user, pass },
    logger: false,
    tls: { rejectUnauthorized: false }, // Bridge uses self-signed cert on localhost
  });

  const found: InboundEmail[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      for await (const msg of client.fetch('1:*', {
        uid: true,
        envelope: true,
        bodyStructure: true,
        source: true,
      })) {
        // Only unseen messages
        if (msg.flags?.has('\\Seen')) continue;

        const from =
          msg.envelope?.from?.[0]
            ? `${msg.envelope.from[0].name ?? ''} <${msg.envelope.from[0].address ?? ''}>`.trim()
            : 'unknown';

        const subject = msg.envelope?.subject ?? '(no subject)';

        // Extract plain-text body from raw source
        const raw = msg.source?.toString('utf8') ?? '';
        const bodyStart = raw.indexOf('\r\n\r\n');
        const body = bodyStart >= 0 ? raw.slice(bodyStart + 4).trim() : raw.trim();

        const ticket: InboundEmail = {
          uid: msg.uid,
          from,
          subject,
          body: body.slice(0, 2000), // cap length
          receivedAt: msg.envelope?.date?.toISOString() ?? new Date().toISOString(),
        };

        found.push(ticket);

        // Mark as seen so we don't re-process
        await client.messageFlagsAdd({ uid: msg.uid }, ['\\Seen']);
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    console.error('[imap] fetch error:', err);
  }

  return found;
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

export function startImapPoller() {
  const { user, pollSeconds } = getConfig();
  if (!user) {
    console.log('[imap] no credentials — poller not started');
    return;
  }

  console.log(`[imap] polling ${user} every ${pollSeconds}s`);

  async function poll() {
    const emails = await fetchUnseen();
    for (const email of emails) {
      console.log(`[imap] new ticket from ${email.from}: ${email.subject}`);
      latestTicket = email;
      inboxBus.emit('ticket', email);
    }
  }

  // Run immediately on start
  poll();
  pollTimer = setInterval(poll, pollSeconds * 1000);
}

export function stopImapPoller() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

/** Resolves when the next unseen email arrives (or times out). */
export function waitForTicket(timeoutMs = 120_000): Promise<InboundEmail | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      inboxBus.off('ticket', handler);
      resolve(null);
    }, timeoutMs);

    function handler(email: InboundEmail) {
      clearTimeout(timer);
      resolve(email);
    }

    inboxBus.once('ticket', handler);
  });
}

// ─── Express router ──────────────────────────────────────────────────────────

const router = express.Router();

/** GET /api/inbox/latest — returns the most recently received unseen email. */
router.get('/latest', (_req, res) => {
  if (!latestTicket) {
    res.json({ ok: false, ticket: null });
    return;
  }
  res.json({ ok: true, ticket: latestTicket });
});

/** GET /api/inbox/stream — SSE stream; pushes each new inbound email as a JSON event. */
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  function send(email: InboundEmail) {
    res.write(`data: ${JSON.stringify(email)}\n\n`);
  }

  inboxBus.on('ticket', send);
  req.on('close', () => inboxBus.off('ticket', send));
});

/** POST /api/inbox/simulate — inject a fake ticket (useful for demo without sending a real email). */
router.post('/simulate', (req, res) => {
  const { from, subject, body } = req.body as { from?: string; subject?: string; body?: string };
  const ticket: InboundEmail = {
    uid: Date.now(),
    from: from ?? 'demo@example.com',
    subject: subject ?? 'Test ticket',
    body: body ?? 'Hello, I need help with my order.',
    receivedAt: new Date().toISOString(),
  };
  latestTicket = ticket;
  inboxBus.emit('ticket', ticket);
  res.json({ ok: true, ticket });
});

export default router;
