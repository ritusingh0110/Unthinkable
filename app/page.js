'use client';

import { useState } from 'react';
import AudioUploader from '@/components/AudioUploader';
import Transcript from '@/components/Transcript';
import Summary from '@/components/Summary';
import ActionItems from '@/components/ActionItems';
import { AlertCircle, Mic } from 'lucide-react';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState(null);

  async function handleProcess(file) {
    setError('');
    setTranscript('');
    setSummary(null);
    setIsProcessing(true);

    try {
      // Step 1: Upload + transcribe
      setStage('Uploading audio...');
      const fd = new FormData();
      fd.append('file', file, file.name);

      setStage('Transcribing meeting...');
      const tRes = await fetch('/api/transcribe', { method: 'POST', body: fd });
      const tJson = await tRes.json().catch(() => ({}));
      if (!tRes.ok) {
        throw new Error(tJson?.error || 'Transcription failed.');
      }
      const tx = (tJson.transcript || '').trim();
      if (!tx) throw new Error('The transcription came back empty.');
      setTranscript(tx);

      // Step 2: Summarize
      setStage('Generating summary...');
      const sRes = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: tx }),
      });
      const sJson = await sRes.json().catch(() => ({}));
      if (!sRes.ok) {
        throw new Error(sJson?.error || 'Summarization failed.');
      }

      setStage('Almost done...');
      setSummary(sJson);
    } catch (e) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
      setStage('');
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-4xl py-10 px-4">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
              <Mic className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">AI Meeting Summarizer</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Upload a meeting recording and get an accurate transcript, concise summary,
            key decisions, and actionable tasks.
          </p>
        </header>

        <AudioUploader
          onProcess={handleProcess}
          isProcessing={isProcessing}
          processingStage={stage}
        />

        {error && (
          <div className="mt-6 flex gap-3 rounded-md border border-destructive/40 bg-destructive/5 text-destructive p-4 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {(transcript || summary) && (
          <div className="mt-8 space-y-6">
            {summary && (
              <>
                <Summary
                  summary={summary.summary}
                  key_topics={summary.key_topics}
                  key_decisions={summary.key_decisions}
                  important_notes={summary.important_notes}
                />
                <ActionItems items={summary.action_items} />
              </>
            )}
            {transcript && <Transcript text={transcript} />}
          </div>
        )}

        <footer className="mt-12 pt-6 border-t text-xs text-muted-foreground">
          Audio → Whisper (ASR) → Transcript → GPT (structured JSON) → UI
        </footer>
      </div>
    </div>
  );
}

export default App;
