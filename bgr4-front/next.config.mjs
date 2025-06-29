/** @type {import('next').NextConfig} */
const nextConfig = {
  // Render対応: 静的エクスポート設定
  output: "standalone",

  // 画像最適化設定
  images: {
    unoptimized: true,
    domains: [
      "cf.geekdo-images.com",
      "cf.geekdo-static.com",
      "boardgamegeek.com",
      "images.boardgamegeek.com",
    ],
  },

  // 環境変数設定
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // SWC最適化
  swcMinify: true,

  // 実験的機能
  experimental: {
    serverComponentsExternalPackages: ["@mui/material"],
  },

  // Render向け設定
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },

  // CORS設定
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
