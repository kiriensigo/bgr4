/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "cf.geekdo-images.com",
      },
      {
        protocol: "https",
        hostname: "boardgamegeek.com",
      },
      {
        protocol: "https",
        hostname: "*.boardgamegeek.com",
      },
      {
        protocol: "https",
        hostname: "*.geekdo-images.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "http",
        hostname: "*.jp",
      },
      {
        protocol: "https",
        hostname: "*.jp",
      },
      {
        protocol: "http",
        hostname: "*.com",
      },
      {
        protocol: "https",
        hostname: "*.com",
      },
      {
        protocol: "http",
        hostname: "*.net",
      },
      {
        protocol: "https",
        hostname: "*.net",
      },
    ],
    domains: ["*"],
    unoptimized: true,
  },
  // APIリクエストをプロキシする設定
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        // Dockerコンテナの直接IPアドレスを使用
        destination: "http://172.19.0.3:8080/api/:path*",
      },
      {
        source: "/auth/:path*",
        // 認証エンドポイント用のプロキシ設定
        destination: "http://172.19.0.3:8080/auth/:path*",
      },
    ];
  },
};
module.exports = nextConfig;
