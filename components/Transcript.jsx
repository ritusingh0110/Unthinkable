'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, FileAudio } from 'lucide-react';
import { useState } from 'react';

export default function Transcript({ text }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const wordCount = text.trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
            <FileAudio className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base">Full Transcript</CardTitle>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {wordCount.toLocaleString()} words · ~{readTime} min read
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={copy} aria-label={copied ? 'Copied' : 'Copy transcript'}>
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="pretty-scroll max-h-80 overflow-y-auto rounded-xl border bg-muted/20 p-4 sm:p-5 text-[13.5px] leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      </CardContent>
    </Card>
  );
}
