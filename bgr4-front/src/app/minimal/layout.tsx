import React from "react";
import { Inter } from "next/font/google";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import theme from "../../theme";

// フォントの設定
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "BGr4 Minimal",
  description: "Minimal BGr4 Frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
