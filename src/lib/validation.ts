import { z } from "zod";

export const createEpisodeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  originalFilename: z.string().min(1),
});

export const updateEpisodeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
});

export const clipScoresSchema = z.object({
  hook: z.number().min(1).max(10),
  relatability: z.number().min(1).max(10),
  emotion: z.number().min(1).max(10),
  quotability: z.number().min(1).max(10),
  curiosity: z.number().min(1).max(10),
  overall: z.number().min(1).max(10),
});

export const clipRecommendationSchema = z.object({
  rank: z.number().int().positive(),
  title: z.string(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  transcript: z.string(),
  scores: clipScoresSchema,
  reasoning: z.string(),
  suggestedCaption: z.string(),
});

export const longformNotesSchema = z.object({
  chapters: z.array(
    z.object({
      title: z.string(),
      startTime: z.number().min(0),
      endTime: z.number().min(0),
    })
  ),
  deadAirMarkers: z.array(
    z.object({
      startTime: z.number().min(0),
      endTime: z.number().min(0),
      durationSeconds: z.number().min(0),
    })
  ),
  weakSegments: z.array(
    z.object({
      startTime: z.number().min(0),
      endTime: z.number().min(0),
      reason: z.string(),
    })
  ),
  editSuggestions: z.array(z.string()),
  overallAssessment: z.string(),
});

export const analysisResultSchema = z.object({
  summary: z.string(),
  clipRecommendations: z.array(clipRecommendationSchema),
  longformNotes: longformNotesSchema,
});
