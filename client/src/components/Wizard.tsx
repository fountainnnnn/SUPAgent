import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type {
  OrgIntake,
  PolicyDoc,
  SystemConn,
  EscalationRule,
  AuthorityRow,
} from '@shared/types';
import { WizardStep } from './WizardStep';
import { AuthorityTable } from './AuthorityTable';
import { Button } from './ui/Button';

// ── helpers ────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-ink-soft uppercase tracking-wide">
        {label}
      </label>
      {hint && <p className="text-xs text-ink-faint -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}

const inputBase =
  'w-full rounded-xl border border-black/[0.08] bg-white/60 px-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition';

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputBase}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${inputBase} resize-none`}
    />
  );
}

/** Comma-separated list input */
function ChipInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const raw = values.join(', ');
  return (
    <input
      type="text"
      defaultValue={raw}
      onBlur={(e) => {
        const parsed = e.target.value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        onChange(parsed);
      }}
      placeholder={placeholder}
      className={inputBase}
    />
  );
}

function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex items-center gap-2.5 text-sm text-ink"
    >
      <span
        className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
          value ? 'bg-accent' : 'bg-black/10'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            value ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
      {label}
    </button>
  );
}

/** Mock dropzone — visual only */
function Dropzone({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-black/[0.08] bg-black/[0.015] py-6 text-center cursor-default select-none">
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-ink-faint" fill="none">
        <path
          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m-4-4l4-4 4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-xs text-ink-faint">{label}</span>
    </div>
  );
}

// ── step progress bar ──────────────────────────────────────────────────────

const STEP_LABELS = [
  'Brand',
  'Knowledge',
  'Systems',
  'Process',
  'Constraints',
];

function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i < step
                  ? 'bg-accent'
                  : i === step
                  ? 'bg-accent'
                  : 'bg-black/10'
              }`}
            />
            <span
              className={`text-[10px] whitespace-nowrap ${
                i === step ? 'text-accent font-medium' : 'text-ink-faint'
              }`}
            >
              {STEP_LABELS[i]}
            </span>
          </div>
          {i < total - 1 && (
            <div
              className={`h-px flex-1 transition-colors mb-3 ${
                i < step ? 'bg-accent/40' : 'bg-black/[0.06]'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── step content components ────────────────────────────────────────────────

function Step1Brand({
  intake,
  onChange,
}: {
  intake: OrgIntake;
  onChange: (patch: Partial<OrgIntake>) => void;
}) {
  const b = intake.brand;
  const set = (patch: Partial<typeof b>) =>
    onChange({ brand: { ...b, ...patch } });

  return (
    <WizardStep
      title="Brand & Identity"
      subtitle="Define who the agent speaks as and how it sounds."
    >
      <Field label="Company name">
        <TextInput value={b.name} onChange={(v) => set({ name: v })} placeholder="Acme Corp" />
      </Field>
      <Field label="What you sell" hint="One-sentence description of your product or service.">
        <TextInput value={b.sells} onChange={(v) => set({ sells: v })} placeholder="SaaS billing software for SMBs" />
      </Field>
      <Field label="Tone of voice" hint="e.g. Friendly, professional, concise">
        <TextInput value={b.tone} onChange={(v) => set({ tone: v })} placeholder="Warm and professional" />
      </Field>
      <Field label="Languages" hint="Comma-separated, e.g. English, Spanish">
        <ChipInput values={b.languages} onChange={(v) => set({ languages: v })} placeholder="English, Spanish" />
      </Field>
      <Field label="Banned phrases" hint="Words or phrases the agent must never use.">
        <ChipInput values={b.bannedPhrases} onChange={(v) => set({ bannedPhrases: v })} placeholder="unfortunately, I can't help with that" />
      </Field>
      <Field label="Agent sign-off" hint="How the agent signs its messages.">
        <TextInput value={b.signature} onChange={(v) => set({ signature: v })} placeholder="— The Acme Support Team" />
      </Field>
      <Toggle
        value={b.aiDisclosure}
        onChange={(v) => set({ aiDisclosure: v })}
        label="Disclose that the agent is AI-powered"
      />
    </WizardStep>
  );
}

function Step2Knowledge({
  intake,
  onChange,
}: {
  intake: OrgIntake;
  onChange: (patch: Partial<OrgIntake>) => void;
}) {
  const k = intake.knowledge;
  const set = (patch: Partial<typeof k>) =>
    onChange({ knowledge: { ...k, ...patch } });

  function setPolicyField(index: number, field: keyof PolicyDoc, value: string) {
    const updated = k.policies.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    set({ policies: updated });
  }

  function addPolicy() {
    set({ policies: [...k.policies, { name: '', value: '' }] });
  }

  function removePolicy(index: number) {
    set({ policies: k.policies.filter((_, i) => i !== index) });
  }

  return (
    <WizardStep
      title="Knowledge Base"
      subtitle="Upload documents and define numbered policies the agent can cite."
    >
      <Field label="Documents" hint="Upload FAQ files, help articles, or product manuals.">
        <Dropzone label="Drop files here, or click to browse" />
        {k.docs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {k.docs.map((d, i) => (
              <span key={i} className="label-tag">{d}</span>
            ))}
          </div>
        )}
      </Field>

      <Field label="Policies with numbers" hint="Each policy needs a name and a specific value the agent can quote.">
        <div className="space-y-2">
          {k.policies.map((p, i) => (
            <div key={i} className="flex gap-2 items-start">
              <TextInput
                value={p.name}
                onChange={(v) => setPolicyField(i, 'name', v)}
                placeholder="Policy name"
              />
              <TextInput
                value={p.value}
                onChange={(v) => setPolicyField(i, 'value', v)}
                placeholder="Value / limit"
              />
              <button
                type="button"
                onClick={() => removePolicy(i)}
                className="mt-0.5 rounded-lg p-1.5 text-ink-faint hover:text-danger hover:bg-danger/5 transition-colors"
                aria-label="Remove policy"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
          <Button variant="ghost" onClick={addPolicy} className="text-xs">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Add policy
          </Button>
        </div>
      </Field>
    </WizardStep>
  );
}

function Step3Systems({
  intake,
  onChange,
}: {
  intake: OrgIntake;
  onChange: (patch: Partial<OrgIntake>) => void;
}) {
  const s = intake.systems;
  const set = (patch: Partial<typeof s>) =>
    onChange({ systems: { ...s, ...patch } });

  function toggleConnection(index: number) {
    const updated = s.connections.map((c, i) =>
      i === index ? { ...c, connected: !c.connected } : c
    );
    set({ connections: updated });
  }

  function addConnection() {
    const name = window.prompt('Connection name (e.g. "Order DB")');
    if (name?.trim()) {
      set({ connections: [...s.connections, { name: name.trim(), connected: false }] });
    }
  }

  function removeConnection(index: number) {
    set({ connections: s.connections.filter((_, i) => i !== index) });
  }

  return (
    <WizardStep
      title="Systems & Data"
      subtitle="Connect data sources the agent needs to look up customer information."
    >
      <Field label="Connections">
        <div className="space-y-2">
          {s.connections.map((c: SystemConn, i: number) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-black/[0.07] bg-white/50 px-4 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2 w-2 rounded-full ${c.connected ? 'bg-ok' : 'bg-black/20'}`}
                  aria-hidden
                />
                <span className="text-sm font-medium text-ink">{c.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={c.connected ? 'secondary' : 'primary'}
                  className="text-xs"
                  onClick={() => toggleConnection(i)}
                >
                  {c.connected ? 'Disconnect' : 'Connect'}
                </Button>
                <button
                  type="button"
                  onClick={() => removeConnection(i)}
                  className="rounded-lg p-1.5 text-ink-faint hover:text-danger hover:bg-danger/5 transition-colors"
                  aria-label="Remove connection"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          <Button variant="ghost" onClick={addConnection} className="text-xs">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Add connection
          </Button>
        </div>
      </Field>

      <Field label="Identity verification" hint="How should the agent verify who it's talking to before sharing PII?">
        <TextArea
          value={s.identityVerification}
          onChange={(v) => set({ identityVerification: v })}
          placeholder="e.g. Confirm account email + last 4 digits of order number"
          rows={2}
        />
      </Field>
    </WizardStep>
  );
}

function Step4Process({
  intake,
  onChange,
}: {
  intake: OrgIntake;
  onChange: (patch: Partial<OrgIntake>) => void;
}) {
  const p = intake.process;
  const set = (patch: Partial<typeof p>) =>
    onChange({ process: { ...p, ...patch } });

  function setEscalationField(
    index: number,
    field: keyof EscalationRule,
    value: string
  ) {
    const updated = p.escalationMatrix.map((r, i) =>
      i === index ? { ...r, [field]: value } : r
    );
    set({ escalationMatrix: updated });
  }

  function addEscalation() {
    set({
      escalationMatrix: [
        ...p.escalationMatrix,
        { trigger: '', who: '', where: '', sla: '' },
      ],
    });
  }

  function removeEscalation(index: number) {
    set({ escalationMatrix: p.escalationMatrix.filter((_, i) => i !== index) });
  }

  return (
    <WizardStep
      title="Process & Authority"
      subtitle="Define standard operating procedures, escalation rules, and what actions the agent can take autonomously."
    >
      <Field label="Standard operating procedure" hint="Paste your SOP, runbook, or key process steps.">
        <TextArea
          value={p.sop}
          onChange={(v) => set({ sop: v })}
          placeholder="1. Greet customer by name.&#10;2. Look up their order.&#10;3. Resolve within policy limits…"
          rows={5}
        />
      </Field>

      <Field label="Escalation matrix" hint="When should the agent hand off, and to whom?">
        <div className="space-y-3">
          {p.escalationMatrix.map((r: EscalationRule, i: number) => (
            <div key={i} className="rounded-xl border border-black/[0.07] bg-white/40 p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">
                  Rule {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeEscalation(i)}
                  className="rounded-lg p-1 text-ink-faint hover:text-danger hover:bg-danger/5 transition-colors"
                  aria-label="Remove rule"
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  value={r.trigger}
                  onChange={(v) => setEscalationField(i, 'trigger', v)}
                  placeholder="Trigger (e.g. refund > $500)"
                />
                <TextInput
                  value={r.who}
                  onChange={(v) => setEscalationField(i, 'who', v)}
                  placeholder="Who (e.g. Billing team)"
                />
                <TextInput
                  value={r.where}
                  onChange={(v) => setEscalationField(i, 'where', v)}
                  placeholder="Channel (e.g. Slack #billing)"
                />
                <TextInput
                  value={r.sla}
                  onChange={(v) => setEscalationField(i, 'sla', v)}
                  placeholder="SLA (e.g. 2 hours)"
                />
              </div>
            </div>
          ))}
          <Button variant="ghost" onClick={addEscalation} className="text-xs">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Add escalation rule
          </Button>
        </div>
      </Field>

      <Field label="Action authority" hint="Set whether each action requires approval or can run automatically.">
        <AuthorityTable
          rows={p.authority}
          onChange={(rows: AuthorityRow[]) => set({ authority: rows })}
        />
      </Field>
    </WizardStep>
  );
}

function Step5Constraints({
  intake,
  onChange,
}: {
  intake: OrgIntake;
  onChange: (patch: Partial<OrgIntake>) => void;
}) {
  const c = intake.constraints;
  const set = (patch: Partial<typeof c>) =>
    onChange({ constraints: { ...c, ...patch } });

  return (
    <WizardStep
      title="Constraints & Ops"
      subtitle="Define compliance requirements, hard limits, and operational parameters."
    >
      <Field label="Compliance frameworks" hint="Comma-separated, e.g. GDPR, PDPA, HIPAA">
        <ChipInput values={c.compliance} onChange={(v) => set({ compliance: v })} placeholder="GDPR, PDPA" />
      </Field>
      <Field label="Data retention policy">
        <TextInput value={c.retention} onChange={(v) => set({ retention: v })} placeholder="e.g. 90 days, delete on request" />
      </Field>
      <Field label="Never-do list" hint="Actions or statements the agent must never take or make.">
        <ChipInput values={c.neverDo} onChange={(v) => set({ neverDo: v })} placeholder="promise refunds without approval, share PII via email" />
      </Field>
      <Field label="Supported channels" hint="Comma-separated, e.g. Chat, Email, WhatsApp">
        <ChipInput values={c.channels} onChange={(v) => set({ channels: v })} placeholder="Chat, Email" />
      </Field>
      <Field label="Business hours">
        <TextInput value={c.businessHours} onChange={(v) => set({ businessHours: v })} placeholder="Mon–Fri 09:00–18:00 SGT" />
      </Field>
      <Field label="Out-of-hours fallback" hint="What the agent should do when no human is available.">
        <TextArea
          value={c.fallback}
          onChange={(v) => set({ fallback: v })}
          placeholder="Acknowledge and promise follow-up within 1 business day."
          rows={2}
        />
      </Field>
      <Field label="Human handoff trigger" hint="When should the agent proactively transfer to a human?">
        <TextArea
          value={c.handoff}
          onChange={(v) => set({ handoff: v })}
          placeholder="Customer expresses anger twice, or requests a manager."
          rows={2}
        />
      </Field>
    </WizardStep>
  );
}

// ── slide variants ─────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -40 : 40,
    opacity: 0,
  }),
};

