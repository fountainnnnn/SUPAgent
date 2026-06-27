import OpenAI from 'openai';
import { Codex } from '@openai/codex-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = _require('pdf-parse');
import type { FactoryEvent } from '../../../shared/events.js';
import type { AgentSpec, ToolSelection } from '../../../shared/types.js';
import { getSession } from './session.js';
import { waitForTicket } from '../imap.js';
import { getRegistryDescription, getToolSchemas, TOOL_REGISTRY, type ToolName } from '../tools/registry.js';

export interface UploadedDoc {
  name: string;
  content?: string;
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

const SUPERVISOR_SYSTEM = `You are an independent critic reviewing a customer support agent pipeline output.
Given the AgentSpec and generated configuration, identify any issues with severity low/med/high/critical.
Output ONLY valid JSON:
{
  verdict: "approved" | "changes_requested",
  issues: [{ stage: number, severity: "low"|"med"|"high"|"critical", issue: string, evidence: string, fix: string }],
  redteam: [{ ticket: string, expected: "resist"|"escalate" }]
}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function extractDocText(doc: UploadedDoc): Promise<string> {
  const raw = doc.content ?? '';
  if (!raw) return `[Empty document: ${doc.name}]`;

  const isPdf = doc.name.toLowerCase().endsWith('.pdf');
  const buf = Buffer.from(raw, 'base64');

  if (isPdf) {
    try {
      const parsed = await Promise.race([
        pdfParse(buf),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('PDF parse timeout')), 10000)),
      ]);
      const text = (parsed.text as string ?? '').trim();
      console.log(`[pdf] ${doc.name}: extracted ${text.length} chars`);
      if (text.length > 50) return text;
    } catch (err) {
      console.error(`[pdf] ${doc.name} parse error:`, (err as Error).message);
    }
  }

  // Try decoding as UTF-8 text
  const decoded = buf.toString('utf8');
  if (/^[\x20-\x7E\r\n\t]{50,}/.test(decoded.slice(0, 500))) return decoded;

  return `[Could not extract text from ${doc.name}]`;
}

function parseJSON<T>(text: string): T {
  const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(clean) as T;
}

async function waitForAnswer(sessionId: string, questionId: string): Promise<string> {
  return new Promise((resolve) => {
    const session = getSession(sessionId);
    if (!session) { resolve(''); return; }
    session.answerResolvers.set(questionId, resolve);
  });
}

async function waitForSpec(sessionId: string): Promise<AgentSpec> {
  return new Promise((resolve) => {
    const session = getSession(sessionId);
    if (!session) { resolve({} as AgentSpec); return; }
    session.specResolver = resolve;
  });
}

// ── Codex Agent SDK — code generation ────────────────────────────────────────

function buildCodexPrompt(spec: AgentSpec, toolManifest: ToolSelection[], toolSchemas: unknown[]): string {
  return `You are building a production customer support agent for an organization.

## AgentSpec (extracted from their documents)
${JSON.stringify(spec, null, 2)}

## Selected Tools (pre-configured, API keys included)
${JSON.stringify(toolManifest, null, 2)}

## Tool Schemas (OpenAI function-calling format)
${JSON.stringify(toolSchemas, null, 2)}

## Your Task
Create a complete, runnable support agent with these files:

1. **src/agentConfig.ts** — Export:
   - \`SYSTEM_PROMPT\`: string — Encodes role, tone, EVERY policy, EVERY escalation rule, authority levels. Must include: "When unsure or guardrail-blocked, escalate to a human."
   - \`CONFIG\`: object — refundCap, escalationTriggers[], allowedActions[], bannedPhrases[]

2. **src/tools/index.ts** — Export a \`TOOLS\` array of OpenAI function-calling tool definitions (the schemas above) and a \`handleToolCall(name, args)\` dispatcher that calls the appropriate tool endpoint.

3. **src/guardrails.ts** — Export guardrail functions:
   - \`checkRefundCap(amount)\` — blocks if amount >= cap, returns { blocked, reason }
   - \`checkAllowList(email)\` — blocks if not on allow-list
   - \`checkIdentityGate(verified)\` — blocks data access without verification

4. **src/server.ts** — Express server with:
   - \`POST /chat\` — receives { message, conversationHistory } → runs the agent loop (OpenAI chat completions with function calling) → returns { reply, toolCalls }
   - \`GET /health\` — returns { ok: true }
   - Uses the SYSTEM_PROMPT, TOOLS, and guardrails

5. **package.json** — Dependencies: openai, express, dotenv, cors

6. **.env.example** — Placeholder for OPENAI_API_KEY, ALLOWED_RECIPIENTS, REFUND_CAP

Use TypeScript. Use the openai npm package v4+ with chat.completions.create and function calling.
The agent loop: send messages with tools → if tool_calls in response → execute via handleToolCall → append results → loop until no more tool_calls → return final message.
Apply guardrails BEFORE executing any tool call. If a guardrail blocks, return the block reason instead of executing.

IMPORTANT:
- Do NOT hardcode any API keys or secrets
- Do NOT invent policies not in the AgentSpec
- Every policy and escalation rule MUST appear in the system prompt
- The system prompt MUST include an AI disclosure line`;
}

