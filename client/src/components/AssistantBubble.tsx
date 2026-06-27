import { motion } from 'framer-motion';

export function AssistantBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex justify-start"
    >
      {/* Avatar dot */}
      <div className="mr-2.5 mt-1 h-6 w-6 shrink-0 rounded-full bg-accent/10 flex items-center justify-center">
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-accent" aria-hidden>
          <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2.5 13c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>

      <div className="glass max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 shadow-glass">
        <p className="text-sm leading-relaxed text-ink whitespace-pre-wrap">{text}</p>
      </div>
    </motion.div>
  );
}
