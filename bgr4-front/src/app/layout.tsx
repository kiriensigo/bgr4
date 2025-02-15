"use client";

import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import theme from "@/lib/theme";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
              }}
            >
              <Header />
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  py: 4,
                  px: 2,
                }}
              >
                {children}
              </Box>
              <Footer />
            </Box>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
