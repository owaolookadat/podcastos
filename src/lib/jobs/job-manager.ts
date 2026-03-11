import { EventEmitter } from "events";
import { nanoid } from "nanoid";
import type { JobState, JobType } from "../types";

class JobManager {
  private activeJobs = new Map<string, JobState>();
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  createJob(episodeId: string, type: JobType): string {
    const id = nanoid();
    const job: JobState = {
      id,
      episodeId,
      type,
      status: "running",
      progress: 0,
      message: "Starting...",
    };
    this.activeJobs.set(id, job);
    this.emitter.emit(`job:${id}`, { ...job });
    return id;
  }

  updateProgress(jobId: string, progress: number, message: string) {
    const job = this.activeJobs.get(jobId);
    if (!job) return;
    job.progress = Math.min(progress, 1);
    job.message = message;
    job.status = "running";
    this.emitter.emit(`job:${jobId}`, { ...job });
  }

  completeJob(jobId: string) {
    const job = this.activeJobs.get(jobId);
    if (!job) return;
    job.status = "completed";
    job.progress = 1;
    job.message = "Done";
    this.emitter.emit(`job:${jobId}`, { ...job });
    // Clean up after a delay so SSE clients can receive the final event
    setTimeout(() => this.activeJobs.delete(jobId), 30000);
  }

  failJob(jobId: string, error: string) {
    const job = this.activeJobs.get(jobId);
    if (!job) return;
    job.status = "failed";
    job.error = error;
    job.message = `Failed: ${error}`;
    this.emitter.emit(`job:${jobId}`, { ...job });
    setTimeout(() => this.activeJobs.delete(jobId), 30000);
  }

  getJob(jobId: string): JobState | undefined {
    return this.activeJobs.get(jobId);
  }

  getJobsForEpisode(episodeId: string): JobState[] {
    return Array.from(this.activeJobs.values()).filter(
      (j) => j.episodeId === episodeId
    );
  }

  subscribe(jobId: string, callback: (state: JobState) => void): () => void {
    const handler = (state: JobState) => callback(state);
    this.emitter.on(`job:${jobId}`, handler);
    // Send current state immediately
    const current = this.activeJobs.get(jobId);
    if (current) callback({ ...current });
    return () => {
      this.emitter.off(`job:${jobId}`, handler);
    };
  }
}

// Singleton
export const jobManager = new JobManager();