// ── Wizard ─────────────────────────────────────────────────────────────────

export function Wizard({
  initial,
  onComplete,
}: {
  initial: OrgIntake;
  onComplete: (intake: OrgIntake) => void;
}) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [intake, setIntake] = useState<OrgIntake>(initial);

  const TOTAL = 5;

  function patch(update: Partial<OrgIntake>) {
    setIntake((prev) => ({ ...prev, ...update }));
  }

  function next() {
    if (step < TOTAL - 1) {
      setDir(1);
      setStep((s) => s + 1);
    }
  }

  function back() {
    if (step > 0) {
      setDir(-1);
      setStep((s) => s - 1);
    }
  }

  const steps = [
    <Step1Brand intake={intake} onChange={patch} />,
    <Step2Knowledge intake={intake} onChange={patch} />,
    <Step3Systems intake={intake} onChange={patch} />,
    <Step4Process intake={intake} onChange={patch} />,
    <Step5Constraints intake={intake} onChange={patch} />,
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <StepProgress step={step} total={TOTAL} />

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0}>
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
            <path d="M10 3L6 8l4 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Button>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === step ? 'bg-accent' : 'bg-black/10'
              }`}
            />
          ))}
        </div>

        {step < TOTAL - 1 ? (
          <Button variant="secondary" onClick={next}>
            Next
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
              <path d="M6 3l4 5-4 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        ) : (
          <Button variant="primary" onClick={() => onComplete(intake)}>
            Build agent
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
}
