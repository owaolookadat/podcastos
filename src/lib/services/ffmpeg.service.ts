import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { getConfig } from "../config";
import { jobManager } from "../jobs/job-manager";
import { getDb } from "../db";
import { episodes } from "../db/schema";
import { eq } from "drizzle-orm";

export function initFfmpeg() {
  const config = getConfig();
  if (config.ffmpegPath && config.ffmpegPath !== "ffmpeg") {
    ffmpeg.setFfmpegPath(config.ffmpegPath);
  }
}

/** Get video duration in seconds using ffprobe */
export function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

/** Extract audio from video as MP3 (16kHz mono — optimal for Whisper) */
export async function extractAudio(
  episodeId: string,
  videoPath: string
): Promise<string> {
  const config = getConfig();
  const db = getDb();
  const jobId = jobManager.createJob(episodeId, "extract_audio");
  const outputPath = path.join(config.dataDir, "audio", `${episodeId}.mp3`);

  try {
    await db
      .update(episodes)
      .set({ status: "extracting_audio", updatedAt: new Date().toISOString() })
      .where(eq(episodes.id, episodeId));

    jobManager.updateProgress(jobId, 0.1, "Extracting audio from video...");

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec("libmp3lame")
        .audioFrequency(16000)
        .audioChannels(1)
        .audioBitrate("64k")
        .output(outputPath)
        .on("progress", (info) => {
          if (info.percent) {
            jobManager.updateProgress(
              jobId,
              0.1 + (info.percent / 100) * 0.8,
              `Extracting audio... ${Math.round(info.percent)}%`
            );
          }
        })
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    // Get duration
    const duration = await getVideoDuration(videoPath);

    await db
      .update(episodes)
      .set({
        audioPath: outputPath,
        durationSeconds: duration,
        status: "audio_ready",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(episodes.id, episodeId));

    jobManager.completeJob(jobId);
    return outputPath;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Audio extraction failed";
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

/** Extract a segment of audio as MP3 for Whisper API (which has a 25MB limit) */
export function extractAudioSegment(
  inputPath: string,
  outputPath: string,
  startSeconds: number,
  durationSeconds: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startSeconds)
      .setDuration(durationSeconds)
      .audioCodec("libmp3lame")
      .audioFrequency(16000)
      .audioChannels(1)
      .audioBitrate("64k")
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}
