"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatFileSize, formatDuration } from "@/lib/time";
import { useJobProgress } from "@/hooks/use-job-progress";
import { TranscriptViewer } from "@/components/transcript/transcript-viewer";
import { AnalysisReport } from "@/components/analysis/analysis-report";
import { toast } from "sonner";

interface EpisodeDetail {
  id: string;
  title: string;
  description: string | null;
  originalFilename: string;
  status: string;
  errorMessage: string | null;
  fileSizeBytes: number | null;
  durationSeconds: number | null;
  createdAt: string;
  transcript: {
    fullText: string;
    segments: string;
    language: string | null;
    processingTimeMs: number | null;
  } | null;
  analysis: {
    summary: string | null;
    clipRecommendations: string;
    longformNotes: string;
    modelUsed: string | null;
    promptTokens: number | null;
    outputTokens: number | null;
    processingTimeMs: number | null;
  } | null;
  clips: Array<{
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    transcript: string | null;
    hookScore: number | null;
    relatabilityScore: number | null;
    emotionScore: number | null;
    quotabilityScore: number | null;
    curiosityScore: number | null;
    overallScore: number | null;
    reasoning: string | null;
    suggestedCaption: string | null;
    status: string;
  }>;
}

const PIPELINE_STEPS = [
  { key: "uploaded", label: "Uploaded" },
  { key: "audio_ready", label: "Audio" },
  { key: "transcribed", label: "Transcribed" },
  { key: "analyzed", label: "Analyzed" },
];

const STATUS_ORDER: Record<string, number> = {
  uploading: 0,
  uploaded: 1,
  extracting_audio: 1.5,
  audio_ready: 2,
  transcribing: 2.5,
  transcribed: 3,
  analyzing: 3.5,
  analyzed: 4,
  error: -1,
};

export default function EpisodeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [episode, setEpisode] = useState<EpisodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const jobState = useJobProgress(activeJobId);

  const fetchEpisode = useCallback(async () => {
    try {
      const res = await fetch(`/api/episodes/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setEpisode(data);
    } catch (err) {
      console.error("Failed to fetch episode:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEpisode();
    const interval = setInterval(fetchEpisode, 3000);
    return () => clearInterval(interval);
  }, [fetchEpisode]);

  // When job completes, refresh and clear
  useEffect(() => {
    if (
      jobState?.status === "completed" ||
      jobState?.status === "failed"
    ) {
      fetchEpisode();
      if (jobState.status === "completed") {
        toast.success(`${jobState.type} completed!`);
      } else {
        toast.error(`${jobState.type} failed: ${jobState.error}`);
      }
      setTimeout(() => setActiveJobId(null), 2000);
    }
  }, [jobState?.status, jobState?.type, jobState?.error, fetchEpisode]);

  const startTranscription = async () => {
    try {
      const res = await fetch(`/api/episodes/${id}/transcribe`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveJobId(data.jobId);
      toast.info("Transcription started...");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start transcription"
      );
    }
  };

  const startAnalysis = async () => {
    try {
      const res = await fetch(`/api/episodes/${id}/analyze`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveJobId(data.jobId);
      toast.info("AI analysis started...");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start analysis"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Episode not found</p>
      </div>
    );
  }

  const statusOrder = STATUS_ORDER[episode.status] ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; Back
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <h1 className="text-xl font-bold">{episode.title}</h1>
            <Badge
              variant={
                episode.status === "error"
                  ? "destructive"
                  : episode.status === "analyzed"
                    ? "default"
                    : "secondary"
              }
            >
              {episode.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Pipeline Progress */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              {PIPELINE_STEPS.map((step, i) => {
                const stepOrder = STATUS_ORDER[step.key] ?? 0;
                const isActive = statusOrder >= stepOrder;
                const isCurrentlyProcessing =
                  (step.key === "uploaded" &&
                    episode.status === "extracting_audio") ||
                  (step.key === "audio_ready" &&
                    episode.status === "transcribing") ||
                  (step.key === "transcribed" &&
                    episode.status === "analyzing");

                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : isCurrentlyProcessing
                              ? "bg-primary/30 text-primary-foreground animate-pulse"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span className="text-xs mt-1 text-muted-foreground">
                        {step.label}
                      </span>
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 ${
                          statusOrder > stepOrder ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active job progress */}
            {jobState && jobState.status === "running" && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">
                    {jobState.message}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(jobState.progress * 100)}%
                  </span>
                </div>
                <Progress value={jobState.progress * 100} className="h-2" />
              </div>
            )}

            {/* Error message */}
            {episode.status === "error" && episode.errorMessage && (
              <p className="text-sm text-destructive mt-2">
                {episode.errorMessage}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transcript" disabled={!episode.transcript}>
              Transcript
            </TabsTrigger>
            <TabsTrigger value="analysis" disabled={!episode.analysis}>
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Episode Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Episode Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File</span>
                    <span>{episode.originalFilename}</span>
                  </div>
                  {episode.fileSizeBytes && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span>{formatFileSize(episode.fileSizeBytes)}</span>
                    </div>
                  )}
                  {episode.durationSeconds && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span>{formatDuration(episode.durationSeconds)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>
                      {new Date(episode.createdAt).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={startTranscription}
                    disabled={
                      statusOrder < 2 ||
                      episode.status === "transcribing" ||
                      !!activeJobId
                    }
                  >
                    {episode.status === "transcribing"
                      ? "Transcribing..."
                      : episode.transcript
                        ? "Re-transcribe"
                        : "Start Transcription"}
                  </Button>
                  <Button
                    className="w-full"
                    onClick={startAnalysis}
                    disabled={
                      !episode.transcript ||
                      episode.status === "analyzing" ||
                      !!activeJobId
                    }
                  >
                    {episode.status === "analyzing"
                      ? "Analyzing..."
                      : episode.analysis
                        ? "Re-analyze"
                        : "Start AI Analysis"}
                  </Button>
                </CardContent>
              </Card>

              {/* Analysis Summary */}
              {episode.analysis?.summary && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Episode Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{episode.analysis.summary}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transcript" className="mt-4">
            {episode.transcript && (
              <TranscriptViewer
                segments={JSON.parse(episode.transcript.segments)}
              />
            )}
          </TabsContent>

          <TabsContent value="analysis" className="mt-4">
            {episode.analysis && (
              <AnalysisReport
                clips={episode.clips}
                longformNotes={JSON.parse(episode.analysis.longformNotes)}
                summary={episode.analysis.summary}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
