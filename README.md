# AI Meeting Summarizer

Upload a meeting audio file and get an accurate transcript, concise summary, key decisions, and actionable tasks — all extracted automatically using OpenAI's Whisper (speech-to-text) and GPT (language model).

## 1. Project Overview

**Problem.** Meetings produce useful information, but reviewing recordings is slow and manually writing notes/action items is error-prone.

**Solution.** A minimal Next.js web app that runs an audio file through the full pipeline:

```
Audio file  →  Whisper (ASR)  →  Transcript  →  GPT (LLM)  →  Structured JSON  →  UI
```

The result is a full transcript plus a concise summary, key topics, key decisions, action items (with owner + deadline when explicitly mentioned), and important notes.

## 2. Features

- Audio file upload with type/size validation
- Server-side speech-to-text transcription (OpenAI Whisper)
- AI-generated structured summary (OpenAI GPT)
- Key topics + key decisions extraction
- Action items with **owner** and **deadline** extraction
- Explicit `"Not specified"` when owner/deadline is missing (no hallucination)
- Friendly error handling for missing files, bad formats, oversized files, API failures, empty transcripts, invalid LLM responses
- Copy transcript to clipboard
- Responsive, mobile-friendly single-page UI

## 3. Architecture

```
┌──────────┐   file    ┌──────────────────────┐   audio    ┌──────────────┐
│ Frontend │ ───────▶ │ /api/transcribe (SSR) │ ─────────▶ │ OpenAI       │
│ (React)  │           └──────────┬───────────┘             │ Whisper API  │
└──────────┘                      │ transcript              └──────┬───────┘
     ▲                            ▼                                │
     │                    ┌───────────────┐                         │
     │      structured    │ /api/summarize │  ◀── transcript ───────┘
     │◀───── JSON ────── │  (SSR)         │
                          └──────┬─────────┘
                                 ▼
                          ┌───────────────┐
                          │ OpenAI GPT    │
                          │ (chat.completions,
                          │  json_object) │
                          └───────────────┘
```

The OpenAI API key stays on the server. The browser only talks to `/api/*` routes.

## 4. Tech Stack

- **Next.js 15 (App Router)** — single-repo full-stack (React frontend + Node API routes).
- **React 18** — UI.
- **Tailwind CSS** + **shadcn/ui** — clean typography and layout with minimal custom CSS.
- **OpenAI REST API** (called via native `fetch`) — Whisper for ASR, `gpt-4o-mini` with `response_format: json_object` for summarization. No extra SDK dependency.

No database is used — persistence isn't required by the assignment.

## 5. Project Structure

```
/app
├── app/
│   ├── api/
│   │   ├── transcribe/route.js   # POST /api/transcribe (Whisper)
│   │   └── summarize/route.js    # POST /api/summarize  (GPT structured JSON)
│   ├── page.js                   # Single-page UI
│   ├── layout.js                 # App shell / metadata
│   └── globals.css
├── components/
│   ├── AudioUploader.jsx
│   ├── Transcript.jsx
│   ├── Summary.jsx
│   └── ActionItems.jsx
├── lib/
│   └── openai.js                 # Server-side OpenAI helpers (Whisper + GPT)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 6. Setup Instructions

```bash
# 1. Install dependencies
yarn install    # or: npm install

# 2. Configure your OpenAI key
cp .env.example .env.local
# open .env.local and set:
# OPENAI_API_KEY=sk-...

# 3. Run the dev server
yarn dev        # or: npm run dev

