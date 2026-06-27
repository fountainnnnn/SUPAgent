import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Button } from './ui/Button';

export function Composer({
  onSend,
  disabled = false,
  placeholder = 'Ask or instruct…',
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState('');

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="glass rounded-2xl flex items-end gap-2 px-4 py-3 shadow-glass">
      <textarea
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 resize-none bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none leading-relaxed disabled:opacity-40"
        style={{ minHeight: '1.5rem', maxHeight: '8rem' }}
        onInput={(e) => {
          const el = e.currentTarget;
          el.style.height = 'auto';
          el.style.height = `${el.scrollHeight}px`;
        }}
      />
      <Button
        variant="secondary"
        disabled={disabled || value.trim().length === 0}
        onClick={handleSend}
        className="shrink-0"
        aria-label="Send"
      >
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          aria-hidden
        >
          <path
            d="M8 13V3m0 0L4 7m4-4l4 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Send
      </Button>
    </div>
  );
}
