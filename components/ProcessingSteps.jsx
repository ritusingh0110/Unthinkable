'use client';

import { CheckCircle2, Loader2, Circle, AlertCircle } from 'lucide-react';

const STEPS = [
  { key: 'upload', label: 'Upload', hint: 'Sending your audio' },
  { key: 'transcribe', label: 'Transcribe', hint: 'OpenAI Whisper' },
  { key: 'summarize', label: 'Summarize', hint: 'OpenAI GPT' },
];

const ORDER = { idle: -1, upload: 0, transcribe: 1, summarize: 2, done: 3 };

export default function ProcessingSteps({ stage = 'idle', error = false }) {
  const current = ORDER[stage] ?? -1;

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-stretch gap-3 sm:gap-4">
        {STEPS.map((step, idx) => {
          const isDone = current > idx || stage === 'done';
          const isActive = current === idx && !error;
          const isErrored = error && current === idx;
          const isFuture = current < idx;

          return (
            <div key={step.key} className="flex-1 flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 border transition-colors ${
                    isErrored
                      ? 'bg-destructive/10 border-destructive/30 text-destructive'
                      : isDone
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/40 border-border text-muted-foreground'
                  }`}
                >
                  <StepIcon done={isDone} active={isActive} errored={isErrored} />
                </div>
                <div className="min-w-0">
                  <div className={`text-[10px] font-medium uppercase tracking-wider ${
                    isFuture ? 'text-muted-foreground/70' : 'text-muted-foreground'
                  }`}>
                    Step {idx + 1}
                  </div>
                  <div className={`text-sm truncate ${
                    isErrored
                      ? 'text-destructive font-medium'
                      : isDone
                      ? 'text-foreground font-medium'
                      : isActive
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground/80 truncate hidden sm:block">{step.hint}</div>
                </div>
              </div>

              {idx < STEPS.length - 1 && (
                <div className="hidden sm:block flex-1 h-px bg-border relative overflow-hidden self-center">
                  <div
                    className={`absolute inset-y-0 left-0 h-full transition-all duration-500 ease-out ${
                      isDone ? 'w-full bg-primary' : isActive ? 'w-1/2 bg-primary animate-soft-pulse' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepIcon({ done, active, errored }) {
  if (errored) return <AlertCircle className="h-4.5 w-4.5" />;
  if (done) return <CheckCircle2 className="h-4.5 w-4.5" />;
  if (active) return <Loader2 className="h-4.5 w-4.5 animate-spin" />;
  return <Circle className="h-4.5 w-4.5" />;
}
