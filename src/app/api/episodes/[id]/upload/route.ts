import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getDb } from "@/lib/db";
import { episodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getConfig } from "@/lib/config";
import { extractAudio } from "@/lib/services/ffmpeg.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const config = getConfig();

  const episode = db.select().from(episodes).where(eq(episodes.id, id)).get();
  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  const contentRange = req.headers.get("Content-Range");
  const filename = req.headers.get("X-Filename") || episode.originalFilename;
  const ext = path.extname(filename) || ".mp4";
  const filePath = path.join(config.dataDir, "uploads", `${id}${ext}`);

  const chunk = Buffer.from(await req.arrayBuffer());

  if (contentRange) {
    // Chunked upload: "bytes 0-10485759/2147483648"
    const match = contentRange.match(/bytes (\d+)-(\d+)\/(\d+)/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid Content-Range header" },
        { status: 400 }
      );
    }

    const start = parseInt(match[1]);
    const end = parseInt(match[2]);
    const total = parseInt(match[3]);

    // Write chunk at correct offset
    const fd = fs.openSync(filePath, start === 0 ? "w" : "r+");
    fs.writeSync(fd, chunk, 0, chunk.length, start);
    fs.closeSync(fd);

    const isComplete = end + 1 >= total;
    const progress = (end + 1) / total;

    if (isComplete) {
      // Upload complete — update episode and start audio extraction
      db.update(episodes)
        .set({
          filePath,
          fileSizeBytes: total,
          status: "uploaded",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(episodes.id, id))
        .run();

      // Start audio extraction in the background
      extractAudio(id, filePath).catch((err) => {
        console.error("Audio extraction failed:", err);
      });
    }

    return NextResponse.json({
      received: chunk.length,
      progress,
      complete: isComplete,
    });
  } else {
    // Single-chunk upload (small files)
    fs.writeFileSync(filePath, chunk);

    db.update(episodes)
      .set({
        filePath,
        fileSizeBytes: chunk.length,
        status: "uploaded",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(episodes.id, id))
      .run();

    extractAudio(id, filePath).catch((err) => {
      console.error("Audio extraction failed:", err);
    });

    return NextResponse.json({
      received: chunk.length,
      progress: 1,
      complete: true,
    });
  }
}
