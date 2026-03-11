"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useUpload } from "@/hooks/use-upload";
import { formatFileSize } from "@/lib/time";
import { toast } from "sonner";

interface NewEpisodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const ACCEPTED_FORMATS = ".mp4,.mov,.mkv,.webm,.avi,.mp3,.wav,.m4a";

export function NewEpisodeDialog({
  open,
  onOpenChange,
  onCreated,
}: NewEpisodeDialogProps) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { progress, uploading, error, upload } = useUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^.]+$/, ""));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      if (!title) {
        setTitle(dropped.name.replace(/\.[^.]+$/, ""));
      }
    }
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          originalFilename: file.name,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create episode");
      }

      const episode = await res.json();
      await upload(episode.id, file);

      toast.success("Upload complete! AI processing will start automatically.");
      setTitle("");
      setFile(null);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setCreating(false);
    }
  };

  const isProcessing = creating || uploading;

  return (
    <Dialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white border-slate-200 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Upload Episode</DialogTitle>
          <p className="text-sm text-slate-400 mt-1">
            Upload your raw file — everything else happens automatically.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Drop Zone */}
          <div>
            {file ? (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 truncate max-w-[250px]">{file.name}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  {!isProcessing && (
                    <button onClick={() => setFile(null)} className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50">
                      Remove
                    </button>
                  )}
                </div>
                {uploading && (
                  <div className="mt-3">
                    <Progress value={progress * 100} className="h-1.5" />
                    <p className="text-xs text-violet-500 mt-1.5 font-medium">Uploading... {Math.round(progress * 100)}%</p>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-violet-400 bg-violet-50/50"
                    : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/30"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors ${
                  isDragging ? "bg-violet-100" : "bg-slate-100"
                }`}>
                  <svg className={`w-6 h-6 ${isDragging ? "text-violet-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 mb-1">
                  {isDragging ? (
                    <span className="text-violet-600 font-medium">Drop it here</span>
                  ) : (
                    <>Drop your file here, or <span className="text-violet-600 font-medium">browse</span></>
                  )}
                </p>
                <p className="text-xs text-slate-400">MP4, MOV, MKV, MP3, WAV, M4A</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FORMATS}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Title */}
          {file && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Episode Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your episode a name"
                disabled={isProcessing}
                className="bg-slate-50 border-slate-200 rounded-lg focus:ring-violet-200 focus:border-violet-300"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* What happens next */}
          {file && !uploading && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-medium text-slate-500 mb-2">After upload, we automatically:</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <svg className="w-3 h-3 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Extract audio from your video
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <svg className="w-3 h-3 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Transcribe with OpenAI Whisper
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <svg className="w-3 h-3 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  AI analysis for clips, chapters & edit suggestions
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!file || !title.trim() || isProcessing}
              className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200 rounded-lg"
            >
              {uploading ? "Uploading..." : creating ? "Creating..." : "Upload & Process"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
