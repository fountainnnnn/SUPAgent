// ── Frozen contract: org inputs + inferred agent spec + tool manifest ──
// Consumed identically by client (UI + engine) and server (Phase-2 pipeline).

export type AuthorityLevel = 'auto' | 'approval' | 'never';

// ---- OrgIntake (output of the guided intake wizard) ----
export interface BrandInfo {
  name: string;
  sells: string;
  tone: string;
  languages: string[];
  bannedPhrases: string[];
  signature: string;
  aiDisclosure: boolean;
}

export interface PolicyDoc {
  name: string;   // e.g. "Refund limit"
  value: string;  // e.g. "$100 without approval"
}

export interface KnowledgeInfo {
  docs: string[];          // uploaded doc names / FAQ titles
  policies: PolicyDoc[];   // policies WITH numbers
}

export interface SystemConn {
  name: string;            // e.g. "Order DB", "CRM", "Billing"
  connected: boolean;
}

export interface SystemsInfo {
  connections: SystemConn[];
  identityVerification: string; // how a customer is verified before PII is returned
}

export interface EscalationRule {
  trigger: string;
  who: string;
  where: string;
  sla: string;
}

export interface AuthorityRow {
  action: string;
  level: AuthorityLevel;
}

export interface ProcessInfo {
  sop: string;
  escalationMatrix: EscalationRule[];
  authority: AuthorityRow[];
}

export interface ConstraintsInfo {
  compliance: string[];    // e.g. ["PDPA"]
  retention: string;
  neverDo: string[];
  channels: string[];
  businessHours: string;
  fallback: string;
  handoff: string;
}

export interface OrgIntake {
  brand: BrandInfo;
  knowledge: KnowledgeInfo;
  systems: SystemsInfo;
  process: ProcessInfo;
  constraints: ConstraintsInfo;
}

// ---- AgentSpec (inferred, editable in the spec-review step) ----
export interface SpecPolicy {
  name: string;
  rule: string;
  source: string; // verbatim quote from the inputs (verified by the pipeline)
}

export interface SpecEscalation {
  condition: string;
  threshold: string;
  action: string;
  source: string;
}

export interface SpecAuthority {
  action: string;
  level: AuthorityLevel;
}

export interface AgentSpec {
  role: string;
  tone: string;
  policies: SpecPolicy[];
  escalation: SpecEscalation[];
  authority: SpecAuthority[];
  capabilities: string[];
  unknowns: string[];
}

// ---- ToolManifest (Phase-2 tool selection output) ----
export interface ToolSelection {
  capability: string;
  tool: string;        // registry tool name or "stub:<name>"
  why: string;
  actions: string[];
  missingEnv: string[];
  needsGuardrail: boolean;
}

export interface ToolStub {
  name: string;
  interface: string;   // typed signature only
}

export interface ToolManifest {
  selections: ToolSelection[];
  stubs: ToolStub[];
}
