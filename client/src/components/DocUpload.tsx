import { useState, useRef, useCallback, useEffect } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';
import type { UploadedDoc } from '@shared';

const SAMPLE_DOC_META: { name: string; title: string }[] = [
  { name: 'Brewed-Roots-Support-SOP-v4.1.pdf', title: 'Customer Support SOP (v4.1)' },
  { name: 'Brewed-Roots-Brand-and-Voice-Guide.pdf', title: 'Brand & Voice Guide' },
  { name: 'Brewed-Roots-Policies.pdf', title: 'Policies — Refunds, Returns, Shipping' },
  { name: 'Brewed-Roots-Knowledge-Base-FAQ.pdf', title: 'Knowledge Base / FAQ' },
];

const SAMPLE_DOCS: UploadedDoc[] = SAMPLE_DOC_META.map((d) => ({ name: d.name }));

// Upload cloud icon
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1.25" strokeDasharray="3 2" />
      <path
        d="M20 27V14M14 20l6-6 6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Small file type badge
function FileTypeBadge({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toUpperCase() ?? 'FILE';
  return (
    <span className="label-tag shrink-0">{ext}</span>
  );
}

// In-app PDF preview modal — lets you show document content without leaving the app.
function PdfPreviewModal({
  doc,
  onClose,
}: {
  doc: { name: string; title: string } | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doc, onClose]);

  return (
    <AnimatePresence>
      {doc && (
        <motion.div
          key="pv-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            key="pv-card"
            role="dialog"
            aria-modal="true"
            aria-label={`Preview: ${doc.title}`}
            className="glass-strong flex h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl shadow-glass-lg"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="label-tag shrink-0">PDF</span>
                <span className="truncate text-sm font-semibold text-ink">{doc.title}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <a
                  href={`/sample-docs/${doc.name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:bg-black/5 hover:text-ink"
                >
                  Open in tab
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close preview"
                  className="rounded-lg px-2 py-1 text-ink-soft transition hover:bg-black/5 hover:text-ink"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            <iframe
              title={doc.title}
              src={`/sample-docs/${doc.name}#view=FitH`}
              className="w-full flex-1 bg-white"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export interface DocUploadProps {
  onUpload: (docs: UploadedDoc[]) => void;
}

export function DocUpload({ onUpload }: DocUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<UploadedDoc[]>([]);
  const [preview, setPreview] = useState<{ name: string; title: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function mapFiles(files: FileList): UploadedDoc[] {
    return Array.from(files).map((f) => ({
      name: f.name,
      sizeKb: Math.round(f.size / 1024),
    }));
  }

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const files = e.dataTransfer.files;
      if (!files.length) return;
      const docs = mapFiles(files);
      setPending(docs);
      onUpload(docs);
    },
    [onUpload],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      const docs = mapFiles(files);
      setPending(docs);
      onUpload(docs);
      // Reset input so the same file can be re-selected if needed
      e.target.value = '';
    },
    [onUpload],
  );

  function handleUseSamples() {
    setPending(SAMPLE_DOCS);
    onUpload(SAMPLE_DOCS);
  }

  const hasPending = pending.length > 0;

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto"
    >
      <GlassCard strong className="p-8">
        {/* Headline */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-ink tracking-tight">
            Upload your organization's documents
          </h2>
          <p className="mt-2 text-sm text-ink-soft leading-relaxed max-w-sm mx-auto">
            Share your SOPs, policies, brand guide, and FAQ — the agent will
            read them and configure itself to represent your organization.
          </p>
        </div>

        {/* Dropzone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Drop files here or click to choose"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
          className={[
            'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed',
            'cursor-pointer px-6 py-10 transition-all duration-200 select-none',
            dragOver
              ? 'border-accent bg-accent-ghost scale-[1.01] shadow-glass'
              : 'border-black/12 bg-white/40 hover:border-accent/40 hover:bg-accent-ghost/50',
          ].join(' ')}
        >
          <UploadIcon
            className={`h-10 w-10 transition-colors ${dragOver ? 'text-accent' : 'text-ink-faint'}`}
          />
          <div className="text-center">
            <p className={`text-sm font-medium transition-colors ${dragOver ? 'text-accent' : 'text-ink-soft'}`}>
              {dragOver ? 'Release to upload' : 'Drag & drop files here'}
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              PDF, DOCX, MD, TXT — multiple files supported
            </p>
          </div>

          <Button
            variant="secondary"
            className="mt-1 pointer-events-none"
            aria-hidden
          >
            {/* Decorative — click is captured by the wrapper div */}
            Choose files
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.md,.txt"
          className="sr-only"
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden
        />

        {/* Pending file list */}
        {hasPending && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
            className="mt-4 overflow-hidden"
          >
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
              Queued ({pending.length})
            </p>
            <div className="flex flex-col gap-1.5">
              {pending.map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white/50 px-3 py-2 shadow-glass"
                >
                  <span className="text-sm text-ink truncate">{doc.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {doc.sizeKb !== undefined && (
                      <span className="text-xs text-ink-faint">{doc.sizeKb} KB</span>
                    )}
                    <FileTypeBadge name={doc.name} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-black/8" />
          <span className="text-xs text-ink-faint">or</span>
          <div className="flex-1 h-px bg-black/8" />
        </div>

        {/* Sample documents — previewable */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
              Sample documents
            </span>
            <span className="text-xs text-ink-faint">a fictional coffee brand</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {SAMPLE_DOC_META.map((d) => (
              <div
                key={d.name}
                className="flex items-center justify-between gap-2 rounded-xl bg-white/50 px-3 py-2 shadow-glass"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileTypeBadge name={d.name} />
                  <span className="truncate text-sm text-ink">{d.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreview(d)}
                  className="shrink-0 rounded px-1 text-xs font-medium text-accent transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  Preview
                </button>
              </div>
            ))}
          </div>
          <Button variant="primary" className="mt-3 w-full" onClick={handleUseSamples}>
            Use these sample documents
          </Button>
        </div>
      </GlassCard>
    </motion.div>
    <PdfPreviewModal doc={preview} onClose={() => setPreview(null)} />
    </>
  );
}
