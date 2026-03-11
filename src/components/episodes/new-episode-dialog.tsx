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

const ACCEPTED_FORMATS = ".mp4,.mov,.mkv,.webm,.avi";

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
        // Auto-fill title from filename
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
      // Create episode record
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

      // Upload file
      await upload(episode.id, file);

      toast.success("Episode uploaded! Audio extraction started.");
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Episode</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Episode title"
              disabled={isProcessing}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Video File
            </label>
            {file ? (
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  {!isProcessing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {uploading && (
                  <div className="mt-3">
                    <Progress value={progress * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploading... {Math.round(progress * 100)}%
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <p className="text-sm text-muted-foreground mb-1">
                  Drag and drop a video file, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  MP4, MOV, MKV, WEBM, AVI
                </p>
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

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!file || !title.trim() || isProcessing}
            >
              {uploading
                ? "Uploading..."
                : creating
                  ? "Creating..."
                  : "Upload & Process"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
