/**
 * Faint, blurred color blobs behind the glass so the glassmorphism has
 * something to refract. Extremely subtle — this should read as "warm light",
 * not "gradient". Fixed, non-interactive.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-canvas">
      <div
        className="absolute -left-32 -top-24 h-[36rem] w-[36rem] rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle at 30% 30%, rgba(10,132,255,0.16), transparent 60%)' }}
      />
      <div
        className="absolute -right-40 top-1/3 h-[40rem] w-[40rem] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle at 60% 40%, rgba(120,170,255,0.14), transparent 62%)' }}
      />
      <div
        className="absolute bottom-[-12rem] left-1/4 h-[34rem] w-[34rem] rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,196,140,0.12), transparent 60%)' }}
      />
    </div>
  );
}
