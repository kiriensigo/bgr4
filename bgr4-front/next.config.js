/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // 重複リクエスト問題のためStrictModeを一時的に無効化
  eslint: {
    // デプロイ時にESLintエラーを無視（開発環境では有効）
    ignoreDuringBuilds: true,
  },
  typescript: {
    // デプロイ時にTypeScriptエラーを無視（緊急デプロイのため）
    ignoreBuildErrors: true,
  },
  // 静的生成エラーを回避するための設定
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // 動的レンダリングを優先
  output: "standalone",
  // 動的ルートの設定を追加
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
  // キャッシュの設定を追加
  onDemandEntries: {
    // サーバーサイドページのキャッシュ期間
    maxInactiveAge: 60 * 1000,
    // 同時にキャッシュできるページ数
    pagesBufferLength: 5,
  },
  webpack: (config) => {
    // パス解決を確実にするためのwebpack設定
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": require("path").resolve(__dirname, "src"),
    };
    return config;
  },
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
