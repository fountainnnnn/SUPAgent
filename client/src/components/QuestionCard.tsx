import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';

// Small inline SVG — "chat bubble with a dot" to signal the assistant is asking.
function AskingIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className="h-3.5 w-3.5 text-accent"
      aria-hidden
    >
      <path
        d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v6A1.5 1.5 0 0 1 12.5 11H9l-3 2.5V11H3.5A1.5 1.5 0 0 1 2 9.5v-6z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <circle cx="5.5" cy="6.5" r="0.75" fill="currentColor" />
      <circle cx="8" cy="6.5" r="0.75" fill="currentColor" />
      <circle cx="10.5" cy="6.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

export interface QuestionCardProps {
  prompt: string;
  options: { label: string; value: string }[];
  allowText?: boolean;
  selected?: string;
  disabled?: boolean;
  onAnswer: (value: string) => void;
}

export function QuestionCard({
  prompt,
  options,
  allowText,
  selected,
  disabled,
  onAnswer,
}: QuestionCardProps) {
  const [freeText, setFreeText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Is the answered value a free-text answer (not one of the provided option values)?
  const selectedIsOption = selected !== undefined && options.some((o) => o.value === selected);
  const selectedIsText = selected !== undefined && !selectedIsOption;

  function submitText() {
    const trimmed = freeText.trim();
    if (trimmed) onAnswer(trimmed);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <GlassCard className="p-4">
        {/* Header affordance */}
        <div className="mb-3 flex items-center gap-1.5">
          <AskingIcon />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-accent">
            Follow-up
          </span>
        </div>

        {/* Prompt */}
        <p className="mb-3.5 text-sm leading-relaxed text-ink">{prompt}</p>

        {/* Option chips */}
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = selected === option.value;

            if (disabled) {
              // Non-interactive — show which was chosen
              return (
                <span
                  key={option.value}
                  className={[
                    'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-none',
                    isSelected
                      ? 'border-accent bg-accent text-white'
                      : 'border-black/8 bg-white/40 text-ink-faint',
                  ].join(' ')}
                >
                  {option.label}
                </span>
              );
            }

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onAnswer(option.value)}
                className={[
                  'rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
                  'hover:border-accent/50 hover:bg-accent-ghost hover:text-accent',
                  'active:scale-[0.97]',
                  'border-black/10 bg-white/60 text-ink',
                ].join(' ')}
              >
                {option.label}
              </button>
            );
          })}

          {/* Free-text chip when disabled + answer was typed */}
          {disabled && selectedIsText && selected && (
            <span className="rounded-full border border-accent bg-accent px-3.5 py-1.5 text-sm font-medium text-white">
              {selected}
            </span>
          )}
        </div>

        {/* Free-text input (only when allowText and not disabled) */}
        {allowText && !disabled && (
          <div className="mt-3 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitText();
              }}
              placeholder="Or type your answer…"
              className={[
                'flex-1 rounded-xl border border-black/10 bg-white/60 px-3 py-2',
                'text-sm text-ink placeholder:text-ink-faint',
                'outline-none transition',
                'focus:border-accent/40 focus:bg-white/80 focus:shadow-glass',
              ].join(' ')}
            />
            <Button
              variant="primary"
              onClick={submitText}
              disabled={!freeText.trim()}
              className="shrink-0"
            >
              Send
            </Button>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
