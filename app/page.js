'use client';

import { useState } from 'react';
import AudioUploader from '@/components/AudioUploader';
import Transcript from '@/components/Transcript';
import Summary from '@/components/Summary';
import ActionItems from '@/components/ActionItems';
import ProcessingSteps from '@/components/ProcessingSteps';
import { AlertCircle, Mic, Sparkles, ShieldCheck, Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Client-side hard timeout so the UI is NEVER stuck indefinitely.
// 10 minutes covers even a full-length meeting on Whisper.
const CLIENT_TIMEOUT_MS = 10 * 60 * 1000;

function fetchWithTimeout(url, opts = {}, ms = CLIENT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stageKey, setStageKey] = useState('idle'); // 'upload' | 'transcribe' | 'summarize' | 'done'
  const [stageLabel, setStageLabel] = useState('');
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState(null);
  const [lastFile, setLastFile] = useState(null);

  async function handleProcess(file) {
    setError('');
    setTranscript('');
    setSummary(null);
    setIsProcessing(true);
    setLastFile(file);

    try {
      // Step 1: Upload + transcribe
      setStageKey('upload');
      setStageLabel('Uploading audio...');
      const fd = new FormData();
      fd.append('file', file, file.name || 'audio.mp3');

      setStageKey('transcribe');
      setStageLabel('Transcribing meeting...');
      const tRes = await fetchWithTimeout('/api/transcribe', { method: 'POST', body: fd });
      const tJson = await tRes.json().catch(() => ({}));
      if (!tRes.ok) {
        throw new Error(tJson?.error || 'Transcription failed. Please try again.');
      }
      const tx = (tJson.transcript || '').trim();
      if (!tx) throw new Error('The transcription came back empty. The audio may be silent or unclear.');
      setTranscript(tx);

      // Step 2: Summarize
      setStageKey('summarize');
      setStageLabel('Generating summary...');
      const sRes = await fetchWithTimeout('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: tx }),
      });
      const sJson = await sRes.json().catch(() => ({}));
      if (!sRes.ok) {
        throw new Error(sJson?.error || 'Summarization failed. Please try again.');
      }

      setSummary(sJson);
      setStageKey('done');
      setStageLabel('');
    } catch (e) {
      if (e?.name === 'AbortError') {
        setError('The request timed out. Please try a shorter recording or try again.');
      } else {
        setError(e?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  }

  function retry() {
    if (lastFile) handleProcess(lastFile);
  }

  const hasResults = Boolean(transcript || summary);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero background */}
      <div className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-background"
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="container max-w-5xl px-4 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Mic className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">AI Meeting Summarizer</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight max-w-2xl">
            Turn meeting recordings into <span className="text-primary">clear decisions and action items</span>.
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Upload an audio file and get an accurate transcript, a concise summary, key topics,
            key decisions, and action items — with owner and deadline extracted when mentioned.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> Powered by OpenAI Whisper + GPT</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> API key stays on the server</span>
            <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" /> Structured JSON output</span>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl px-4 py-8 sm:py-10">
        <AudioUploader
          onProcess={handleProcess}
          isProcessing={isProcessing}
          processingStage={stageLabel}
        />

        {(isProcessing || hasResults || error) && (
          <div className="mt-6">
            <ProcessingSteps stage={stageKey} error={Boolean(error)} />
          </div>
        )}

        {error && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 text-destructive p-4 text-sm">
            <div className="flex gap-3 flex-1">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div><strong className="font-medium">Something went wrong.</strong> {error}</div>
            </div>
            {lastFile && (
              <Button variant="outline" size="sm" onClick={retry} disabled={isProcessing} className="self-start sm:self-auto">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
              </Button>
            )}
          </div>
        )}

        {!isProcessing && !hasResults && !error && (
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <FeatureBullet title="Accurate transcript" text="Full text of the meeting, ready to copy or reference." />
            <FeatureBullet title="Clear decisions" text="Key topics and decisions surfaced from the conversation." />
            <FeatureBullet title="Actionable tasks" text="Tasks with owner and deadline when explicitly mentioned." />
          </div>
        )}

        {hasResults && (
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

        <footer className="mt-14 pt-6 border-t text-xs text-muted-foreground text-center">
          Audio → Whisper (ASR) → Transcript → GPT (structured JSON) → UI
        </footer>
      </div>
    </div>
  );
}

function FeatureBullet({ title, text }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{text}</div>
    </div>
  );
}

export default App;
