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

      toast.success("Upload complete! Pipeline starting automatically.");
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
          <DialogTitle className="text-slate-900">New Episode</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Episode title"
              disabled={isProcessing}
              className="bg-slate-50 border-slate-200 rounded-lg focus:ring-violet-200 focus:border-violet-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Media File</label>
            {file ? (
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 truncate max-w-[250px]">{file.name}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  {!isProcessing && (
                    <button onClick={() => setFile(null)} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                      Remove
                    </button>
                  )}
                </div>
                {uploading && (
                  <div className="mt-3">
                    <Progress value={progress * 100} className="h-1.5" />
                    <p className="text-xs text-violet-500 mt-1.5">Uploading... {Math.round(progress * 100)}%</p>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-all duration-200"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 mb-1">
                  Drop a file here, or <span className="text-violet-600 font-medium">browse</span>
                </p>
                <p className="text-xs text-slate-400">MP4, MOV, MKV, MP3, WAV</p>
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
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
