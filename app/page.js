'use client';

import { useState } from 'react';
import AudioUploader from '@/components/AudioUploader';
import Transcript from '@/components/Transcript';
import Summary from '@/components/Summary';
import ActionItems from '@/components/ActionItems';
import ProcessingSteps from '@/components/ProcessingSteps';
import { AlertCircle, Mic, Sparkles, ShieldCheck, Zap, RefreshCw, FileText, ListChecks, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Client-side hard timeout so the UI is NEVER stuck indefinitely.
const CLIENT_TIMEOUT_MS = 10 * 60 * 1000;

function fetchWithTimeout(url, opts = {}, ms = CLIENT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stageKey, setStageKey] = useState('idle');
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
      {/* Top nav */}
      <nav className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-6xl h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center shadow-sm">
              <Mic className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight text-sm sm:text-base">Meeting Summarizer</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> Whisper + GPT</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Server-side keys</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-grid-slate opacity-60" />
        <div aria-hidden className="absolute -top-32 -right-32 -z-10 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 -left-24 -z-10 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="container max-w-6xl px-4 py-14 sm:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 backdrop-blur px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-soft-pulse" />
              AI meeting notes in one click
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
              Turn recordings into <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">decisions and action items</span>.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Upload a meeting audio file and get an accurate transcript, a concise summary, key topics, decisions,
              and action items — with owner and deadline extracted when explicitly mentioned.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> Powered by OpenAI Whisper + GPT</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> API key stays on the server</span>
              <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" /> Structured JSON output</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className="container max-w-6xl px-4 py-10 sm:py-12">
        <div className="grid gap-6">
          <AudioUploader
            onProcess={handleProcess}
            isProcessing={isProcessing}
            processingStage={stageLabel}
          />

          {(isProcessing || hasResults || error) && (
            <div className="animate-fade-rise">
              <ProcessingSteps stage={stageKey} error={Boolean(error)} />
            </div>
          )}

          {error && (
            <div className="animate-fade-rise flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive p-4 text-sm">
              <div className="flex gap-3 flex-1">
                <div className="h-9 w-9 rounded-md bg-destructive/10 grid place-items-center shrink-0">
                  <AlertCircle className="h-4.5 w-4.5" />
                </div>
                <div className="pt-1">
                  <div className="font-medium text-destructive">Something went wrong</div>
                  <div className="text-destructive/90 mt-0.5">{error}</div>
                </div>
              </div>
              {lastFile && (
                <Button variant="outline" size="sm" onClick={retry} disabled={isProcessing} className="self-start sm:self-auto">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
                </Button>
              )}
            </div>
          )}

          {!isProcessing && !hasResults && !error && (
            <div className="grid gap-4 sm:grid-cols-3">
              <FeatureBullet
                icon={FileText}
                title="Accurate transcript"
                text="Full text of the meeting, ready to copy or reference."
              />
              <FeatureBullet
                icon={ListChecks}
                title="Clear decisions"
                text="Key topics and decisions surfaced from the conversation."
              />
              <FeatureBullet
                icon={CheckSquare}
                title="Actionable tasks"
                text="Tasks with owner and deadline when explicitly mentioned."
              />
            </div>
          )}

          {hasResults && (
            <div className="space-y-6 animate-fade-rise">
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
        </div>

        <footer className="mt-16 pt-6 border-t text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>Audio → Whisper (ASR) → Transcript → GPT (structured JSON) → UI</div>
          <div>Built with Next.js · Tailwind · OpenAI</div>
        </footer>
      </main>
    </div>
  );
}

function FeatureBullet({ icon: Icon, title, text }) {
  return (
    <div className="group rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow">
      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center mb-3">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{text}</div>
    </div>
  );
}

export default App;