# open http://localhost:3000
```

## 7. Environment Variables

| Variable         | Required | Description                                                    |
|------------------|----------|----------------------------------------------------------------|
| `OPENAI_API_KEY` | ✅        | OpenAI API key. Used server-side only. Never sent to browser. |

`.env.example` contains only the variable name (empty value). Real values must be placed in `.env.local` (already git-ignored).

## 8. How It Works (Data Flow)

1. User selects an audio file in the browser.
2. Frontend `POST`s a `multipart/form-data` request to `/api/transcribe`.
3. `/api/transcribe`:
   - Validates file presence, size (≤ 25 MB) and type.
   - Forwards the file to OpenAI `POST /v1/audio/transcriptions` with `model: whisper-1`.
   - Returns `{ transcript: string }`.
4. Frontend then `POST`s the transcript as JSON to `/api/summarize`.
5. `/api/summarize`:
   - Sends the transcript to OpenAI `POST /v1/chat/completions` with `model: gpt-4o-mini` and `response_format: json_object`.
   - Uses a system prompt that forbids hallucination and enforces the exact JSON schema.
   - Normalizes the response and returns it.
6. Frontend renders the summary, topics, decisions, action items and full transcript.

## 9. LLM Prompt Strategy

A fixed system prompt instructs the model to:

- Identify main topics, decisions, and actionable tasks.
- Extract each task's owner and deadline **only if explicitly mentioned**; otherwise return `"Not specified"`.
- Strip greetings, filler and irrelevant conversation.
- Preserve technical, business, numerical and deadline-related information.
- Return **only** valid JSON matching the schema:

```json
{
  "summary": "...",
  "key_topics": [],
  "key_decisions": [],
  "action_items": [{ "task": "...", "owner": "...", "deadline": "..." }],
  "important_notes": []
}
```

The transcript is passed as the *user* message wrapped in `<<<TRANSCRIPT_START>>> ... <<<TRANSCRIPT_END>>>` markers and labeled as untrusted user data, so any instructions inside the transcript are treated as content, not commands.

`temperature` is set to `0.2` and `response_format` is `{ type: "json_object" }` for reliable structured output.

## 10. API Endpoints

### `POST /api/transcribe`

**Request:** `multipart/form-data` with a `file` field containing the audio.

**Response 200:**
```json
{ "transcript": "Full transcript text..." }
```

**Errors:** `400` (missing/invalid file), `413` (>25MB), `415` (unsupported type), `422` (empty transcript), `500` (API/server failure).

### `POST /api/summarize`

**Request:** `application/json`
```json
{ "transcript": "..." }
```

**Response 200:**
```json
{
  "summary": "...",
  "key_topics": ["..."],
  "key_decisions": ["..."],
  "action_items": [{ "task": "...", "owner": "...", "deadline": "..." }],
  "important_notes": ["..."]
}
```

**Errors:** `400` (missing/invalid transcript), `413` (too long), `500` (LLM/server failure).

## 11. Error Handling

Friendly, user-facing messages are shown for: no file selected, invalid file type, file too large, upload failure, transcription failure, empty transcript, LLM failure, malformed LLM JSON, and unexpected server errors. Raw stack traces are logged server-side only.

## 12. Example Output

```json
{
  "summary": "The team reviewed Q3 launch timeline and agreed to move the beta to Aug 15. Marketing owns the launch page; engineering owns the API cutover.",
  "key_topics": ["Q3 launch timeline", "Beta scope", "Marketing site", "API cutover"],
  "key_decisions": ["Beta launch moved from Aug 1 to Aug 15", "Feature X descoped from beta"],
  "action_items": [
    { "task": "Publish updated launch page", "owner": "Priya", "deadline": "Aug 10" },
    { "task": "Complete API v2 cutover",     "owner": "Rahul", "deadline": "Aug 13" },
    { "task": "Prepare press briefing deck",  "owner": "Not specified", "deadline": "Not specified" }
  ],
  "important_notes": ["Legal review required before external announcement"]
}
```

## 13. Limitations

- OpenAI Whisper accepts files up to 25 MB.
- No persistence — results disappear on page refresh.
- No speaker diarization (Whisper doesn't provide labeled speakers).
- Very long transcripts (>~120k chars) are rejected rather than chunked.
- Depends on OpenAI availability and account quotas.

## 14. Future Improvements

- Speaker diarization / labeled speakers
- Timestamped transcripts
- Long-transcript chunking + map-reduce summarization
- Persistent meeting history
- Export to PDF / Markdown
- Calendar / task-manager integrations
- Multilingual UI

## 15. Security Notes

- `OPENAI_API_KEY` is read only on the server.
- The key is never logged and never returned in API responses.
- `.env` and `.env.local` are git-ignored.
- `.env.example` contains no real secrets.
