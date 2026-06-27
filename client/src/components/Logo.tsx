/** SUPAgent brand mark — a rounded accent tile with an "S" monogram + wordmark. */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid shrink-0 place-items-center rounded-[8px] bg-accent shadow-sm"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-[62%] w-[62%]">
          <path
            d="M15.5 8.2c0-1.7-1.6-2.9-3.5-2.9S8.5 6.4 8.5 8s1.5 2.4 3.5 2.8 3.6 1.2 3.6 3-1.7 3-3.6 3-3.6-1.2-3.6-3"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[15px] font-semibold leading-none tracking-tight text-ink">
        SUPAgent
      </span>
    </div>
  );
}
