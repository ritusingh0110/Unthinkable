import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/gemini';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME_PREFIX = 'audio/';
const ALLOWED_EXTS = ['mp3', 'wav', 'm4a', 'mp4', 'mpeg', 'mpga', 'webm', 'ogg', 'flac'];

function extOf(name = '') {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

function mapGeminiError(err) {
  const raw = String(err?.message || err || '');
  const status = err?.status;
  const code = err?.code;

  if (code === 'TIMEOUT' || /timed out/i.test(raw)) {
    return { code: 504, msg: 'Transcription timed out. Please try a shorter recording.' };
  }
  if (status === 400 && /empty/i.test(raw)) {
    return { code: 400, msg: 'The uploaded audio file is empty.' };
  }
  if (status === 401 || status === 403 || /API key|permission|unauthorized/i.test(raw)) {
    return { code: 401, msg: 'Gemini rejected the API key. Please verify GEMINI_API_KEY.' };
  }
  if (status === 429 || /quota|rate limit|resource_exhausted|RESOURCE_EXHAUSTED/i.test(raw)) {
    return { code: 429, msg: 'Gemini quota or rate limit reached. Please try again in a moment.' };
  }
  if (status === 413 || /too large/i.test(raw)) {
    return { code: 413, msg: 'Audio file is too large.' };
  }
  if (/UNSUPPORTED|unsupported|invalid_argument|INVALID_ARGUMENT/i.test(raw)) {
    return { code: 415, msg: 'Gemini could not process this audio format. Please try MP3 or WAV.' };
  }
  return { code: 502, msg: 'Unable to transcribe the audio. Please try again in a moment.' };
}

export async function POST(request) {
  try {
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { error: 'Invalid form data. Please upload an audio file.' },
        { status: 400 }
      );
    }

    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No audio file provided.' }, { status: 400 });
    }

    const filename = file.name || 'audio';
    const size = file.size || 0;
    const type = file.type || '';
    const ext = extOf(filename);

    if (size === 0) {
      return NextResponse.json({ error: 'The uploaded file is empty.' }, { status: 400 });
    }
    if (size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File is too large (max ${Math.floor(MAX_BYTES / (1024 * 1024))}MB).` },
        { status: 413 }
      );
    }

    const looksAudio =
      type.startsWith(ALLOWED_MIME_PREFIX) ||
      ALLOWED_EXTS.includes(ext) ||
      type === 'video/mp4' ||
      type === 'video/webm';
    if (!looksAudio) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed: ${ALLOWED_EXTS.join(', ')}.` },
        { status: 415 }
      );
    }

    const transcript = await transcribeAudio(file, filename);

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'The transcription came back empty. The audio may be silent or unclear.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ transcript });
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
    // Log server-side without leaking the key.
    console.error('[/api/transcribe] error:', err?.status, err?.message || err);
    const mapped = mapGeminiError(err);
    return NextResponse.json({ error: mapped.msg }, { status: mapped.code });
  }
}
