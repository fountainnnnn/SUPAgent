import { AmbientBackground } from './components/AmbientBackground';

/**
 * P0 shell — boots a themed, glass-ready canvas.
 * P3 (integration) replaces the centered placeholder with the real flow:
 * TopBar + Wizard / GapReport / ChatStream / SpecReview / Sandbox / DeployCard,
 * driven by the store + engine.
 */
export default function App() {
  return (
    <div className="relative min-h-full w-full overflow-x-hidden">
      <AmbientBackground />
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[760px] flex-col items-center justify-center px-5 py-10">
        <div className="glass w-full rounded-2xl px-8 py-10 text-center animate-fade-up">
          <p className="label-tag mb-3">Agent Factory</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Build a support agent from how your team already works.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
            Foundation ready. The guided intake, build stream, spec review, sandbox,
            and deploy flow assemble here.
          </p>
        </div>
      </main>
    </div>
  );
}
