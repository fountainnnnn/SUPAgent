import { useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { UploadedDoc } from '@shared';
import { useStore } from './store';
import { getEngine } from './engine';

import { AmbientBackground } from './components/AmbientBackground';
import { TopBar } from './components/TopBar';
import { DocUpload } from './components/DocUpload';
import { ChatStream } from './components/ChatStream';
import { Composer } from './components/Composer';

function statusFor(
  phase: string,
  running: boolean,
): { label: string; tone: 'idle' | 'busy' | 'live' } {
  if (phase === 'done') return { label: 'Live', tone: 'live' };
  if (running) {
    const map: Record<string, string> = {
      building: 'Building agent',
      gap: 'Reviewing inputs',
      spec_review: 'Awaiting spec review',
      review: 'Supervisor reviewing',
      sandbox: 'Testing',
      deploy: 'Deploying',
    };
    return { label: map[phase] ?? 'Building agent', tone: 'busy' };
  }
  return { label: 'Ready', tone: 'idle' };
}

export default function App() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const phase = useStore((s) => s.phase);
  const running = useStore((s) => s.running);
  const events = useStore((s) => s.events);
  const activeStage = useStore((s) => s.activeStage);
  const pending = useStore((s) => s.pending);
  const answers = useStore((s) => s.answers);
  const runGeneration = useStore((s) => s.runGeneration);

  const setDocs = useStore((s) => s.setDocs);
  const setRunning = useStore((s) => s.setRunning);
  const apply = useStore((s) => s.apply);
  const requestAnswer = useStore((s) => s.requestAnswer);
  const requestSpecEdit = useStore((s) => s.requestSpecEdit);
  const resolveAnswer = useStore((s) => s.resolveAnswer);
  const resolveSpecEdit = useStore((s) => s.resolveSpecEdit);
  const reset = useStore((s) => s.reset);

  // Tracks active run generation so the for-await loop exits on reset
  const genRef = useRef(runGeneration);

  const start = useCallback(
    async (docs: UploadedDoc[]) => {
      setDocs(docs);
      const names = docs.map((d) => d.name).join(', ');
      apply({ type: 'usermsg', text: `Uploaded ${docs.length} document${docs.length === 1 ? '' : 's'}: ${names}` });
      setRunning(true);
      const myGen = useStore.getState().runGeneration;
      genRef.current = myGen;
      const engine = getEngine(useStore.getState().mode);
      try {
        for await (const ev of engine.run(docs, requestAnswer, requestSpecEdit)) {
          if (useStore.getState().runGeneration !== myGen) break;
          apply(ev);
        }
      } finally {
        if (useStore.getState().runGeneration === myGen) setRunning(false);
      }
    },
    [setDocs, apply, setRunning, requestAnswer, requestSpecEdit],
  );

  const status = statusFor(phase, running);
  const showUpload = phase === 'upload' && events.length === 0;
  const pendingQuestionId = pending?.question?.event.id ?? null;
  // Suppress unused-var warning — runGeneration is used to trigger re-render on reset
  void runGeneration;

  return (
    <div className="relative min-h-full w-full overflow-x-hidden">
      <AmbientBackground />
      <TopBar mode={mode} onModeChange={setMode} status={status.label} tone={status.tone} />

      <main className="relative z-10 mx-auto w-full max-w-[1040px] px-5 pb-36 pt-6">
        <AnimatePresence mode="wait">
          {showUpload ? (
            <motion.div
              key="upload"
              className="flex min-h-[70vh] items-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <DocUpload onUpload={start} />
            </motion.div>
          ) : (
            <motion.div
              key="stream"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <ChatStream
                events={events}
                activeStage={activeStage}
                paused={!!pending}
                pendingQuestionId={pendingQuestionId}
                answers={answers}
                specPending={!!pending?.specEdit}
                onAnswer={resolveAnswer}
                onSpecConfirm={resolveSpecEdit}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!showUpload && (
        <div className="fixed inset-x-0 bottom-0 z-20">
          <div className="mx-auto w-full max-w-[1040px] px-5 pb-5">
            <div className="mb-2 flex justify-end">
              <button
                onClick={reset}
                className="rounded-lg border border-glass-hairline bg-glass px-3 py-1.5 text-xs font-medium text-ink-soft backdrop-blur-sm transition-colors hover:bg-white/80 hover:text-ink"
              >
                ↩ Start over
              </button>
            </div>
            <Composer
              onSend={() => undefined}
              disabled={running}
              placeholder={running ? 'SUPAgent is working…' : 'Ask SUPAgent…'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
