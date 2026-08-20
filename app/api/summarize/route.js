import { NextResponse } from 'next/server';
import { summarizeTranscript } from '@/lib/openai';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_TRANSCRIPT_CHARS = 120000; // Roughly ~30k tokens, safe for gpt-4o-mini 128k context

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const transcript = typeof body?.transcript === 'string' ? body.transcript.trim() : '';
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required.' }, { status: 400 });
    }
    if (transcript.length > MAX_TRANSCRIPT_CHARS) {
      return NextResponse.json(
        { error: `Transcript is too long (${transcript.length} chars). Please shorten it.` },
        { status: 413 }
      );
    }

    const result = await summarizeTranscript(transcript);
    return NextResponse.json(result);
  } catch (err) {
    if (err && err.code === 'MISSING_API_KEY') {
      return NextResponse.json(
        { error: 'Server is missing the OPENAI_API_KEY environment variable. Please configure it and restart the server.' },
        { status: 500 }
      );
    }
    console.error('[/api/summarize] error:', err?.message || err);
    const msg = err?.message?.includes('invalid JSON')
      ? 'The AI returned an unexpected response. Please try again.'
      : 'Unable to generate the summary. Please try again.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
