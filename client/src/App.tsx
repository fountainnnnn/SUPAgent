import { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { OrgIntake } from '@shared';
import { useStore } from './store';
import { getEngine } from './engine';
import { sampleOrg } from './content/sampleOrg';

import { AmbientBackground } from './components/AmbientBackground';
import { TopBar } from './components/TopBar';
import { Wizard } from './components/Wizard';
import { ChatStream } from './components/ChatStream';
import { ConfirmModal } from './components/ConfirmModal';
import { SpecReview } from './components/SpecReview';
import { Composer } from './components/Composer';

function statusFor(phase: string, running: boolean): { label: string; tone: 'idle' | 'busy' | 'live' } {
  if (phase === 'done') return { label: 'Live', tone: 'live' };
  if (running) {
    const map: Record<string, string> = {
      gap: 'Reviewing inputs',
      building: 'Building agent',
      spec_review: 'Awaiting spec review',
      review: 'Supervisor reviewing',
      sandbox: 'Testing',
      deploy: 'Deploying',
    };
    return { label: map[phase] ?? 'Building agent', tone: 'busy' };
  }
  return { label: 'Intake', tone: 'idle' };
}

export default function App() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const phase = useStore((s) => s.phase);
  const running = useStore((s) => s.running);
  const events = useStore((s) => s.events);
  const activeStage = useStore((s) => s.activeStage);
  const pending = useStore((s) => s.pending);

  const setIntake = useStore((s) => s.setIntake);
  const setRunning = useStore((s) => s.setRunning);
  const apply = useStore((s) => s.apply);
  const requestConfirm = useStore((s) => s.requestConfirm);
  const requestSpecEdit = useStore((s) => s.requestSpecEdit);
  const resolveConfirm = useStore((s) => s.resolveConfirm);
  const resolveSpecEdit = useStore((s) => s.resolveSpecEdit);

  const start = useCallback(
    async (intake: OrgIntake) => {
      setIntake(intake);
      setRunning(true);
      const engine = getEngine(useStore.getState().mode);
      try {
        for await (const ev of engine.run(intake, requestConfirm, requestSpecEdit)) {
          apply(ev);
        }
      } finally {
        setRunning(false);
      }
    },
    [setIntake, setRunning, apply, requestConfirm, requestSpecEdit],
  );

  const status = statusFor(phase, running);
  const showWizard = phase === 'intake' && !running && events.length === 0;
  const confirm = pending?.confirm;
  const specEdit = pending?.specEdit;

  return (
    <div className="relative min-h-full w-full overflow-x-hidden">
      <AmbientBackground />
      <TopBar mode={mode} onModeChange={setMode} status={status.label} />

      <main className="relative z-10 mx-auto w-full max-w-[760px] px-5 pb-32 pt-6">
        <AnimatePresence mode="wait">
          {showWizard ? (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <Wizard initial={sampleOrg} onComplete={start} />
            </motion.div>
          ) : (
            <motion.div
              key="stream"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <ChatStream events={events} activeStage={activeStage} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom composer — secondary to the streamed build. */}
      {!showWizard && (
        <div className="fixed inset-x-0 bottom-0 z-20">
          <div className="mx-auto w-full max-w-[760px] px-5 pb-5">
            <Composer
              onSend={() => undefined}
              disabled={running}
              placeholder={running ? 'Agent is building…' : 'Ask the factory…'}
            />
          </div>
        </div>
      )}

      {/* Editable spec-review overlay (engine awaits this). */}
      <AnimatePresence>
        {specEdit && (
          <motion.div
            key="spec-overlay"
            className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/20 px-4 py-10 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-[640px]"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            >
              <SpecReview spec={specEdit.spec} onConfirm={resolveSpecEdit} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blocking confirmation modal (engine awaits this). */}
      <ConfirmModal
        open={!!confirm}
        title={confirm?.event.title ?? ''}
        body={confirm?.event.body ?? ''}
        confirmLabel="Confirm"
        cancelLabel="Not now"
        onConfirm={() => resolveConfirm(true)}
        onCancel={() => resolveConfirm(false)}
      />
    </div>
  );
}
