import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { getConfig } from "../config";
import { getDb } from "../db";
import { episodes, transcripts } from "../db/schema";
import { eq } from "drizzle-orm";
import { jobManager } from "../jobs/job-manager";
import { extractAudioSegment, getVideoDuration } from "./ffmpeg.service";
import type { WhisperSegment } from "../types";

const SEGMENT_DURATION = 900; // 15 minutes in seconds

export async function transcribeEpisode(episodeId: string): Promise<void> {
  const config = getConfig();
  const db = getDb();
  const jobId = jobManager.createJob(episodeId, "transcribe");
  const startTime = Date.now();

  try {
    const episode = db
      .select()
      .from(episodes)
      .where(eq(episodes.id, episodeId))
      .get();
    if (!episode) throw new Error("Episode not found");
    if (!episode.audioPath) throw new Error("Audio not extracted yet");

    await db
      .update(episodes)
      .set({ status: "transcribing", updatedAt: new Date().toISOString() })
      .where(eq(episodes.id, episodeId));

    const openai = new OpenAI({ apiKey: config.openaiApiKey });

    // Get audio duration
    const duration = episode.durationSeconds || await getVideoDuration(episode.audioPath);
    const segmentCount = Math.ceil(duration / SEGMENT_DURATION);
    const allSegments: WhisperSegment[] = [];

    jobManager.updateProgress(
      jobId,
      0.05,
      `Transcribing ${segmentCount} segment${segmentCount > 1 ? "s" : ""}...`
    );

    for (let i = 0; i < segmentCount; i++) {
      const segStartTime = i * SEGMENT_DURATION;
      const segmentPath = path.join(
        config.dataDir,
        "audio",
        `${episodeId}_seg${i}.mp3`
      );

      // Extract segment
      await extractAudioSegment(
        episode.audioPath,
        segmentPath,
        segStartTime,
        SEGMENT_DURATION
      );

      jobManager.updateProgress(
        jobId,
        0.05 + ((i + 0.5) / segmentCount) * 0.85,
        `Transcribing segment ${i + 1} of ${segmentCount}...`
      );

      // Send to Whisper API
      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(segmentPath),
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["segment"],
        prompt:
          "This is a Malaysian Chinese podcast that code-switches between Mandarin Chinese, English, and Cantonese.",
      });

      // Adjust timestamps with segment offset
      const rawSegments = (response as unknown as { segments?: Array<{ start: number; end: number; text: string }> }).segments || [];
      const adjusted: WhisperSegment[] = rawSegments.map((seg, idx) => ({
        id: allSegments.length + idx,
        start: seg.start + segStartTime,
        end: seg.end + segStartTime,
        text: seg.text.trim(),
        language: (response as unknown as { language?: string }).language,
      }));
      allSegments.push(...adjusted);

      // Clean up segment file
      try {
        fs.unlinkSync(segmentPath);
      } catch {
        // ignore cleanup errors
      }

      jobManager.updateProgress(
        jobId,
        0.05 + ((i + 1) / segmentCount) * 0.85,
        `Transcribed segment ${i + 1} of ${segmentCount}`
      );
    }

    // Assemble full transcript
    const fullText = allSegments.map((s) => s.text).join(" ");

    jobManager.updateProgress(jobId, 0.95, "Saving transcript...");

    // Save to database
    db.insert(transcripts)
      .values({
        id: nanoid(),
        episodeId,
        fullText,
        language: "multilingual",
        segments: JSON.stringify(allSegments),
        modelUsed: "whisper-1",
        processingTimeMs: Date.now() - startTime,
        createdAt: new Date().toISOString(),
      })
      .run();

    await db
      .update(episodes)
      .set({ status: "transcribed", updatedAt: new Date().toISOString() })
      .where(eq(episodes.id, episodeId));

    jobManager.completeJob(jobId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transcription failed";
    jobManager.failJob(jobId, message);
    await db
      .update(episodes)
      .set({
        status: "error",
        errorMessage: message,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(episodes.id, episodeId));
    throw error;
  }
}
