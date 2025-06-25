/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
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
        hostname: "*.geekdo-images.com",
      },
      {
        protocol: "https",
        hostname: "*.boardgamegeek.com",
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
        hostname: "localhost",
      },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000, // 1年間キャッシュ
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  httpAgentOptions: {
    keepAlive: true,
  },
};
module.exports = nextConfig;
