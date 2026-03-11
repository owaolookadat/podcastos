import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { episodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { transcribeEpisode } from "@/lib/services/transcription.service";
import { jobManager } from "@/lib/jobs/job-manager";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const episode = db.select().from(episodes).where(eq(episodes.id, id)).get();
  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  if (!episode.audioPath) {
    return NextResponse.json(
      { error: "Audio not extracted yet. Wait for audio extraction to complete." },
      { status: 400 }
    );
  }

  // Check if already transcribing
  const activeJobs = jobManager.getJobsForEpisode(id);
  const transcribing = activeJobs.find(
    (j) => j.type === "transcribe" && j.status === "running"
  );
  if (transcribing) {
    return NextResponse.json(
      { error: "Transcription already in progress", jobId: transcribing.id },
      { status: 409 }
    );
  }

  // Start transcription in background
  transcribeEpisode(id).catch((err) => {
    console.error("Transcription failed:", err);
  });

  // Return the job ID for progress tracking
  const jobs = jobManager.getJobsForEpisode(id);
  const job = jobs.find((j) => j.type === "transcribe");

  return NextResponse.json({ jobId: job?.id, status: "started" });
}
