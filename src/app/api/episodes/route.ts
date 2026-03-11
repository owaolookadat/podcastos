import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { episodes } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { createEpisodeSchema } from "@/lib/validation";
import { runMigrations } from "@/lib/services/db-migrate";

// Ensure migrations run on first API call
let migrated = false;
function ensureMigrated() {
  if (!migrated) {
    runMigrations();
    migrated = true;
  }
}

export async function GET() {
  ensureMigrated();
  const db = getDb();
  const result = db
    .select()
    .from(episodes)
    .orderBy(desc(episodes.createdAt))
    .all();
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  ensureMigrated();
  const db = getDb();
  const body = await req.json();

  const parsed = createEpisodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const episode = {
    id: nanoid(),
    title: parsed.data.title,
    description: parsed.data.description || null,
    originalFilename: parsed.data.originalFilename,
    filePath: null,
    audioPath: null,
    fileSizeBytes: null,
    durationSeconds: null,
    status: "uploading" as const,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(episodes).values(episode).run();
  return NextResponse.json(episode, { status: 201 });
}
