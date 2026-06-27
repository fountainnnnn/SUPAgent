/** SUPAgent brand mark — a rounded accent tile with a unique spark/orbit glyph + wordmark. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Icon tile */}
      <span
        className="grid shrink-0 place-items-center rounded-[9px] bg-accent shadow-sm"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-[70%] w-[70%]"
        >
          {/* Orbit arc — thin partial circle suggesting an agent in motion */}
          <path
            d="M17.5 6.5 A8 8 0 0 1 17.5 17.5"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.55"
          />
          {/* Lightning bolt — the "sup" spark / agent action */}
          <path
            d="M13.5 3.5 L8.5 12 H12.5 L10.5 20.5 L18 11 H13.5 L15.5 3.5 Z"
            fill="white"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {/* Wordmark */}
      <span className="text-[15px] font-semibold leading-none tracking-tight text-ink">
        SUPAgent
      </span>
    </div>
  );
}
