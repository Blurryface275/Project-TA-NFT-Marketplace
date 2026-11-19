import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "nursery-cyclist-unwrapped.ngrok-free.dev",
    "*.ngrok-free.dev",
    "*.ngrok.app",
    "*.ngrok-free.app",
    "localhost:3000",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
