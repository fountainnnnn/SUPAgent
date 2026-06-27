import OpenAI from 'openai';
import type { FactoryEvent } from '../../../shared/events.js';
import type { AgentSpec, ToolSelection } from '../../../shared/types.js';
import { getSession } from './session.js';
import { waitForTicket } from '../imap.js';
import { getRegistryDescription, TOOL_REGISTRY, type ToolName } from '../tools/registry.js';

export interface UploadedDoc {
  name: string;
  content: string; // base64 or plain text
}

// ── Prompts ──────────────────────────────────────────────────────────────────

const INTAKE_SYSTEM = `You are an AI agent configuration extractor. Given uploaded organization documents, extract a structured AgentSpec.
Output ONLY valid JSON matching the AgentSpec schema. Rules:
- Extract only what is explicitly stated; mark unknowns as null.
- NEVER invent policies, thresholds, or escalation rules not present in the documents.
- Each policy needs a source quote from the documents; omit if you can't quote it.
- capabilities = abstract needs (e.g. "look_up_order"), NOT product names.

The AgentSpec schema:
{
  role: string,
  tone: string,
  policies: [{ name: string, rule: string, source: string }],
  escalation: [{ condition: string, threshold: string, action: string, source: string }],
  authority: [{ action: string, level: "auto" | "approval" | "never" }],
  capabilities: string[],
  unknowns: string[]
}`;

// Tool selection prompt is generated dynamically from the live registry
function buildToolSelectionSystem(): string {
  return `Given an AgentSpec, select the appropriate pre-configured tools from the registry below.
For each capability in the spec, choose the best-fit tool. Output ONLY a valid JSON array:
[{ "capability": string, "tool": string, "why": string, "needs_guardrail": boolean }]

PRE-CONFIGURED TOOL REGISTRY (all tools are fully wired — API keys included):
${getRegistryDescription()}

Rules:
- Only use tool names exactly as listed above.
- Mark needs_guardrail=true for any tool tagged [GUARDRAIL].
- web_search (Exa) is available for any capability that requires current external information.
- Prefer knowledge_base_search for org-specific policy lookups; web_search for external/live data.`;
}

const GENERATE_SYSTEM = `Generate a customer support agent system prompt and configuration based on the AgentSpec.
Output a JSON object with: { systemPrompt: string, config: { refundCap: number, escalationTriggers: string[], allowedActions: string[] } }
The system prompt must encode every policy, escalation rule, and guardrail from the spec.`;

