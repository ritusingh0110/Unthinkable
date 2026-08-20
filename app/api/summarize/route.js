import { NextResponse } from 'next/server';
import { summarizeTranscript } from '@/lib/openai';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_TRANSCRIPT_CHARS = 120000; // Roughly ~30k tokens, safe for gpt-4o-mini 128k context

function mapOpenAIError(err) {
  const raw = err?.message || '';
  const status = err?.status;
  if (status === 401) return { code: 401, msg: 'OpenAI rejected the API key. Please verify OPENAI_API_KEY.' };
  if (status === 429 || /quota|rate limit|billing/i.test(raw)) {
    return { code: 429, msg: 'OpenAI quota or rate limit reached. Please check your plan/billing and try again.' };
  }
  if (/invalid JSON/i.test(raw)) return { code: 502, msg: 'The AI returned an unexpected response. Please try again.' };
  if (status === 504 || /timed out/i.test(raw)) return { code: 504, msg: 'Summarization timed out. Please try again.' };
  return { code: 502, msg: 'Unable to generate the summary. Please try again.' };
}

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
    console.error('[/api/summarize] error:', err?.status, err?.message || err);
    const mapped = mapOpenAIError(err);
    return NextResponse.json({ error: mapped.msg }, { status: mapped.code });
  }
}
