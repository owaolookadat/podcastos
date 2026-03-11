import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large request bodies for video upload
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // Exclude native modules from webpack bundling
  serverExternalPackages: ["better-sqlite3", "fluent-ffmpeg"],
};

export default nextConfig;