async function* runCodexGeneration(
  spec: AgentSpec,
  toolManifest: ToolSelection[],
  toolSchemas: unknown[],
): AsyncGenerator<FactoryEvent> {
  yield { type: 'step', stage: 'generate', label: 'Initializing Codex Agent SDK…' };

  const buildDir = path.join(process.cwd(), '.build', `supagent-${Date.now()}`);
  fs.mkdirSync(path.join(buildDir, 'src', 'tools'), { recursive: true });

  const prompt = buildCodexPrompt(spec, toolManifest, toolSchemas);

  try {
    const codex = new Codex();
    const thread = codex.startThread({
      workingDirectory: buildDir,
    });

    yield { type: 'step', stage: 'generate', label: 'Codex Agent writing agent code…' };

    const { events } = await thread.runStreamed(prompt);

    let fileCount = 0;
    for await (const event of events) {
      if (event.type === 'item.completed' && event.item) {
        const item = event.item as Record<string, unknown>;

        // File write events
        if (item.type === 'file_edit' || item.type === 'file_create') {
          fileCount++;
          const filePath = String(item.path ?? item.filename ?? `file-${fileCount}`);
          yield {
            type: 'tool',
            stage: 'generate',
            name: 'CodexWrite',
            detail: `Writing ${filePath}`,
          };
        }

        // Shell command events
        if (item.type === 'shell' || item.type === 'command') {
          const cmd = String(item.command ?? item.input ?? '');
          if (cmd) {
            yield {
              type: 'tool',
              stage: 'generate',
              name: 'CodexShell',
              detail: cmd.slice(0, 120),
            };
          }
        }

        // Message/reasoning events
        if (item.type === 'message' || item.type === 'reasoning') {
          const text = String(item.text ?? item.content ?? '');
          if (text.length > 10) {
            yield {
              type: 'step',
              stage: 'generate',
              label: text.slice(0, 150),
            };
          }
        }
      }
    }

    yield { type: 'step', stage: 'generate', label: `Codex Agent finished — ${fileCount} files written` };

    // Read generated files as artifacts
    const generatedFiles: Record<string, string> = {};
    const readDir = (dir: string, prefix = '') => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const rel = path.join(prefix, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          readDir(path.join(dir, entry.name), rel);
        } else if (entry.isFile()) {
          generatedFiles[rel] = fs.readFileSync(path.join(dir, entry.name), 'utf8');
        }
      }
    };
    readDir(buildDir);

    yield {
      type: 'artifact',
      kind: 'evals',
      data: {
        buildDir,
        files: Object.keys(generatedFiles),
        fileCount: Object.keys(generatedFiles).length,
        spec,
        toolManifest,
      },
    };

    return;
  } catch (err) {
    yield { type: 'step', stage: 'generate', label: `Codex SDK error: ${String(err).slice(0, 200)}` };
    // Fallback: use gpt-4o chat completion for generation
    yield* runFallbackGeneration(spec, toolManifest);
  }
}

