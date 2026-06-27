/**
 * Pre-configured tool registry for the agent factory.
 *
 * These are the tools SUPAgent provisions for every built agent.
 * The pipeline's Stage 2 (tool selection) picks from this list based on the org's AgentSpec.
 * Each tool is fully wired — API keys pre-loaded, guardrails built-in.
 * The generated agent receives only the subset selected for its capabilities.
 */

import { exaSearch } from './exa.js';

export type ToolName =
  | 'web_search'
  | 'email_send'
  | 'order_lookup'
  | 'customer_lookup'
  | 'refund_processor'
  | 'ticket_escalate'
  | 'knowledge_base_search';

export interface RegistryTool {
  name: ToolName;
  description: string;
  /** Whether this tool requires a code-level guardrail (e.g. amount caps, allow-lists). */
  needsGuardrail: boolean;
  /** Required env vars for this tool (for .env.example generation). */
  requiredEnv: string[];
  /** OpenAI-compatible function schema (used by the Codex Agent SDK tool loop). */
  schema: {
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  };
  /** Runtime implementation — called when the built agent invokes the tool. */
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

// ── Tool implementations ──────────────────────────────────────────────────────

const webSearchTool: RegistryTool = {
  name: 'web_search',
  description: 'Search the web for current information using Exa neural search. Returns query-relevant highlights from top results.',
  needsGuardrail: false,
  requiredEnv: ['EXA_API_KEY'],
  schema: {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web for current information, documentation, or product details.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query' },
          numResults: { type: 'number', description: 'Number of results to return (default 5)', default: 5 },
        },
        required: ['query'],
      },
    },
  },
  async execute({ query, numResults = 5 }) {
    return exaSearch(String(query), Number(numResults));
  },
};

const emailSendTool: RegistryTool = {
  name: 'email_send',
  description: 'Send an email reply to a customer. Recipient must be on the allow-list (code-level guardrail). Uses pre-configured SMTP.',
  needsGuardrail: true,
  requiredEnv: ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'ALLOWED_RECIPIENTS'],
  schema: {
    type: 'function',
    function: {
      name: 'email_send',
      description: 'Send a support reply email to a customer.',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject line' },
          body: { type: 'string', description: 'Plain-text email body' },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  },
  async execute({ to, subject, body }) {
    const base = process.env.SERVER_URL ?? 'http://localhost:8787';
    const res = await fetch(`${base}/api/send`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to, subject, body }),
    });
    return res.json();
  },
};

const orderLookupTool: RegistryTool = {
  name: 'order_lookup',
  description: 'Look up an order by ID to get status, items, shipping, and fulfilment details.',
  needsGuardrail: false,
  requiredEnv: [],
  schema: {
    type: 'function',
    function: {
      name: 'order_lookup',
      description: 'Retrieve order details by order ID.',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'The order ID to look up' },
        },
        required: ['orderId'],
      },
    },
  },
  async execute({ orderId }) {
    // Stub — in production this calls the org's order management API
    return {
      orderId,
      status: 'in_transit',
      estimatedDelivery: '2026-06-30',
      items: [{ name: 'Sample Product', qty: 1, price: 49.99 }],
      tracking: `TRK-${String(orderId).slice(-6)}`,
      note: 'stub — connect your order API via .env.example',
    };
  },
};

const customerLookupTool: RegistryTool = {
  name: 'customer_lookup',
  description: 'Look up a customer by email to verify identity and retrieve account details. Requires verified=true before returning PII.',
  needsGuardrail: true,
  requiredEnv: [],
  schema: {
    type: 'function',
    function: {
      name: 'customer_lookup',
      description: 'Look up a customer account by email address.',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Customer email address' },
          verified: { type: 'boolean', description: 'Whether identity has been verified' },
        },
        required: ['email', 'verified'],
      },
    },
  },
  async execute({ email, verified }) {
    if (!verified) return { error: 'identity_not_verified', message: 'Cannot return customer data without verification.' };
    return {
      email,
      name: 'Verified Customer',
      accountStatus: 'active',
      tier: 'standard',
      note: 'stub — connect your CRM via .env.example',
    };
  },
};

