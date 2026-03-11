import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { episodes, transcripts, analyses, clips } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  generateLongformEdl,
  generateClipsEdl,
  generateFullSrt,
  generateClipSrt,
  generateChapterMarkers,
} from "@/lib/services/export.service";
import type { WhisperSegment, LongformNotes } from "@/lib/types";

/**
 * Build Content-Disposition header that works with non-ASCII (Chinese, etc.) filenames.
 * Uses RFC 5987 filename*=UTF-8'' encoding with an ASCII fallback.
 */
function contentDisposition(filename: string): string {
  // ASCII-only fallback: strip non-ASCII characters
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/_+/g, "_");
  // UTF-8 encoded version for modern browsers
  const utf8Encoded = encodeURIComponent(filename).replace(/['()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${utf8Encoded}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const url = new URL(req.url);
  const format = url.searchParams.get("format");
  const clipId = url.searchParams.get("clipId");

  const episode = db.select().from(episodes).where(eq(episodes.id, id)).get();
  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  const safeTitle = episode.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff\s-]/g, "").trim();
  const sourceFilename = episode.originalFilename.replace(/\.[^.]+$/, "");

  // ─── Full SRT ───
  if (format === "srt") {
    const transcript = db.select().from(transcripts).where(eq(transcripts.episodeId, id)).get();
    if (!transcript) {
      return NextResponse.json({ error: "No transcript available" }, { status: 404 });
    }

    const segments: WhisperSegment[] = JSON.parse(transcript.segments);
    const srt = generateFullSrt(segments);

    return new Response(srt, {
      headers: {
        "Content-Type": "application/x-subrip",
        "Content-Disposition": contentDisposition(`${safeTitle}.srt`),
      },
    });
  }

  // ─── Clip SRT ───
  if (format === "clip-srt" && clipId) {
    const transcript = db.select().from(transcripts).where(eq(transcripts.episodeId, id)).get();
    const clip = db.select().from(clips).where(eq(clips.id, clipId)).get();
    if (!transcript || !clip) {
      return NextResponse.json({ error: "Clip or transcript not found" }, { status: 404 });
    }

    const segments: WhisperSegment[] = JSON.parse(transcript.segments);
    const srt = generateClipSrt(segments, clip.startTime, clip.endTime);
    const clipTitle = clip.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff\s-]/g, "").trim();

    return new Response(srt, {
      headers: {
        "Content-Type": "application/x-subrip",
        "Content-Disposition": contentDisposition(`${clipTitle}.srt`),
      },
    });
  }

  // ─── Longform EDL ───
  if (format === "longform-edl") {
    const analysis = db.select().from(analyses).where(eq(analyses.episodeId, id)).get();
    if (!analysis) {
      return NextResponse.json({ error: "No analysis available" }, { status: 404 });
    }

    const longformNotes: LongformNotes = JSON.parse(analysis.longformNotes);
    const edl = generateLongformEdl(
      episode.title,
      episode.durationSeconds ?? 0,
      longformNotes,
      sourceFilename
    );

    return new Response(edl, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": contentDisposition(`${safeTitle} - Longform Edit.edl`),
      },
    });
  }

  // ─── Clips EDL ───
  if (format === "clips-edl") {
    const episodeClips = db.select().from(clips).where(eq(clips.episodeId, id)).all();
    if (episodeClips.length === 0) {
      return NextResponse.json({ error: "No clips available" }, { status: 404 });
    }

    const sortedClips = episodeClips.sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0));
    const edl = generateClipsEdl(
      episode.title,
      sortedClips.map((c) => ({ title: c.title, startTime: c.startTime, endTime: c.endTime })),
      sourceFilename
    );

    return new Response(edl, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": contentDisposition(`${safeTitle} - Clips.edl`),
      },
    });
  }

  // ─── Chapter Markers ───
  if (format === "chapters") {
    const analysis = db.select().from(analyses).where(eq(analyses.episodeId, id)).get();
    if (!analysis) {
      return NextResponse.json({ error: "No analysis available" }, { status: 404 });
    }

    const longformNotes: LongformNotes = JSON.parse(analysis.longformNotes);
    const chapters = generateChapterMarkers(longformNotes.chapters);

    return new Response(chapters, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": contentDisposition(`${safeTitle} - Chapters.txt`),
      },
    });
  }

  return NextResponse.json({ error: "Invalid format. Use: srt, clip-srt, longform-edl, clips-edl, chapters" }, { status: 400 });
}
