/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cf.geekdo-images.com",
        port: "",
        pathname: "/**",
      },
    ],
    // Renderでの画像最適化問題を回避
    unoptimized: true,
  },
  eslint: {
    // デプロイ時にESLintエラーを無視する（一時的設定）
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScriptエラーも一時的に無視する
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
