'use client';

import { CheckCircle2, Loader2, Circle, AlertCircle } from 'lucide-react';

const STEPS = [
  { key: 'upload', label: 'Upload' },
  { key: 'transcribe', label: 'Transcribe' },
  { key: 'summarize', label: 'Summarize' },
];

const ORDER = { idle: -1, upload: 0, transcribe: 1, summarize: 2, done: 3 };

export default function ProcessingSteps({ stage = 'idle', error = false }) {
  const current = ORDER[stage] ?? -1;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        {STEPS.map((step, idx) => {
          const isDone = current > idx || stage === 'done';
          const isActive = current === idx && !error;
          const isErrored = error && current === idx;

          return (
            <div key={step.key} className="flex-1 flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <StepIcon done={isDone} active={isActive} errored={isErrored} />
                <div className="min-w-0">
                  <div className={`text-xs font-medium truncate ${isActive ? 'text-foreground' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Step {idx + 1}
                  </div>
                  <div className={`text-sm truncate ${isErrored ? 'text-destructive' : isActive ? 'text-foreground' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </div>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="hidden sm:block flex-1 h-px bg-border relative overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${isDone ? 'w-full bg-primary' : isActive ? 'w-1/2 bg-primary animate-pulse' : 'w-0'} transition-all`}
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
  if (errored) return <AlertCircle className="h-5 w-5 text-destructive shrink-0" />;
  if (done) return <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />;
  if (active) return <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />;
  return <Circle className="h-5 w-5 text-muted-foreground shrink-0" />;
}