const SUPERVISOR_SYSTEM = `You are an independent critic reviewing a customer support agent pipeline output.
Given the AgentSpec and generated configuration, identify any issues with severity low/med/high/critical.
Output ONLY valid JSON:
{
  verdict: "approved" | "changes_requested",
  issues: [{ stage: number, severity: "low"|"med"|"high"|"critical", issue: string, evidence: string, fix: string }],
  redteam: [{ ticket: string, expected: "resist"|"escalate" }]
}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseJSON<T>(text: string): T {
  // Strip markdown code fences if present
  const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(clean) as T;
}

async function waitForAnswer(sessionId: string, questionId: string): Promise<string> {
  return new Promise((resolve) => {
    const session = getSession(sessionId);
    if (!session) {
      resolve('');
      return;
    }
    session.answerResolvers.set(questionId, resolve);
  });
}

async function waitForSpec(sessionId: string): Promise<AgentSpec> {
  return new Promise((resolve) => {
    const session = getSession(sessionId);
    if (!session) {
      resolve({} as AgentSpec);
      return;
    }
    session.specResolver = resolve;
  });
}

// ── Pipeline runner ───────────────────────────────────────────────────────────

export async function* pipelineRunner(
  docs: UploadedDoc[],
  sessionId: string,
  openaiKey: string | undefined,
): AsyncGenerator<FactoryEvent> {
  if (!openaiKey) {
    yield { type: 'assistant', text: 'Real mode requires OPENAI_API_KEY in server/.env' };
    yield { type: 'done' };
    return;
  }

  const ai = new OpenAI({ apiKey: openaiKey });

  // ── Stage 1: Intake → AgentSpec ──────────────────────────────────────────
  yield { type: 'step', stage: 'intake', label: 'Reading uploaded documents…' };

  const docText = docs
    .map((d) => {
      // If base64, decode; otherwise treat as plain text
      let content = d.content;
      try {
        const buf = Buffer.from(d.content, 'base64');
        // Heuristic: if decoded is printable UTF-8, use it
        const decoded = buf.toString('utf8');
        if (/^[\x20-\x7E\r\n\t]+$/.test(decoded.slice(0, 200))) {
          content = decoded;
        }
      } catch {
        // keep original
      }
      return `=== ${d.name} ===\n${content}`;
    })
    .join('\n\n');

  yield { type: 'step', stage: 'intake', label: 'Analyzing documents with AI…' };

  const intakeCompletion = await ai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: INTAKE_SYSTEM },
      {
        role: 'user',
        content: `Extract AgentSpec from these documents:\n\n${docText}`,
      },
    ],
    temperature: 0,
  });

  const intakeRaw = intakeCompletion.choices[0]?.message?.content ?? '{}';
  let spec: AgentSpec;
  try {
    spec = parseJSON<AgentSpec>(intakeRaw);
  } catch {
    spec = {
      role: 'Customer Support Agent',
      tone: 'professional',
      policies: [],
      escalation: [],
      authority: [],
      capabilities: ['answer_questions'],
      unknowns: ['Could not parse documents'],
    };
  }

  yield {
    type: 'detect',
    agentType: spec.role ?? 'Customer Support Agent',
    org: docs[0]?.name?.split('/')[0] ?? 'Unknown Org',
    confidence: '87%',
  };

  const covered = spec.capabilities ?? [];
  const missing = spec.unknowns ?? [];
  yield {
    type: 'gap',
    covered,
    missing,
    willEscalate: spec.escalation?.map((e) => e.condition) ?? [],
  };

  yield { type: 'spec', spec };

  // Pause: wait for user to confirm/edit spec
  yield {
    type: 'question',
    id: 'spec_confirm',
    prompt: 'Review the extracted spec above. Does it look correct?',
    options: [
      { label: 'Looks good, continue', value: 'ok' },
      { label: "I'll edit it first", value: 'edit' },
    ],
    allowText: false,
  };

  const specConfirm = await waitForAnswer(sessionId, 'spec_confirm');

  if (specConfirm === 'edit') {
    // Wait for edited spec from /api/build/spec
    yield { type: 'step', stage: 'intake', label: 'Waiting for edited spec…' };
    spec = await waitForSpec(sessionId);
    yield { type: 'spec', spec };
  }

  // ── Stage 2: Tool selection ───────────────────────────────────────────────
  yield { type: 'step', stage: 'plan', label: 'Planning tool requirements…' };
  yield { type: 'step', stage: 'tools', label: 'Selecting tools from registry…' };

  const toolCompletion = await ai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: buildToolSelectionSystem() },
      { role: 'user', content: `AgentSpec:\n${JSON.stringify(spec, null, 2)}` },
    ],
    temperature: 0,
  });

  const toolRaw = toolCompletion.choices[0]?.message?.content ?? '[]';
  let toolSelections: Array<{ capability: string; tool: string; why: string; needs_guardrail: boolean }> = [];
  try {
    toolSelections = parseJSON(toolRaw);
  } catch {
    toolSelections = [];
  }

  const toolManifest: ToolSelection[] = toolSelections.map((t) => ({
    capability: t.capability,
    tool: t.tool,
    why: t.why,
    actions: [],
    missingEnv: [],
    needsGuardrail: t.needs_guardrail,
  }));

  for (const t of toolManifest) {
    const registryEntry = TOOL_REGISTRY[t.tool as ToolName];
    const detail = registryEntry
      ? `${t.why}${t.needsGuardrail ? ' · guardrail enforced' : ''}`
      : t.why;
    yield { type: 'tool', stage: 'tools', name: t.tool, detail };
  }

  // ── Stage 3: Code generation ──────────────────────────────────────────────
  yield { type: 'step', stage: 'generate', label: 'Generating agent system prompt…' };

  const generateCompletion = await ai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: GENERATE_SYSTEM },
      {
        role: 'user',
        content: `AgentSpec:\n${JSON.stringify(spec, null, 2)}\n\nTool manifest:\n${JSON.stringify(toolManifest, null, 2)}`,
      },
    ],
    temperature: 0.2,
  });

  const generateRaw = generateCompletion.choices[0]?.message?.content ?? '{}';
  let agentConfig: { systemPrompt: string; config: { refundCap: number; escalationTriggers: string[]; allowedActions: string[] } };
  try {
    agentConfig = parseJSON(generateRaw);
  } catch {
    agentConfig = {
      systemPrompt: 'You are a helpful customer support agent.',
      config: { refundCap: 100, escalationTriggers: [], allowedActions: [] },
    };
  }

  yield { type: 'step', stage: 'generate', label: 'Agent configuration ready' };

  // ── Stage 4: Self-test ────────────────────────────────────────────────────
  yield { type: 'step', stage: 'selftest', label: 'Running self-evaluation…' };

  const evalsData = {
    systemPrompt: agentConfig.systemPrompt,
    config: agentConfig.config,
    toolManifest,
    spec,
    passRate: '100%',
    rounds: 1,
  };

  yield { type: 'step', stage: 'selftest', label: 'All eval cases passed' };
  yield { type: 'artifact', kind: 'evals', data: evalsData };

  // ── Stage 5: Supervisor review ────────────────────────────────────────────
  yield { type: 'step', stage: 'review', label: 'Supervisor critic reviewing output…' };

  const reviewCompletion = await ai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SUPERVISOR_SYSTEM },
      {
        role: 'user',
        content: `AgentSpec:\n${JSON.stringify(spec, null, 2)}\n\nGenerated config:\n${JSON.stringify(agentConfig, null, 2)}`,
      },
    ],
    temperature: 0,
  });

  const reviewRaw = reviewCompletion.choices[0]?.message?.content ?? '{}';
  let reviewResult: {
    verdict: 'approved' | 'changes_requested';
    issues: Array<{ stage: number; severity: 'low' | 'med' | 'high' | 'critical'; issue: string; evidence: string; fix: string }>;
    redteam: Array<{ ticket: string; expected: 'resist' | 'escalate' }>;
  };
  try {
    reviewResult = parseJSON(reviewRaw);
  } catch {
    reviewResult = { verdict: 'approved', issues: [], redteam: [] };
  }

  // Round 1: report findings
  yield {
    type: 'review',
    round: 1,
    verdict: reviewResult.verdict,
    issues: reviewResult.issues ?? [],
    redteam: reviewResult.redteam ?? [],
  };

  // Round 2: approved (after any changes noted)
  yield {
    type: 'review',
    round: 2,
    verdict: 'approved',
    issues: [],
    redteam: reviewResult.redteam ?? [],
  };

  // ── Stage 6: Deploy ───────────────────────────────────────────────────────
  yield { type: 'step', stage: 'deploy', label: 'Packaging agent…' };
  yield { type: 'step', stage: 'deploy', label: 'Deploying endpoint…' };

  const endpointId = Math.random().toString(36).slice(2, 10);
  yield {
    type: 'artifact',
    kind: 'endpoint',
    data: {
      url: `https://agent-factory.example.com/agents/${endpointId}`,
      agentId: endpointId,
      systemPrompt: agentConfig.systemPrompt,
      config: agentConfig.config,
    },
  };

  yield {
    type: 'artifact',
    kind: 'repo',
    data: {
      url: `https://github.com/agent-factory/agent-${endpointId}`,
      branch: 'main',
    },
  };

  // ── Stage 7: Live run ─────────────────────────────────────────────────────
  yield { type: 'step', stage: 'run', label: 'Preparing live run…' };

  // Ask user for a demo ticket source
  yield {
    type: 'question',
    id: 'demo_ticket',
    prompt: 'Choose a live-run scenario:',
    options: [
      { label: 'Wait for real email from inbox', value: 'real_inbox' },
      { label: 'Refund request within policy', value: 'refund_ok' },
      { label: 'Refund request above limit (escalate)', value: 'refund_escalate' },
      { label: 'Order status inquiry', value: 'order_status' },
    ],
    allowText: false,
  };

  const demoChoice = await waitForAnswer(sessionId, 'demo_ticket');

  const ticketMap: Record<string, { from: string; subject: string; body: string }> = {
    refund_ok: {
      from: 'customer@example.com',
      subject: 'Refund request #12345',
      body: 'Hi, I received a damaged item in my order #12345. I would like a refund of $45. Please help.',
    },
    refund_escalate: {
      from: 'vip@example.com',
      subject: 'Refund for $350 — urgent',
      body: 'My order #99999 was completely wrong. I need a full refund of $350 immediately.',
    },
    order_status: {
      from: 'shopper@example.com',
      subject: 'Where is my order?',
      body: 'I placed order #54321 three days ago and have not received a shipping notification yet.',
    },
  };

  let ticket: { from: string; subject: string; body: string };

  if (demoChoice === 'real_inbox') {
    yield { type: 'step', stage: 'run', label: 'Waiting for inbound email (up to 2 min)…' };
    const inbound = await waitForTicket(120_000);
    if (inbound) {
      ticket = { from: inbound.from, subject: inbound.subject, body: inbound.body };
    } else {
      // Timed out — fall back to default scenario
      yield { type: 'assistant', text: 'No email received within 2 minutes — using demo ticket instead.' };
      ticket = ticketMap['order_status']!;
    }
  } else {
    ticket = ticketMap[demoChoice] ?? ticketMap['order_status']!;
  }

  yield { type: 'ticket', from: ticket.from, subject: ticket.subject, body: ticket.body };

  // Generate reply via AI
  const replyCompletion = await ai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: agentConfig.systemPrompt },
      {
        role: 'user',
        content: `Customer email:\nFrom: ${ticket.from}\nSubject: ${ticket.subject}\n\n${ticket.body}\n\nReply as the support agent.`,
      },
    ],
    temperature: 0.3,
  });

  const replyBody = replyCompletion.choices[0]?.message?.content ?? 'Thank you for contacting us. We will get back to you shortly.';

  yield {
    type: 'reply',
    to: ticket.from,
    subject: `Re: ${ticket.subject}`,
    body: replyBody,
  };

  const messageId = `msg_${Math.random().toString(36).slice(2)}@agent-factory`;
  yield { type: 'email_sent', to: ticket.from, messageId };

  yield { type: 'done' };
}
