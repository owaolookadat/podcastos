import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { episodes, transcripts, analyses, clips } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateEpisodeSchema } from "@/lib/validation";
import fs from "fs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const episode = db.select().from(episodes).where(eq(episodes.id, id)).get();
  if (!episode) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const transcript = db
    .select()
    .from(transcripts)
    .where(eq(transcripts.episodeId, id))
    .get();

  const analysis = db
    .select()
    .from(analyses)
    .where(eq(analyses.episodeId, id))
    .get();

  const episodeClips = db
    .select()
    .from(clips)
    .where(eq(clips.episodeId, id))
    .all();

  return NextResponse.json({
    ...episode,
    transcript: transcript || null,
    analysis: analysis || null,
    clips: episodeClips,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();

  const parsed = updateEpisodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  db.update(episodes)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(episodes.id, id))
    .run();

  const updated = db.select().from(episodes).where(eq(episodes.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const episode = db.select().from(episodes).where(eq(episodes.id, id)).get();
  if (!episode) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Clean up files
  for (const filePath of [episode.filePath, episode.audioPath]) {
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore if already deleted
      }
    }
  }

  // Cascade delete handles transcripts, analyses, clips, jobs
  db.delete(episodes).where(eq(episodes.id, id)).run();
  return NextResponse.json({ deleted: true });
}
