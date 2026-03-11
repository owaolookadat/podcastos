CREATE TABLE `analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`episode_id` text NOT NULL,
	`summary` text,
	`clip_recommendations` text NOT NULL,
	`longform_notes` text NOT NULL,
	`raw_response` text,
	`model_used` text,
	`prompt_tokens` integer,
	`output_tokens` integer,
	`processing_time_ms` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `clips` (
	`id` text PRIMARY KEY NOT NULL,
	`episode_id` text NOT NULL,
	`analysis_id` text,
	`title` text NOT NULL,
	`start_time` real NOT NULL,
	`end_time` real NOT NULL,
	`transcript` text,
	`hook_score` real,
	`relatability_score` real,
	`emotion_score` real,
	`quotability_score` real,
	`curiosity_score` real,
	`overall_score` real,
	`reasoning` text,
	`suggested_caption` text,
	`export_path` text,
	`export_format` text,
	`status` text DEFAULT 'recommended' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`analysis_id`) REFERENCES `analyses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `episodes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`original_filename` text NOT NULL,
	`file_path` text,
	`audio_path` text,
	`file_size_bytes` integer,
	`duration_seconds` real,
	`status` text DEFAULT 'uploading' NOT NULL,
	`error_message` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`episode_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`progress` real DEFAULT 0,
	`message` text,
	`error_message` text,
	`started_at` text,
	`completed_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transcripts` (
	`id` text PRIMARY KEY NOT NULL,
	`episode_id` text NOT NULL,
	`full_text` text NOT NULL,
	`language` text,
	`segments` text NOT NULL,
	`model_used` text,
	`processing_time_ms` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`id`) ON UPDATE no action ON DELETE cascade
);
