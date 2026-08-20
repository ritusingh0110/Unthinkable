import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/openai';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_BYTES = 25 * 1024 * 1024; // OpenAI Whisper limit is 25MB
const ALLOWED_MIME_PREFIX = 'audio/';
const ALLOWED_EXTS = ['mp3', 'wav', 'm4a', 'mp4', 'mpeg', 'mpga', 'webm', 'ogg', 'flac'];

function extOf(name = '') {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
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
      return NextResponse.json(
        { error: 'No audio file provided.' },
        { status: 400 }
      );
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

    const looksAudio = type.startsWith(ALLOWED_MIME_PREFIX) || ALLOWED_EXTS.includes(ext) || type === 'video/mp4' || type === 'video/webm';
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
        { error: 'Server is missing the OPENAI_API_KEY environment variable. Please configure it and restart the server.' },
        { status: 500 }
      );
    }
    // Log server-side, return friendly message to user
    console.error('[/api/transcribe] error:', err?.message || err);
    return NextResponse.json(
      { error: 'Unable to transcribe the audio. Please check the file and try again.' },
      { status: 500 }
    );
  }
}
