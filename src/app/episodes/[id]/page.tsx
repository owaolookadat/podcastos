"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  { key: "uploaded", label: "Upload", icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" },
  { key: "audio_ready", label: "Audio", icon: "M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.34A1.077 1.077 0 0017.923 1.3l3.654 1.055a1.077 1.077 0 01.764 1.03V7.5" },
  { key: "transcribed", label: "Transcript", icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" },
  { key: "analyzed", label: "Analysis", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
];

const STATUS_ORDER: Record<string, number> = {
  uploading: 0, uploaded: 1, extracting_audio: 1.5,
  audio_ready: 2, transcribing: 2.5, transcribed: 3,
  analyzing: 3.5, analyzed: 4, error: -1,
};

export default function EpisodeDetailPage() {
  const params = useParams();
  const router = useRouter();
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

  useEffect(() => {
    if (jobState?.status === "completed" || jobState?.status === "failed") {
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
      const res = await fetch(`/api/episodes/${id}/transcribe`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveJobId(data.jobId);
      toast.info("Transcription started...");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start transcription");
    }
  };

  const startAnalysis = async () => {
    try {
      const res = await fetch(`/api/episodes/${id}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveJobId(data.jobId);
      toast.info("AI analysis started...");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start analysis");
    }
  };

  const deleteEpisode = async () => {
    if (!confirm("Delete this episode and all its data?")) return;
    try {
      const res = await fetch(`/api/episodes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Episode deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete episode");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-violet-100 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white flex items-center justify-center">
        <p className="text-slate-400">Episode not found</p>
      </div>
    );
  }

  const statusOrder = STATUS_ORDER[episode.status] ?? 0;
  const isProcessing = ["extracting_audio", "transcribing", "analyzing"].includes(episode.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/" className="flex items-center gap-1 text-sm text-slate-400 hover:text-violet-600 transition-colors shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back
              </Link>
              <div className="w-px h-5 bg-slate-200" />
              <h1 className="text-base font-semibold text-slate-800 truncate">{episode.title}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              {isProcessing && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-200">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-50" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500" />
                  </span>
                  Processing
                </span>
              )}
              {!isProcessing && episode.status === "analyzed" && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200">Ready</span>
              )}
              {episode.status === "error" && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 ring-1 ring-inset ring-red-200">Error</span>
              )}
              <button onClick={deleteEpisode} className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors" title="Delete episode">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Pipeline Steps */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 mb-6 shadow-sm shadow-slate-100">
          <div className="flex items-center justify-between">
            {PIPELINE_STEPS.map((step, i) => {
              const stepOrder = STATUS_ORDER[step.key] ?? 0;
              const isActive = statusOrder >= stepOrder;
              const isCurrent =
                (step.key === "uploaded" && episode.status === "extracting_audio") ||
                (step.key === "audio_ready" && episode.status === "transcribing") ||
                (step.key === "transcribed" && episode.status === "analyzing");

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isActive ? "bg-violet-600 text-white shadow-sm shadow-violet-200" : isCurrent ? "bg-violet-100 text-violet-600 animate-pulse" : "bg-slate-50 text-slate-300"
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                      </svg>
                    </div>
                    <span className={`text-[11px] mt-1.5 font-medium ${isActive ? "text-violet-600" : "text-slate-300"}`}>{step.label}</span>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className={`h-px flex-1 mx-1 transition-colors duration-300 ${statusOrder > stepOrder ? "bg-violet-300" : "bg-slate-100"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {jobState && jobState.status === "running" && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-500">{jobState.message}</span>
                <span className="text-violet-600 font-medium">{Math.round(jobState.progress * 100)}%</span>
              </div>
              <Progress value={jobState.progress * 100} className="h-1.5" />
            </div>
          )}

          {episode.status === "error" && episode.errorMessage && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm text-red-500">{episode.errorMessage}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="bg-slate-100/60 p-0.5 rounded-lg">
            <TabsTrigger value="overview" className="rounded-md text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
            <TabsTrigger value="transcript" disabled={!episode.transcript} className="rounded-md text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Transcript</TabsTrigger>
            <TabsTrigger value="analysis" disabled={!episode.analysis} className="rounded-md text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm shadow-slate-50">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Episode Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">File</span>
                    <span className="text-slate-700 text-right max-w-[250px] truncate">{episode.originalFilename}</span>
                  </div>
                  {episode.fileSizeBytes && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Size</span>
                      <span className="text-slate-700">{formatFileSize(episode.fileSizeBytes)}</span>
                    </div>
                  )}
                  {episode.durationSeconds && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration</span>
                      <span className="text-slate-700">{formatDuration(episode.durationSeconds)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created</span>
                    <span className="text-slate-700">{new Date(episode.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm shadow-slate-50">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Actions</h3>
                <div className="space-y-2.5">
                  <Button variant="outline" className="w-full justify-center border-slate-200 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 rounded-lg" onClick={startTranscription} disabled={statusOrder < 2 || episode.status === "transcribing" || !!activeJobId}>
                    {episode.status === "transcribing" ? "Transcribing..." : episode.transcript ? "Re-transcribe" : "Start Transcription"}
                  </Button>
                  <Button variant="outline" className="w-full justify-center border-slate-200 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 rounded-lg" onClick={startAnalysis} disabled={!episode.transcript || episode.status === "analyzing" || !!activeJobId}>
                    {episode.status === "analyzing" ? "Analyzing..." : episode.analysis ? "Re-analyze" : "Start AI Analysis"}
                  </Button>
                </div>
              </div>

              {/* Exports */}
              {episode.analysis && (
                <div className="md:col-span-2 bg-white rounded-xl border border-slate-100 p-5 shadow-sm shadow-slate-50">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Exports</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    <a href={`/api/episodes/${id}/export?format=longform-edl`} download className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-slate-200 hover:border-violet-200 hover:bg-violet-50 transition-colors text-sm text-slate-600 hover:text-violet-700">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                      Longform EDL
                    </a>
                    <a href={`/api/episodes/${id}/export?format=clips-edl`} download className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-slate-200 hover:border-violet-200 hover:bg-violet-50 transition-colors text-sm text-slate-600 hover:text-violet-700">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                      Clips EDL
                    </a>
                    {episode.transcript && (
                      <a href={`/api/episodes/${id}/export?format=srt`} download className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-slate-200 hover:border-violet-200 hover:bg-violet-50 transition-colors text-sm text-slate-600 hover:text-violet-700">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                        Full SRT
                      </a>
                    )}
                    <a href={`/api/episodes/${id}/export?format=chapters`} download className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-slate-200 hover:border-violet-200 hover:bg-violet-50 transition-colors text-sm text-slate-600 hover:text-violet-700">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                      Chapters
                    </a>
                  </div>
                </div>
              )}

              {episode.analysis?.summary && (
                <div className="md:col-span-2 bg-gradient-to-br from-violet-50/50 to-purple-50/30 rounded-xl border border-violet-100/50 p-5">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Episode Summary</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{episode.analysis.summary}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transcript" className="mt-5">
            {episode.transcript && <TranscriptViewer segments={JSON.parse(episode.transcript.segments)} />}
          </TabsContent>

          <TabsContent value="analysis" className="mt-5">
            {episode.analysis && (
              <AnalysisReport episodeId={id} clips={episode.clips} longformNotes={JSON.parse(episode.analysis.longformNotes)} summary={episode.analysis.summary} />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
