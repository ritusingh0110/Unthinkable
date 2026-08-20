'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, FileAudio, X, Loader2, Music2 } from 'lucide-react';

const ALLOWED_EXTS = ['mp3', 'wav', 'm4a', 'mp4', 'mpeg', 'mpga', 'webm', 'ogg', 'flac'];
const MAX_BYTES = 25 * 1024 * 1024;

function extOf(name = '') {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}
function humanSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0; let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function AudioUploader({ onProcess, isProcessing, processingStage }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  function validateAndSet(f) {
    setError('');
    if (!f) return;
    const ext = extOf(f.name);
    const looksAudio = (f.type || '').startsWith('audio/') || ALLOWED_EXTS.includes(ext);
    if (!looksAudio) {
      setError(`Unsupported file type. Allowed: ${ALLOWED_EXTS.join(', ')}.`);
      return;
    }
    if (f.size === 0) {
      setError('The selected file is empty.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setError('File is too large. Max size is 25MB.');
      return;
    }
    setFile(f);
  }

  function onPick(e) {
    const f = e.target.files?.[0];
    validateAndSet(f);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (isProcessing) return;
    const f = e.dataTransfer?.files?.[0];
    validateAndSet(f);
  }

  function clearFile() {
    setFile(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleProcess() {
    if (!file) {
      setError('Please select an audio file first.');
      return;
    }
    onProcess?.(file);
  }

  return (
    <Card className="overflow-hidden shadow-sm border-border/70">
      <CardContent className="p-5 sm:p-7">
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.flac,.mp4"
          onChange={onPick}
          className="hidden"
          disabled={isProcessing}
        />

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); if (!isProcessing) setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isProcessing}
              className={`group w-full flex flex-col items-center justify-center gap-4 py-14 sm:py-16 rounded-xl border-2 border-dashed transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                dragging
                  ? 'border-primary bg-primary/5 scale-[1.005]'
                  : 'border-border hover:border-primary/60 hover:bg-primary/[0.03]'
              }`}
              aria-label="Upload audio file"
            >
              <div className={`h-14 w-14 rounded-2xl grid place-items-center transition-colors ${dragging ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary/15'}`}>
                <UploadCloud className="h-6 w-6" />
              </div>
              <div className="text-center">
                <div className="text-base font-medium">
                  {dragging ? 'Drop your audio to upload' : 'Drag & drop your meeting recording'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  or <span className="text-primary font-medium">browse from your device</span>
                </div>
                <div className="text-xs text-muted-foreground mt-3 flex flex-wrap items-center justify-center gap-1.5">
                  <FormatBadge label="MP3" />
                  <FormatBadge label="WAV" />
                  <FormatBadge label="M4A" />
                  <FormatBadge label="WEBM" />
                  <FormatBadge label="OGG" />
                  <FormatBadge label="FLAC" />
                  <span className="mx-1">·</span>
                  <span>up to 25MB</span>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 sm:p-5 rounded-xl bg-muted/40 border">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
              <Music2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{file.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <FileAudio className="h-3.5 w-3.5" />
                {humanSize(file.size)}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearFile} disabled={isProcessing} aria-label="Remove file" className="shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-3 text-sm text-destructive">{error}</div>
        )}

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <Button
            onClick={handleProcess}
            disabled={!file || isProcessing}
            className="sm:min-w-[240px] h-11 text-sm shadow-sm"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {processingStage || 'Processing...'}
              </>
            ) : (
              <>
                <Sparkle />
                Transcribe & Summarize
              </>
            )}
          </Button>
          {isProcessing && (
            <span className="text-xs text-muted-foreground">This can take a minute or two depending on audio length.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FormatBadge({ label }) {
  return (
    <span className="inline-flex items-center rounded-md border bg-background px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
      {label}
    </span>
  );
}

function Sparkle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-2" aria-hidden>
      <path d="M12 2l1.9 4.6L18.5 8.5l-4.6 1.9L12 15l-1.9-4.6L5.5 8.5l4.6-1.9L12 2zM19 14l.95 2.3L22 17.25l-2.05.95L19 20.5l-.95-2.3L16 17.25l2.05-.95L19 14zM5 15l.7 1.7L7.5 17.4l-1.8.7L5 19.8l-.7-1.7L2.5 17.4l1.8-.7L5 15z" />
    </svg>
  );
}
