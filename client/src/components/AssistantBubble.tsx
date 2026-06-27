import { motion } from 'framer-motion';

/** Small brand avatar for the agent's messages. */
function AgentAvatar() {
  return (
    <span
      className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-accent shadow-sm"
      aria-hidden
    >
      <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-white">
        <circle cx="8" cy="5.5" r="2.3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M3 13c0-2.3 2.24-4 5-4s5 1.7 5 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function AssistantBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex items-start gap-3"
    >
      <AgentAvatar />
      <div className="flex max-w-[80%] flex-col gap-1">
        <span className="px-1 text-[11px] font-medium text-ink-faint">SUPAgent</span>
        <div className="rounded-2xl rounded-tl-md border border-black/[0.05] bg-white/85 px-4 py-3 shadow-glass backdrop-blur-sm">
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{text}</p>
        </div>
      </div>
    </motion.div>
  );
}
