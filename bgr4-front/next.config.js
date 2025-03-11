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
};
module.exports = nextConfig;
