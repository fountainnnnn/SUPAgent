export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-ink-faint/30 border-t-ink-faint ${className}`}
    />
  );
}
