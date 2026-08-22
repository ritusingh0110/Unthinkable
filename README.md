# 🎙️ AI Meeting Summarizer

An AI-powered full-stack application that converts meeting audio recordings into structured, actionable summaries — automatically extracting key topics, decisions, action items, and important notes using Google Gemini.

---

## ✨ Features

- 🎵 Upload MP3 / WAV meeting recordings (up to 25 MB)
- 📝 AI-powered audio transcription via Google Gemini
- 🧠 Automatic structured summarization
- 📌 Extracts key topics, key decisions, and important notes
- ✅ Action items with **task**, **owner**, and **deadline**
- 🔐 API key kept server-side — never exposed to the browser
- 🖱️ Drag-and-drop file upload
- 📊 3-stage processing indicator (Upload → Transcribe → Summarize)
- ♻️ Retry handling and clear error/loading states
- 📱 Responsive, SaaS-style modern UI

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Frontend | React, Tailwind CSS |
| AI / LLM | Google Gemini API (`@google/genai`) |
| Backend | Next.js API Routes (Node.js) |
| Deployment | Vercel-ready |

---

## 🏗️ Architecture

```
MP3 / WAV Upload
      ↓
  Frontend (React)
      ↓
POST /api/transcribe
      ↓
  Google Gemini  →  Transcript
      ↓
POST /api/summarize
      ↓
  Google Gemini  →  Structured JSON
      ↓
  Frontend Display
      ↓
Summary · Key Topics · Key Decisions · Action Items · Notes
```

> All Gemini API calls are made **server-side only**. The API key is never sent to or accessible by the browser.

---

## 📂 Project Structure

```
Unthinkable/
├── app/
│   ├── api/
│   │   ├── transcribe/
│   │   │   └── route.js          # Audio → Transcript endpoint
│   │   └── summarize/
│   │       └── route.js          # Transcript → Summary endpoint
│   ├── page.js                   # Main page
│   └── globals.css
│
├── components/
│   ├── AudioUploader.jsx         # Drag-and-drop file upload
│   ├── ProcessingSteps.jsx       # 3-stage status indicator
│   ├── Transcript.jsx            # Transcript display
│   ├── Summary.jsx               # Summary + topics + decisions
│   └── ActionItems.jsx           # Action items table
│
├── lib/
│   └── gemini.js                 # Gemini client initialisation
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/ritusingh0110/Unthinkable.git
cd Unthinkable
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your free API key from [Google AI Studio](https://aistudio.google.com/apikey).

> ⚠️ Never commit `.env.local` to GitHub. It is already included in `.gitignore`.

### 4. Start the development server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Reference

### `POST /api/transcribe`

Accepts a meeting audio file and returns a full transcript.

**Request** — `multipart/form-data`
```
file: audio.mp3 | audio.wav
```

**Response**
```json
{
  "transcript": "Meeting transcript text..."
}
```

---

### `POST /api/summarize`

Accepts a transcript and returns a structured meeting summary.

**Request** — `application/json`
```json
{
  "transcript": "Meeting transcript text..."
}
```

**Response**
```json
{
  "summary": "Concise meeting summary",
  "key_topics": ["Topic 1", "Topic 2"],
  "key_decisions": ["Decision 1", "Decision 2"],
  "action_items": [
    {
      "task": "Complete project documentation",
      "owner": "Ritu",
      "deadline": "Friday, 5 PM"
    }
  ],
  "important_notes": ["Note 1", "Note 2"]
}
```

---

## 🔐 Security

- Gemini API key is stored in environment variables and **never exposed to the client**
- All AI calls are executed **server-side** via Next.js API routes
- `.env.local` is git-ignored — no secrets are committed to the repository
- Server-side validation, timeout protection, and error handling on all API endpoints

---

## 🚀 Build for Production

```bash
yarn next build
```

Verify there are no build errors before deploying.

---
🎥 **Demo Video:** https://drive.google.com/file/d/1q5JLpJuVTg8_-4PJO5hzWqpJKreM80xM/view?usp=drivesdk

## 👩‍💻 Author

**Ritu Singh**  
B.Tech — Computer Science & Engineering (Cyber Physical Systems)  
Vellore Institute of Technology, Chennai
