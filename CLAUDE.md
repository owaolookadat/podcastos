# PodcastOS — AI Podcast Post-Production Tool

## What This Is
PodcastOS automates podcast post-production for the "Makan Cakap" (吃饭说话) Malaysian Chinese podcast. Upload raw video → get edit-ready files for Premiere Pro/DaVinci Resolve.

**Users**: The production partner Bryan accesses this via a web URL on a VPS.

## Architecture

- **Framework**: Next.js 16 (App Router, TypeScript, Tailwind CSS, shadcn/ui)
- **Database**: SQLite via Drizzle ORM + better-sqlite3 (file: `data/podcastos.db`)
- **AI**: OpenAI Whisper API (transcription), Anthropic Claude Sonnet (clip analysis)
- **Media**: FFmpeg for audio extraction (MP3 16kHz mono)
- **Dev server**: Must use `--webpack` flag (Turbopack crashes with FATAL panics)

## Pipeline Flow (fully automatic after upload)

```
Upload video/audio → Extract audio (FFmpeg) → Transcribe (Whisper) → AI Analysis (Claude) → Export files
```

Zero clicks needed after upload. The pipeline is chained in `pipeline.service.ts`.

## Key Files

### Services (`src/lib/services/`)
- `pipeline.service.ts` — Chains: extractAudio → transcribe → analyze
- `ffmpeg.service.ts` — Extracts audio from video, gets duration
- `transcription.service.ts` — Whisper API (chunked for long episodes)
- `analysis.service.ts` — Claude AI clip analysis, cleans up old data on re-analysis
- `export.service.ts` — Generates EDL, SRT, chapter markers

### API Routes (`src/app/api/`)
- `episodes/` — CRUD for episodes
- `episodes/[id]/upload/` — Chunked upload (10MB chunks, Content-Range headers), triggers pipeline
- `episodes/[id]/transcribe/` — Manual transcription trigger
- `episodes/[id]/analyze/` — Manual analysis trigger
- `episodes/[id]/export/` — Download EDL/SRT/chapters (supports Chinese filenames via RFC 5987)

### Frontend Pages
- `page.tsx` — Homepage: episode list + guided empty state with workflow explainer
- `episodes/[id]/page.tsx` — Episode detail: pipeline progress, export hub (hero), top clips, expandable transcript/analysis

### Components
- `new-episode-dialog.tsx` — Upload dialog with drag & drop, progressive disclosure
- `analysis-report.tsx` — Full clip list with scores, per-clip SRT downloads
- `transcript-viewer.tsx` — Searchable transcript with timestamps

### Prompts
- `src/lib/prompts/clip-analysis.ts` — Scales clip count with episode duration (~1 clip per 5 min, min 8)

## Database Schema (`src/lib/db/schema.ts`)
- `episodes` — id, title, status, filePath, durationSeconds, etc.
- `transcripts` — fullText, segments (JSON array of Whisper segments)
- `analyses` — summary, clipRecommendations, longformNotes (JSON)
- `clips` — title, startTime, endTime, scores (hook/relatability/emotion/quotability/curiosity), transcript, suggestedCaption
- `jobs` — Background job tracking with progress

## Export Formats
- **Longform EDL** — Timeline with dead air + weak segments removed
- **Clips EDL** — Each AI-ranked clip as separate edit event
- **Full SRT** — Complete episode subtitles (timestamps match raw source)
- **Per-clip SRT** — Individual clip subtitles (timestamps start from 0:00)
- **Chapter Markers** — YouTube-ready timestamps

## Premiere Pro Workflow
1. Import raw video + Full SRT into Premiere
2. Import Longform EDL → cuts both video & subtitles together
3. Color grade, style captions, export
4. For clips: import Clips EDL, use per-clip SRTs

## Clip Scoring (1-10 each)
- **Hook** — Does it grab attention in first 3 seconds?
- **Relatability** — Will audience connect with this?
- **Emotion** — Emotional intensity
- **Quotability** — Shareable/memorable quotes
- **Curiosity** — Makes viewer want to watch more

## Known Issues / Decisions
- Turbopack crashes → using `--webpack` flag in dev
- Chinese filenames in HTTP headers → RFC 5987 encoding in export route
- Files stored locally in `data/uploads/` and `data/audio/` — implement 7-day cleanup later
- Re-analysis deletes old clips/analyses before inserting new ones
- Whisper handles Mandarin/English/Cantonese code-switching

## Environment Variables (`.env.local`)
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Deployment
- **VPS**: DigitalOcean droplet (Ubuntu 24.04, Singapore)
- **Requirements**: Node.js 20+, FFmpeg, git
- **Run**: `npm run build && npm start` (production on port 3000)
- **Process manager**: Use PM2 to keep it running: `pm2 start npm --name podcastos -- start`

## Dev
```bash
npm run dev -- --webpack   # must use webpack, not turbopack
```
