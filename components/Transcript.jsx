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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <FileAudio className="h-4 w-4 text-primary" />
            Full Transcript
          </CardTitle>
          <div className="mt-1 text-xs text-muted-foreground">{wordCount.toLocaleString()} words</div>
        </div>
        <Button variant="outline" size="sm" onClick={copy} aria-label={copied ? 'Copied' : 'Copy transcript'}>
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="max-h-80 overflow-y-auto rounded-md border bg-muted/20 p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      </CardContent>
    </Card>
  );
}
