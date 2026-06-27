# Agent Factory

Turn how a team already works into a deployed, owned support agent.

Agent Factory takes an organization's real inputs — brand voice, knowledge, connected
systems, SOP, escalation rules, and compliance constraints — and builds a custom
customer-support agent for them. It hosts the agent as a live API **and** hands over the
owned code repository, so there's no platform lock-in.

The build is driven through a fixed, opinionated, self-revising pipeline with an
independent supervisor that reviews and red-teams the result before anything ships.

---

## What you see in the demo

One continuous flow:

1. **Guided intake** — a wizard collects brand, knowledge (policies *with numbers*),
   connected systems, the SOP + escalation matrix + an action-authority table, and
   compliance/ops constraints.
2. **Gap report** — what's covered, what's missing, and what the agent will escalate.
   Nothing is silently guessed.
3. **Build stream** — the factory works out loud: verbose tool-call steps grouped by
   stage (Intake → Plan → Tools → Generate → Self-test).
4. **Spec review** — the inferred agent spec, fully editable before generation.
5. **Risk confirmations** — blocking prompts for the decisions that matter (email-send
   permission, refund auto-cap, deploy).
6. **Supervisor review** — an independent critic evaluates the agent, red-teams it, and
   sends fixes back until it's approved.
7. **Sandbox** — test on a real ticket; a malicious "refund me \$5000 / ignore your
   instructions" ticket is **blocked by code-level guardrails**, not prompt text.
8. **Deploy** — a live endpoint plus the downloadable owned repo + runbook.
9. **Payoff** — the agent drafts a reply and sends a **real email**.

A **Demo / Real** toggle in the top bar selects the build engine. Demo mode runs a
scripted build (no model calls); Real mode connects the live pipeline. The email send and
the guardrail checks are real in both modes.

---

## Quick start

Requires Node 18+ (developed on Node 22).

```bash
npm install
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:8787

`npm run dev` runs the client (Vite) and the API (Express) together.

### Enable real email (for the payoff)

Copy the env template and fill it in:

```bash
cp server/.env.example server/.env
```

| Variable | Purpose |
| --- | --- |
| `GMAIL_USER` | Sending account (app password required; IMAP/SMTP enabled) |
| `GMAIL_APP_PASSWORD` | Gmail app password (not the account password) |
| `ALLOWED_RECIPIENTS` | Comma-separated allow-list; sends to anyone else are rejected |
| `REFUND_CAP` | Refunds at/above this require human approval (default 100) |
| `DEMO_RECIPIENT` | Optional; where the payoff email goes (defaults to `GMAIL_USER`) |

Without credentials the send degrades gracefully (the flow still completes) — so the demo
never breaks on a missing key.

---

## Guardrails (enforced in code, not prompts)

A support ticket is untrusted input, so privileged actions are gated in code:

- **Recipient allow-list** — `/api/send` rejects any non-allow-listed recipient.
- **Action hard caps** — refunds at/above `REFUND_CAP` are escalated regardless of what a
  ticket "instructs."
- **Identity gate** — data-lookup actions require a verified customer before returning PII.

These are exercised live by the sandbox's malicious-ticket test.

---

## Project structure

```
client/   Vite + React + TypeScript + Tailwind UI
  src/components   presentational components (wizard, stream, cards, modals)
  src/engine       ScriptedEngine (demo) + getEngine(mode)
  src/content      sample organization, tickets, inferred spec
  src/store.ts     state machine (the UI is a pure function of engine events)
server/   Express + TypeScript API
  src/send.ts        real SMTP send + allow-list
  src/guardrail.ts   code-level guardrail checks
  src/build.ts       real-mode pipeline endpoint
shared/   Frozen TypeScript contracts shared by client and server
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the engine seam and the build pipeline.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Run client + API together |
| `npm run build` | Type-check and bundle the client |
| `npm run typecheck` | Type-check client and server |