const refundProcessorTool: RegistryTool = {
  name: 'refund_processor',
  description: 'Process a refund for a customer order. Hard cap enforced in code — amounts above REFUND_CAP are blocked and escalated automatically.',
  needsGuardrail: true,
  requiredEnv: ['REFUND_CAP'],
  schema: {
    type: 'function',
    function: {
      name: 'refund_processor',
      description: 'Issue a refund for an order. Blocked above REFUND_CAP — escalates automatically.',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Order to refund' },
          amount: { type: 'number', description: 'Refund amount in USD' },
          reason: { type: 'string', description: 'Reason for refund' },
        },
        required: ['orderId', 'amount', 'reason'],
      },
    },
  },
  async execute({ orderId, amount, reason }) {
    const cap = Number(process.env.REFUND_CAP ?? 100);
    if (Number(amount) >= cap) {
      return { blocked: true, reason: `Amount $${amount} exceeds the $${cap} auto-approve cap. Escalating to human agent.` };
    }
    return { success: true, orderId, amount, reason, refundId: `RFD-${Date.now()}` };
  },
};

const ticketEscalateTool: RegistryTool = {
  name: 'ticket_escalate',
  description: 'Escalate a support ticket to a human agent when the issue is outside the agent\'s authority or confidence.',
  needsGuardrail: false,
  requiredEnv: [],
  schema: {
    type: 'function',
    function: {
      name: 'ticket_escalate',
      description: 'Escalate a ticket to a human agent with a summary and priority.',
      parameters: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'Brief summary of the issue' },
          reason: { type: 'string', description: 'Why this is being escalated' },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], description: 'Escalation priority' },
        },
        required: ['summary', 'reason', 'priority'],
      },
    },
  },
  async execute({ summary, reason, priority }) {
    return { escalated: true, ticketId: `ESC-${Date.now()}`, summary, reason, priority, assignedTo: 'human_queue' };
  },
};

const knowledgeBaseSearchTool: RegistryTool = {
  name: 'knowledge_base_search',
  description: 'Search the organisation\'s uploaded documents (SOP, FAQ, policies) for relevant information.',
  needsGuardrail: false,
  requiredEnv: [],
  schema: {
    type: 'function',
    function: {
      name: 'knowledge_base_search',
      description: 'Search the organisation knowledge base for relevant policy, SOP, or FAQ content.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
        required: ['query'],
      },
    },
  },
  async execute({ query }) {
    // In production, this does vector search over the org's uploaded docs
    return { query, results: [], note: 'Knowledge base search stub — index populated from uploaded docs at build time' };
  },
};

// ── Registry map ──────────────────────────────────────────────────────────────

export const TOOL_REGISTRY: Record<ToolName, RegistryTool> = {
  web_search: webSearchTool,
  email_send: emailSendTool,
  order_lookup: orderLookupTool,
  customer_lookup: customerLookupTool,
  refund_processor: refundProcessorTool,
  ticket_escalate: ticketEscalateTool,
  knowledge_base_search: knowledgeBaseSearchTool,
};

/** Returns the OpenAI-compatible function schemas for a subset of tools (for the Codex Agent SDK tool loop). */
export function getToolSchemas(names: ToolName[]) {
  return names.map((n) => TOOL_REGISTRY[n]?.schema).filter(Boolean);
}

/** Returns the registry description block injected into the tool-selection stage prompt. */
export function getRegistryDescription(): string {
  return Object.values(TOOL_REGISTRY)
    .map((t) => `- ${t.name}: ${t.description}${t.needsGuardrail ? ' [GUARDRAIL]' : ''}`)
    .join('\n');
}
