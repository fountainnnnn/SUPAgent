# Architecture

## The seam: one event stream, two engines

The entire UI is driven by a single typed stream of `FactoryEvent`s (see
`shared/events.ts`). Whatever produces that stream is an **engine**:

- **Demo** — `ScriptedEngine` (client-side), a hardcoded, realistically paced sequence.
- **Real** — `CodexEngine`, which connects to the live build pipeline.

The UI consumes the events identically in both cases, so the **Demo / Real** toggle swaps
the engine without changing a single component.

```ts
interface FactoryEngine {
  run(
    intake: OrgIntake,
    onConfirm: (e: ConfirmEvent) => Promise<boolean>,   // blocking confirm popups
    onSpecEdit: (s: AgentSpec) => Promise<AgentSpec>,    // editable spec review
  ): AsyncIterable<FactoryEvent>;
}
```

Interactive pauses are modeled as callbacks the engine awaits. The store turns each into a
promise that resolves when the user acts (confirm a dialog, approve the spec), then the
engine resumes.

## State management

A single store (`client/src/store.ts`) is a finite state machine: the engine writes via
`apply(event)` and the `request*` callbacks; components subscribe. The UI is a pure
function of this state, which is what makes the engine swap free.

`phase: intake → gap → building → spec_review → review → sandbox → deploy → done`

## Code-level guardrails

Privileged actions are gated in code, never in a prompt, because ticket content is
untrusted input (`server/src/guardrail.ts`, `server/src/send.ts`):

- recipient allow-list, refund hard cap, identity gate before PII.

The sandbox feeds a prompt-injection ticket through these to demonstrate the block.

---

## Real-mode build pipeline (Codex)

The pipeline drives the Codex SDK through fixed, validated stages. Codex supplies the
intelligence (writing code, selecting tools, fixing failures); the pipeline constrains,
validates, and loops. It is not free-form code generation.

| Stage | Codex does | Pipeline enforces |
| --- | --- | --- |
| Intake → Spec | extract a structured `AgentSpec` from the org's inputs | schema validation; every policy needs a source quote that's verified against the inputs |
| Tool selection | map capabilities to registry tools (or typed stubs) | registry whitelist; over-broad actions stripped; send-tools flagged for guardrails |
| Generate | fill a fixed, known-good scaffold per the spec + manifest | read-only scaffold/loop; `tsc` + secret scan; every policy must appear in the generated prompt |
| Self-test / revise | run the auto-generated eval suite, fix failures | evals are immutable and diff-reverted; bounded retries; only the pipeline's own run decides "green" |
| Supervisor review | independent critic checks spec faithfulness + security, then red-teams | hallucinated issues dropped (evidence must verify); red-team tickets executed deterministically; bounded rounds then human escalation |
| Package & deploy | git repo + runbook + `.env` template; start endpoint | secret scan before commit; health check before "live" |

Every stage emits the same `FactoryEvent`s, so a real run renders in the UI exactly like
the demo.

### Reliability stack

Three independent layers guard quality:

1. **Deterministic gates** — type-check, secret scan, read-only path checks, schema validation.
2. **Self-revise loop** — the generator fixes its own eval failures; evals are immutable.
3. **Independent supervisor** — a separate critic that judges and red-teams, routing fixes
   back to the owning stage until approved.

---

## Roadmap (beyond this build)

Live agent dashboard + intervention, versioning/re-train on SOP changes, multi-user
(ops + engineering) collaboration, cost metering, deeper compliance tooling, and grounding
on historical tickets.
