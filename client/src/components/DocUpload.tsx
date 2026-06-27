import { useState, useRef, useCallback } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';
import type { UploadedDoc } from '@shared';

const SAMPLE_DOCS: UploadedDoc[] = [
  { name: 'Brewed-Roots-Support-SOP-v4.1.pdf' },
  { name: 'Brewed-Roots-Brand-and-Voice-Guide.pdf' },
  { name: 'Brewed-Roots-Policies.pdf' },
  { name: 'Brewed-Roots-Knowledge-Base-FAQ.pdf' },
];

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

export interface DocUploadProps {
  onUpload: (docs: UploadedDoc[]) => void;
}

export function DocUpload({ onUpload }: DocUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<UploadedDoc[]>([]);
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="w-full max-w-xl mx-auto"
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

        {/* Use sample documents */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleUseSamples}
            className={[
              'text-sm text-ink-soft underline-offset-2 transition',
              'hover:text-accent hover:underline',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded',
            ].join(' ')}
          >
            Use sample documents
          </button>
          <p className="mt-1 text-xs text-ink-faint">
            Loads a fictional coffee brand — great for a quick demo
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
