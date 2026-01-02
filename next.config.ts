import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@boobalan_jkkn/shared"],

  // Add CORS headers for API routes
  async headers() {
    return [
      {
        // Apply to all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Key, x-api-key" },
        ],
      },
    ];
  },
};

export default nextConfig;
