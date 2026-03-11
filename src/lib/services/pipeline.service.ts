import { extractAudio } from "./ffmpeg.service";
import { transcribeEpisode } from "./transcription.service";
import { analyzeEpisode } from "./analysis.service";

/**
 * Run the full post-production pipeline:
 * Extract Audio → Transcribe → Analyze
 *
 * Each step automatically chains to the next.
 * If any step fails, the pipeline stops and the episode status reflects the error.
 */
export async function runFullPipeline(
  episodeId: string,
  filePath: string
): Promise<void> {
  console.log(`[Pipeline] Starting full pipeline for episode ${episodeId}`);

  // Step 1: Extract audio
  console.log(`[Pipeline] Step 1/3: Extracting audio...`);
  await extractAudio(episodeId, filePath);
  console.log(`[Pipeline] Step 1/3: Audio extraction complete`);

  // Step 2: Transcribe
  console.log(`[Pipeline] Step 2/3: Transcribing...`);
  await transcribeEpisode(episodeId);
  console.log(`[Pipeline] Step 2/3: Transcription complete`);

  // Step 3: Analyze
  console.log(`[Pipeline] Step 3/3: Analyzing with AI...`);
  await analyzeEpisode(episodeId);
  console.log(`[Pipeline] Step 3/3: Analysis complete`);

  console.log(`[Pipeline] Full pipeline complete for episode ${episodeId}`);
}
