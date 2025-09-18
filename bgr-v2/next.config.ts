import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env['ANALYZE'] === 'true',
})

const nextConfig: NextConfig = {
  // React Strict Mode を無効化（認証の無限ループを防止）
  reactStrictMode: false,

  // 画像最適化設定
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cf.geekdo-images.com',
      },
      {
        protocol: 'https', 
        hostname: 'example.com',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 1日キャッシュ
  },
  
  // 実験的機能 - パフォーマンス重視
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    optimizeCss: true, // 一時的に無効化
  },

  // Turbopack設定
  turbopack: {
    resolveAlias: {
      underscore: 'lodash',
      mocha: { browser: 'mocha/browser-entry.js' },
    },
  },

    modularizeImports: {
     'lucide-react': { 
      transform:  'lucide-react/dist/esm/icons/{{kebabCase member}}' 
    }
  },
// TypeScript設定
  typescript: {
    // TypeScriptエラーを再有効化してエラー詳細を確認
    ignoreBuildErrors: false,
  },

  // ESLint設定
  eslint: {
    // ビルド時にESLint警告を無視（一時的）
    ignoreDuringBuilds: true,
  },

  // Webpack設定
  webpack: (config: any) => {
    // Supabase realtime-js の critical dependency warning を解決
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    }
    
    // websocket-factory の警告を無視
    config.ignoreWarnings = [
      {
        module: /websocket-factory/,
        message: /the request of a dependency is an expression/,
      },
    ]
    
    return config
  },

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co https://accounts.google.com https://api.twitter.com https://boardgamegeek.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ],
      },
    ]
  },

  // リダイレクト設定
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // 本番環境での環境変数
  env: {
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'] || 'https://bgrq.netlify.app',
  },

  // 出力設定（Netlify用）
  // output: 'export', // API Routesが必要なためコメントアウト
  trailingSlash: false,

  // パフォーマンス最適化
  compress: true,
  
  // 静的ファイル最適化（削除済み - 上で設定）
  
  // PWA対応（将来用）
  // output: 'standalone',
};

export default withBundleAnalyzer(nextConfig);




