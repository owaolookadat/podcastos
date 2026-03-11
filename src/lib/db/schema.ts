import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ─── Episodes ───────────────────────────────────────────────────────
export const episodes = sqliteTable("episodes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),

  // File info
  originalFilename: text("original_filename").notNull(),
  filePath: text("file_path"),
  audioPath: text("audio_path"),
  fileSizeBytes: integer("file_size_bytes"),
  durationSeconds: real("duration_seconds"),

  // Pipeline status
  status: text("status", {
    enum: [
      "uploading",
      "uploaded",
      "extracting_audio",
      "audio_ready",
      "transcribing",
      "transcribed",
      "analyzing",
      "analyzed",
      "error",
    ],
  })
    .notNull()
    .default("uploading"),
  errorMessage: text("error_message"),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── Transcripts ────────────────────────────────────────────────────
export const transcripts = sqliteTable("transcripts", {
  id: text("id").primaryKey(),
  episodeId: text("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),

  fullText: text("full_text").notNull(),
  language: text("language"),
  segments: text("segments").notNull(), // JSON: WhisperSegment[]

  modelUsed: text("model_used"),
  processingTimeMs: integer("processing_time_ms"),
  createdAt: text("created_at").notNull(),
});

// ─── Analyses ───────────────────────────────────────────────────────
export const analyses = sqliteTable("analyses", {
  id: text("id").primaryKey(),
  episodeId: text("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),

  summary: text("summary"),
  clipRecommendations: text("clip_recommendations").notNull(), // JSON: ClipRecommendation[]
  longformNotes: text("longform_notes").notNull(), // JSON: LongformNotes
  rawResponse: text("raw_response"),

  modelUsed: text("model_used"),
  promptTokens: integer("prompt_tokens"),
  outputTokens: integer("output_tokens"),
  processingTimeMs: integer("processing_time_ms"),
  createdAt: text("created_at").notNull(),
});

// ─── Jobs (progress tracking) ───────────────────────────────────────
export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  episodeId: text("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["upload", "extract_audio", "transcribe", "analyze", "export"],
  }).notNull(),
  status: text("status", {
    enum: ["pending", "running", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  progress: real("progress").default(0),
  message: text("message"),
  errorMessage: text("error_message"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
});

// ─── Clips (V2: auto-cut results, created in V1 from analysis) ─────
export const clips = sqliteTable("clips", {
  id: text("id").primaryKey(),
  episodeId: text("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  analysisId: text("analysis_id").references(() => analyses.id),

  title: text("title").notNull(),
  startTime: real("start_time").notNull(),
  endTime: real("end_time").notNull(),
  transcript: text("transcript"),

  // Scores
  hookScore: real("hook_score"),
  relatabilityScore: real("relatability_score"),
  emotionScore: real("emotion_score"),
  quotabilityScore: real("quotability_score"),
  curiosityScore: real("curiosity_score"),
  overallScore: real("overall_score"),

  reasoning: text("reasoning"),
  suggestedCaption: text("suggested_caption"),

  // Export info (V2)
  exportPath: text("export_path"),
  exportFormat: text("export_format"),
  status: text("status", {
    enum: ["recommended", "approved", "cutting", "exported", "rejected"],
  })
    .notNull()
    .default("recommended"),

  createdAt: text("created_at").notNull(),
});
