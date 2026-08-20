import { NextResponse } from 'next/server';
import { summarizeTranscript } from '@/lib/gemini';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_TRANSCRIPT_CHARS = 120000; // Comfortable within gemini-2.5-flash context budget

function mapGeminiError(err) {
  const raw = String(err?.message || err || '');
  const status = err?.status;
  const code = err?.code;

  if (code === 'TIMEOUT' || /timed out/i.test(raw)) {
    return { code: 504, msg: 'Summarization timed out. Please try again.' };
  }
  if (status === 401 || status === 403 || /API key|permission|unauthorized/i.test(raw)) {
    return { code: 401, msg: 'Gemini rejected the API key. Please verify GEMINI_API_KEY.' };
  }
  if (status === 429 || /quota|rate limit|resource_exhausted|RESOURCE_EXHAUSTED/i.test(raw)) {
    return { code: 429, msg: 'Gemini quota or rate limit reached. Please try again in a moment.' };
  }
  if (/invalid JSON|empty response/i.test(raw)) {
    return { code: 502, msg: 'The AI returned an unexpected response. Please try again.' };
  }
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
        {
          error:
            'Server is missing the GEMINI_API_KEY environment variable. Please configure it and restart the server.',
        },
        { status: 500 }
      );
    }
    console.error('[/api/summarize] error:', err?.status, err?.message || err);
    const mapped = mapGeminiError(err);
    return NextResponse.json({ error: mapped.msg }, { status: mapped.code });
  }
}
