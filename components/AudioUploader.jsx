'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileAudio, X, Loader2 } from 'lucide-react';

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
      setError('File is too large. Max size is 25MB (OpenAI Whisper limit).');
      return;
    }
    setFile(f);
  }

  function onPick(e) {
    const f = e.target.files?.[0];
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
    <Card className="border-dashed">
      <CardContent className="p-6">
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.flac,.mp4"
          onChange={onPick}
          className="hidden"
          disabled={isProcessing}
        />

        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isProcessing}
            className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-md border-2 border-dashed border-border hover:border-primary/60 hover:bg-muted/40 transition"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Click to select an audio file</span>
              <div className="mt-1">mp3, wav, m4a, webm, ogg, flac — up to 25MB</div>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-md bg-muted/40 border">
            <FileAudio className="h-6 w-6 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{file.name}</div>
              <div className="text-xs text-muted-foreground">{humanSize(file.size)}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearFile} disabled={isProcessing} aria-label="Remove file">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-3 text-sm text-destructive">{error}</div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={handleProcess} disabled={!file || isProcessing} className="min-w-[200px]">
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {processingStage || 'Processing...'}
              </>
            ) : (
              'Transcribe & Summarize'
            )}
          </Button>
          {isProcessing && (
            <span className="text-xs text-muted-foreground">This can take up to a minute depending on audio length.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
