"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFileSize, formatDuration } from "@/lib/time";
import { NewEpisodeDialog } from "@/components/episodes/new-episode-dialog";
import Link from "next/link";

interface Episode {
  id: string;
  title: string;
  description: string | null;
  originalFilename: string;
  status: string;
  fileSizeBytes: number | null;
  durationSeconds: number | null;
  createdAt: string;
}

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  uploading: { label: "Uploading", variant: "outline" },
  uploaded: { label: "Uploaded", variant: "secondary" },
  extracting_audio: { label: "Extracting Audio", variant: "outline" },
  audio_ready: { label: "Audio Ready", variant: "secondary" },
  transcribing: { label: "Transcribing", variant: "outline" },
  transcribed: { label: "Transcribed", variant: "secondary" },
  analyzing: { label: "Analyzing", variant: "outline" },
  analyzed: { label: "Analyzed", variant: "default" },
  error: { label: "Error", variant: "destructive" },
};

export default function DashboardPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchEpisodes = useCallback(async () => {
    try {
      const res = await fetch("/api/episodes");
      const data = await res.json();
      setEpisodes(data);
    } catch (err) {
      console.error("Failed to fetch episodes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEpisodes();
    const interval = setInterval(fetchEpisodes, 5000);
    return () => clearInterval(interval);
  }, [fetchEpisodes]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">PodcastOS</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered post-production pipeline
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>New Episode</Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center text-muted-foreground py-20">
            Loading...
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-lg font-medium mb-2">No episodes yet</h2>
            <p className="text-muted-foreground mb-6">
              Upload your first episode to get started.
            </p>
            <Button onClick={() => setDialogOpen(true)}>Upload Episode</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {episodes.map((episode) => {
              const statusInfo = STATUS_LABELS[episode.status] || {
                label: episode.status,
                variant: "secondary" as const,
              };
              return (
                <Link href={`/episodes/${episode.id}`} key={episode.id}>
                  <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-medium truncate">
                            {episode.title}
                          </h3>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{episode.originalFilename}</span>
                          {episode.fileSizeBytes && (
                            <span>{formatFileSize(episode.fileSizeBytes)}</span>
                          )}
                          {episode.durationSeconds && (
                            <span>
                              {formatDuration(episode.durationSeconds)}
                            </span>
                          )}
                          <span>
                            {new Date(episode.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <NewEpisodeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => {
          setDialogOpen(false);
          fetchEpisodes();
        }}
      />
    </div>
  );
}
