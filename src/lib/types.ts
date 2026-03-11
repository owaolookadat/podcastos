export interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  language?: string;
  confidence?: number;
}

export interface ClipRecommendation {
  rank: number;
  title: string;
  startTime: number;
  endTime: number;
  transcript: string;
  scores: {
    hook: number;
    relatability: number;
    emotion: number;
    quotability: number;
    curiosity: number;
    overall: number;
  };
  reasoning: string;
  suggestedCaption: string;
}

export interface LongformNotes {
  chapters: Array<{
    title: string;
    startTime: number;
    endTime: number;
  }>;
  deadAirMarkers: Array<{
    startTime: number;
    endTime: number;
    durationSeconds: number;
  }>;
  weakSegments: Array<{
    startTime: number;
    endTime: number;
    reason: string;
  }>;
  editSuggestions: string[];
  overallAssessment: string;
}

export interface AnalysisResult {
  summary: string;
  clipRecommendations: ClipRecommendation[];
  longformNotes: LongformNotes;
}

export type EpisodeStatus =
  | "uploading"
  | "uploaded"
  | "extracting_audio"
  | "audio_ready"
  | "transcribing"
  | "transcribed"
  | "analyzing"
  | "analyzed"
  | "error";

export type JobType =
  | "upload"
  | "extract_audio"
  | "transcribe"
  | "analyze"
  | "export";

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface JobState {
  id: string;
  episodeId: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  message: string;
  error?: string;
}
