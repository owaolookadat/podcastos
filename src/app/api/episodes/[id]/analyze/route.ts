import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { episodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { analyzeEpisode } from "@/lib/services/analysis.service";
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

  if (episode.status !== "transcribed" && episode.status !== "analyzed") {
    return NextResponse.json(
      { error: "Episode must be transcribed before analysis" },
      { status: 400 }
    );
  }

  // Check if already analyzing
  const activeJobs = jobManager.getJobsForEpisode(id);
  const analyzing = activeJobs.find(
    (j) => j.type === "analyze" && j.status === "running"
  );
  if (analyzing) {
    return NextResponse.json(
      { error: "Analysis already in progress", jobId: analyzing.id },
      { status: 409 }
    );
  }

  // Start analysis in background
  analyzeEpisode(id).catch((err) => {
    console.error("Analysis failed:", err);
  });

  const jobs = jobManager.getJobsForEpisode(id);
  const job = jobs.find((j) => j.type === "analyze");

  return NextResponse.json({ jobId: job?.id, status: "started" });
}
