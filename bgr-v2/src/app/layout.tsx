import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WebsiteStructuredData, OrganizationStructuredData } from "@/components/seo/StructuredData";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import AnalyticsBeacon from "@/components/analytics/AnalyticsBeacon";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bgrq.netlify.app'),
  title: {
    default: 'BGR - Board Game Review | ボードゲームレビューサイト',
    template: '%s | BGR'
  },
  description: 'ボードゲームのレビューと情報を共有するコミュニティサイト。BGG APIと連携した豊富なゲーム情報とユーザーレビューでお気に入りのボードゲームを見つけよう。',
  keywords: [
    'ボードゲーム', 'レビュー', 'BGG', 'Board Game Geek', 'アナログゲーム', 
    'テーブルゲーム', 'ボドゲ', 'ゲームレビュー', 'ボードゲーム情報'
  ],
  authors: [{ name: 'BGR Team' }],
  creator: 'BGR Team',
  publisher: 'BGR Team',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://bgrq.netlify.app',
    siteName: 'BGR - Board Game Review',
    title: 'BGR - Board Game Review | ボードゲームレビューサイト',
    description: 'ボードゲームのレビューと情報を共有するコミュニティサイト',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BGR - Board Game Review'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@BGR_BoardGame',
    creator: '@BGR_BoardGame',
    title: 'BGR - Board Game Review | ボードゲームレビューサイト',
    description: 'ボードゲームのレビューと情報を共有するコミュニティサイト',
    images: ['/images/twitter-image.jpg']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://bgrq.netlify.app',
    languages: {
      'ja-JP': 'https://bgrq.netlify.app'
    }
  },
  category: 'entertainment',
  classification: 'Board Games',
  other: {
    'msapplication-TileColor': '#2563eb',
    'theme-color': '#2563eb'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <WebsiteStructuredData />
        <OrganizationStructuredData />
        <link rel="preconnect" href="https://cf.geekdo-images.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
        <Toaster />
        {process.env.NODE_ENV === 'production' && <AnalyticsBeacon />}
      </body>
    </html>
  );
}
