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
    console.log("リライト設定が呼び出されました");
    return [
      {
        source: "/api/:path*",
        destination: "http://bgr4-api:8080/api/:path*", // Docker サービス名で指定
      },
      {
        source: "/auth/:path*",
        destination: "http://bgr4-api:8080/auth/:path*", // Docker サービス名で指定
      },
    ];
  },
};
module.exports = nextConfig;
