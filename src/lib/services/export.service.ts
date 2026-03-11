import type { WhisperSegment, LongformNotes } from "../types";

/**
 * Convert seconds to SMPTE timecode (HH:MM:SS:FF) at 25fps
 * EDL standard uses this format
 */
function toTimecode(seconds: number, fps = 25): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * fps);
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}

/**
 * Convert seconds to SRT timestamp (HH:MM:SS,mmm)
 */
function toSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms).padStart(3, "0")}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

interface ClipData {
  title: string;
  startTime: number;
  endTime: number;
}

// ─── EDL EXPORTS ───────────────────────────────────────────────

/**
 * Generate EDL for longform edit — keeps good segments, removes dead air + weak segments
 */
export function generateLongformEdl(
  episodeTitle: string,
  durationSeconds: number,
  longformNotes: LongformNotes,
  filename: string
): string {
  // Collect all segments to REMOVE (dead air + weak segments)
  const removeSegments: { start: number; end: number }[] = [];

  for (const marker of longformNotes.deadAirMarkers) {
    removeSegments.push({ start: marker.startTime, end: marker.endTime });
  }
  for (const seg of longformNotes.weakSegments) {
    removeSegments.push({ start: seg.startTime, end: seg.endTime });
  }

  // Sort by start time
  removeSegments.sort((a, b) => a.start - b.start);

  // Merge overlapping remove segments
  const merged: { start: number; end: number }[] = [];
  for (const seg of removeSegments) {
    if (merged.length > 0 && seg.start <= merged[merged.length - 1].end) {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, seg.end);
    } else {
      merged.push({ ...seg });
    }
  }

  // Invert to get KEEP segments
  const keepSegments: { start: number; end: number }[] = [];
  let cursor = 0;
  for (const remove of merged) {
    if (cursor < remove.start) {
      keepSegments.push({ start: cursor, end: remove.start });
    }
    cursor = remove.end;
  }
  if (cursor < durationSeconds) {
    keepSegments.push({ start: cursor, end: durationSeconds });
  }

  // Build EDL
  let edl = `TITLE: ${episodeTitle} - Longform Edit\nFCM: NON-DROP FRAME\n\n`;
  let recordCursor = 0;

  keepSegments.forEach((seg, i) => {
    const eventNum = String(i + 1).padStart(3, "0");
    const srcIn = toTimecode(seg.start);
    const srcOut = toTimecode(seg.end);
    const recIn = toTimecode(recordCursor);
    const recOut = toTimecode(recordCursor + (seg.end - seg.start));
    recordCursor += seg.end - seg.start;

    edl += `${eventNum}  ${filename} V     C        ${srcIn} ${srcOut} ${recIn} ${recOut}\n`;
    edl += `${eventNum}  ${filename} A     C        ${srcIn} ${srcOut} ${recIn} ${recOut}\n`;
    edl += `* KEEP SEGMENT ${i + 1}\n\n`;
  });

  return edl;
}

/**
 * Generate EDL for shortform clips — each clip as a separate event
 */
export function generateClipsEdl(
  episodeTitle: string,
  clips: ClipData[],
  filename: string
): string {
  let edl = `TITLE: ${episodeTitle} - Shortform Clips\nFCM: NON-DROP FRAME\n\n`;

  clips.forEach((clip, i) => {
    const eventNum = String(i + 1).padStart(3, "0");
    const srcIn = toTimecode(clip.startTime);
    const srcOut = toTimecode(clip.endTime);
    const recIn = toTimecode(0);
    const recOut = toTimecode(clip.endTime - clip.startTime);

    edl += `${eventNum}  ${filename} V     C        ${srcIn} ${srcOut} ${recIn} ${recOut}\n`;
    edl += `${eventNum}  ${filename} A     C        ${srcIn} ${srcOut} ${recIn} ${recOut}\n`;
    edl += `* CLIP: ${clip.title}\n\n`;
  });

  return edl;
}

// ─── SRT EXPORTS ───────────────────────────────────────────────

/**
 * Generate full episode SRT from transcript segments
 */
export function generateFullSrt(segments: WhisperSegment[]): string {
  return segments
    .map((seg, i) => {
      return `${i + 1}\n${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}\n${seg.text}\n`;
    })
    .join("\n");
}

/**
 * Generate SRT for a single clip — timestamps reset to 0:00 (relative to clip start)
 */
export function generateClipSrt(
  segments: WhisperSegment[],
  clipStartTime: number,
  clipEndTime: number
): string {
  // Filter segments that overlap with the clip window
  const clipSegments = segments.filter(
    (seg) => seg.end > clipStartTime && seg.start < clipEndTime
  );

  return clipSegments
    .map((seg, i) => {
      // Offset timestamps relative to clip start
      const relativeStart = Math.max(0, seg.start - clipStartTime);
      const relativeEnd = Math.min(clipEndTime - clipStartTime, seg.end - clipStartTime);
      return `${i + 1}\n${toSrtTime(relativeStart)} --> ${toSrtTime(relativeEnd)}\n${seg.text}\n`;
    })
    .join("\n");
}

// ─── CHAPTER MARKERS ──────────────────────────────────────────

/**
 * Generate YouTube-style chapter timestamps (for description box)
 */
export function generateChapterMarkers(chapters: LongformNotes["chapters"]): string {
  return chapters
    .map((ch) => {
      const m = Math.floor(ch.startTime / 60);
      const s = Math.floor(ch.startTime % 60);
      return `${m}:${String(s).padStart(2, "0")} ${ch.title}`;
    })
    .join("\n");
}
