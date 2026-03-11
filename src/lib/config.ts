import path from "path";
import fs from "fs";

export interface AppConfig {
  dataDir: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  ffmpegPath: string;
}

let _config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!_config) {
    const dataDir =
      process.env.DATA_DIR ||
      path.join(process.cwd(), "data");

    // Ensure data directories exist
    const dirs = ["uploads", "audio", "transcripts", "analyses", "exports"];
    for (const dir of dirs) {
      const dirPath = path.join(dataDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    _config = {
      dataDir,
      openaiApiKey: process.env.OPENAI_API_KEY || "",
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
      ffmpegPath: process.env.FFMPEG_PATH || "ffmpeg",
    };
  }
  return _config;
}
