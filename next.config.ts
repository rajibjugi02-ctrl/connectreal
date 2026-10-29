import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  allowedDevOrigins: [
    "10.100.101.214",
    "10.100.101.214:3000",
    "localhost:3000",
    "127.0.0.1:3000",
    "*.trycloudflare.com",
    "*.loca.lt",
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