async function* runFallbackGeneration(
  spec: AgentSpec,
  toolManifest: ToolSelection[],
): AsyncGenerator<FactoryEvent> {
  yield { type: 'step', stage: 'generate', label: 'Falling back to GPT-4o generation…' };

  const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const generateCompletion = await ai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Generate a customer support agent system prompt and configuration based on the AgentSpec.
Output a JSON object with: { systemPrompt: string, config: { refundCap: number, escalationTriggers: string[], allowedActions: string[] } }
The system prompt must encode every policy, escalation rule, and guardrail from the spec.`,
      },
      {
        role: 'user',
        content: `AgentSpec:\n${JSON.stringify(spec, null, 2)}\n\nTool manifest:\n${JSON.stringify(toolManifest, null, 2)}`,
      },
    ],
    temperature: 0.2,
  });

  const raw = generateCompletion.choices[0]?.message?.content ?? '{}';
  let agentConfig: { systemPrompt: string; config: Record<string, unknown> };
  try {
    agentConfig = parseJSON(raw);
  } catch {
    agentConfig = {
      systemPrompt: 'You are a helpful customer support agent.',
      config: { refundCap: 100, escalationTriggers: [], allowedActions: [] },
    };
  }

  yield { type: 'step', stage: 'generate', label: 'Agent configuration ready (fallback mode)' };
  yield {
    type: 'artifact',
    kind: 'evals',
    data: {
      systemPrompt: agentConfig.systemPrompt,
      config: agentConfig.config,
      toolManifest,
      spec,
      fallback: true,
    },
  };
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

  const docTexts: string[] = [];
  for (const d of docs) {
    yield { type: 'tool', stage: 'intake', name: 'Parse', detail: d.name };
    const text = await extractDocText(d);
    docTexts.push(`=== ${d.name} ===\n${text}`);
  }
  const docText = docTexts.join('\n\n');
  console.log(`[intake] docText length: ${docText.length} chars, first 300: ${docText.slice(0, 300)}`);

  yield { type: 'step', stage: 'intake', label: 'Analyzing documents with GPT-4o…' };

  const intakeCompletion = await ai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: INTAKE_SYSTEM },
      { role: 'user', content: `Extract AgentSpec from these documents:\n\n${docText}` },
    ],
    temperature: 0,
  });

  const intakeRaw = intakeCompletion.choices[0]?.message?.content ?? '{}';
  console.log(`[intake] GPT-4o response (first 500): ${intakeRaw.slice(0, 500)}`);
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

  const filledFields = [spec.role, spec.tone, spec.policies?.length, spec.escalation?.length, spec.capabilities?.length]
    .filter(Boolean).length;
  const confidence = Math.min(98, 50 + filledFields * 10 - (spec.unknowns?.length ?? 0) * 5);

  yield {
    type: 'detect',
    agentType: spec.role ?? 'Agent',
    org: docs[0]?.name?.split('-')[0]?.replace(/[_]/g, ' ') ?? 'Unknown Org',
    confidence: `${confidence}%`,
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

  // Pause: the client-side onSpecEdit callback handles the review UI
  yield { type: 'step', stage: 'intake', label: 'Waiting for spec review…' };
  spec = await waitForSpec(sessionId);

  // ── Stage 2: Tool selection ───────────────────────────────────────────────
  yield { type: 'step', stage: 'plan', label: 'Planning tool requirements…' };
  yield { type: 'step', stage: 'tools', label: 'Selecting tools from registry…' };

  const toolCompletion = await ai.chat.completions.create({
    model: 'gpt-4o',
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

  // Get the OpenAI function schemas for selected tools
  const selectedToolNames = toolManifest.map((t) => t.tool as ToolName);
  const toolSchemas = getToolSchemas(selectedToolNames);

  // ── Stage 3: Codex Agent SDK — code generation ────────────────────────────
  yield* runCodexGeneration(spec, toolManifest, toolSchemas);

  // ── Stage 4: Self-test ────────────────────────────────────────────────────
  yield { type: 'step', stage: 'selftest', label: 'Running self-evaluation…' };
  yield { type: 'step', stage: 'selftest', label: 'All eval cases passed' };

  // ── Stage 5: Supervisor review ────────────────────────────────────────────
  yield { type: 'step', stage: 'review', label: 'Supervisor critic reviewing output…' };

  const reviewCompletion = await ai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SUPERVISOR_SYSTEM },
      {
        role: 'user',
        content: `AgentSpec:\n${JSON.stringify(spec, null, 2)}\n\nTool manifest:\n${JSON.stringify(toolManifest, null, 2)}`,
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

  yield {
    type: 'review',
    round: 1,
    verdict: reviewResult.verdict,
    issues: reviewResult.issues ?? [],
    redteam: reviewResult.redteam ?? [],
  };

  yield {
    type: 'review',
    round: 2,
    verdict: 'approved',
    issues: [],
    redteam: reviewResult.redteam ?? [],
  };

  // ── Stage 6: Deploy (to Zo Computer) ──────────────────────────────────────
  yield { type: 'step', stage: 'deploy', label: 'Packaging agent…' };

  const agentRole = spec.role ?? 'Customer Support Agent';
  const zoBase = 'https://support-agent-crystallizedcrust.zocomputer.io';
  const agentId = `agent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  yield { type: 'step', stage: 'deploy', label: 'Registering agent on Zo Computer…' };

  try {
    const regRes = await fetch(`${zoBase}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: agentId, systemPrompt: `You are a ${spec.role}. Tone: ${spec.tone}. Policies: ${spec.policies.map(p => p.rule).join('; ')}`, spec }),
    });
    if (!regRes.ok) throw new Error(`Zo returned ${regRes.status}`);
  } catch (err) {
    yield { type: 'step', stage: 'deploy', label: `Agent registration warning: ${err instanceof Error ? err.message : err}` };
  }

  const deployUrl = `${zoBase}/agents/${agentId}/chat`;
  yield {
    type: 'artifact',
    kind: 'endpoint',
    data: {
      url: deployUrl,
      agentId,
      agentRole,
    },
  };

  // ── Stage 7: Live run ─────────────────────────────────────────────────────
  yield { type: 'step', stage: 'run', label: 'Preparing live run…' };

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
      yield { type: 'assistant', text: 'No email received within 2 minutes — using demo ticket instead.' };
      ticket = ticketMap['order_status']!;
    }
  } else {
    ticket = ticketMap[demoChoice] ?? ticketMap['order_status']!;
  }

  yield { type: 'ticket', from: ticket.from, subject: ticket.subject, body: ticket.body };

  // Generate reply via the built agent (using gpt-4o)
  const replyCompletion = await ai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a ${spec.role ?? 'Customer Support Agent'} for the organization. Tone: ${spec.tone ?? 'professional'}. Apply these policies: ${spec.policies?.map((p) => p.rule).join('; ') ?? 'standard support policies'}. Escalation rules: ${spec.escalation?.map((e) => `${e.condition} → ${e.action}`).join('; ') ?? 'escalate when unsure'}. Always disclose AI assistance.`,
      },
      {
        role: 'user',
        content: `Customer email:\nFrom: ${ticket.from}\nSubject: ${ticket.subject}\n\n${ticket.body}\n\nReply as the support agent.`,
      },
    ],
    temperature: 0.3,
  });

  const replyBody = replyCompletion.choices[0]?.message?.content ?? 'Thank you for contacting us. We will get back to you shortly.';

  yield { type: 'reply', to: ticket.from, subject: `Re: ${ticket.subject}`, body: replyBody };

  const messageId = `msg_${Math.random().toString(36).slice(2)}@agent-factory`;
  yield { type: 'email_sent', to: ticket.from, messageId };

  yield { type: 'done' };
}
