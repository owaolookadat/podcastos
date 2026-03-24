import Anthropic from "@anthropic-ai/sdk";
import { nanoid } from "nanoid";
import { getConfig } from "../config";
import { getDb } from "../db";
import { episodes, transcripts, analyses, clips } from "../db/schema";
import { eq } from "drizzle-orm";
import { jobManager } from "../jobs/job-manager";
import { buildClipAnalysisPrompt } from "../prompts/clip-analysis";
import { analysisResultSchema } from "../validation";
import { formatTimestamp } from "../time";
import type { WhisperSegment, AnalysisResult } from "../types";

export async function analyzeEpisode(episodeId: string): Promise<void> {
  const config = getConfig();
  const db = getDb();
  const jobId = jobManager.createJob(episodeId, "analyze");
  const startTime = Date.now();

  try {
    const episode = db
      .select()
      .from(episodes)
      .where(eq(episodes.id, episodeId))
      .get();
    if (!episode) throw new Error("Episode not found");

    const transcript = db
      .select()
      .from(transcripts)
      .where(eq(transcripts.episodeId, episodeId))
      .get();
    if (!transcript) throw new Error("No transcript found — transcribe first");

    await db
      .update(episodes)
      .set({ status: "analyzing", updatedAt: new Date().toISOString() })
      .where(eq(episodes.id, episodeId));

    jobManager.updateProgress(jobId, 0.1, "Preparing transcript for analysis...");

    // Format transcript with timestamps
    const segments: WhisperSegment[] = JSON.parse(transcript.segments);
    const formattedTranscript = segments
      .map(
        (seg) =>
          `[${formatTimestamp(seg.start)} - ${formatTimestamp(seg.end)}] ${seg.text}`
      )
      .join("\n");

    jobManager.updateProgress(jobId, 0.2, "Analyzing with Claude AI...");

    const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16384,
      messages: [
        {
          role: "user",
          content: buildClipAnalysisPrompt(formattedTranscript, episode.title, episode.durationSeconds ?? undefined),
        },
      ],
    });

    jobManager.updateProgress(jobId, 0.8, "Processing results...");

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON — Claude may wrap in code fences
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Claude did not return valid JSON");

    let analysisResult: AnalysisResult;
    try {
      // Try direct parse first
      analysisResult = analysisResultSchema.parse(JSON.parse(jsonMatch[0]));
    } catch {
      // Attempt to repair common JSON issues from LLM output
      try {
        let repaired = jsonMatch[0];
        // Remove trailing commas before } or ]
        repaired = repaired.replace(/,\s*([}\]])/g, "$1");
        // Fix unescaped newlines inside strings
        repaired = repaired.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, "\\n");
        // Fix unescaped control characters
        repaired = repaired.replace(/[\x00-\x1f]/g, (ch) => {
          if (ch === "\n" || ch === "\r" || ch === "\t") return ch;
          return `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`;
        });
        analysisResult = analysisResultSchema.parse(JSON.parse(repaired));
      } catch (parseError) {
        throw new Error(
          `Failed to parse analysis: ${parseError instanceof Error ? parseError.message : "Invalid format"}`
        );
      }
    }

    jobManager.updateProgress(jobId, 0.9, "Saving analysis...");

    // Clean up previous analysis and clips (for re-analysis)
    db.delete(clips).where(eq(clips.episodeId, episodeId)).run();
    db.delete(analyses).where(eq(analyses.episodeId, episodeId)).run();

    // Save analysis
    const analysisId = nanoid();
    db.insert(analyses)
      .values({
        id: analysisId,
        episodeId,
        summary: analysisResult.summary,
        clipRecommendations: JSON.stringify(
          analysisResult.clipRecommendations
        ),
        longformNotes: JSON.stringify(analysisResult.longformNotes),
        rawResponse: responseText,
        modelUsed: "claude-sonnet-4-20250514",
        promptTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        processingTimeMs: Date.now() - startTime,
        createdAt: new Date().toISOString(),
      })
      .run();

    // Create clip records for V2 auto-cutting
    for (const clip of analysisResult.clipRecommendations) {
      db.insert(clips)
        .values({
          id: nanoid(),
          episodeId,
          analysisId,
          title: clip.title,
          startTime: clip.startTime,
          endTime: clip.endTime,
          transcript: clip.transcript,
          hookScore: clip.scores.hook,
          relatabilityScore: clip.scores.relatability,
          emotionScore: clip.scores.emotion,
          quotabilityScore: clip.scores.quotability,
          curiosityScore: clip.scores.curiosity,
          overallScore: clip.scores.overall,
          reasoning: clip.reasoning,
          suggestedCaption: clip.suggestedCaption,
          status: "recommended",
          createdAt: new Date().toISOString(),
        })
        .run();
    }

    await db
      .update(episodes)
      .set({ status: "analyzed", updatedAt: new Date().toISOString() })
      .where(eq(episodes.id, episodeId));

    jobManager.completeJob(jobId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analysis failed";
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
