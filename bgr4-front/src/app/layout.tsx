import { Inter } from "next/font/google";
import { Metadata } from "next";
import ClientLayout from "./ClientLayout";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "BGR - ボードゲームレビュー",
    template: "%s | BGR"
  },
  description: "ボードゲームのレビューと情報を共有するサイト。詳細な評価システムであなたにぴったりのボードゲームを見つけましょう。",
  keywords: ["ボードゲーム", "レビュー", "評価", "BoardGame", "Review", "BGR"],
  authors: [{ name: "BGR Team" }],
  creator: "BGR Team",
  publisher: "BGR",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://bgr4-front.onrender.com",
    title: "BGR - ボードゲームレビュー",
    description: "ボードゲームのレビューと情報を共有するサイト",
    siteName: "BGR",
    images: [
      {
        url: "/images/bgrlogo.png",
        width: 1200,
        height: 630,
        alt: "BGR Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BGR - ボードゲームレビュー",
    description: "ボードゲームのレビューと情報を共有するサイト",
    images: ["/images/bgrlogo.png"],
  },
  icons: {
    icon: "/images/bgrlogo.png",
    shortcut: "/images/bgrlogo.png",
    apple: "/images/bgrlogo.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/images/bgrlogo.png" />
        <link rel="apple-touch-icon" href="/images/bgrlogo.png" />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
