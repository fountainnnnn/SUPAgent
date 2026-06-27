import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onConfirm, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={onCancel}
            aria-hidden
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <GlassCard strong className="w-full max-w-sm shadow-glass-lg p-6">
              {/* Icon */}
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10">
                <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-accent" aria-hidden>
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 6.5v4M10 12.5v.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </div>

              <h2
                id="confirm-modal-title"
                className="mb-2 text-base font-semibold text-ink"
              >
                {title}
              </h2>

              <p className="mb-6 text-sm leading-relaxed text-ink-soft">{body}</p>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onCancel}>
                  {cancelLabel}
                </Button>
                <Button variant="primary" onClick={onConfirm}>
                  {confirmLabel}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
