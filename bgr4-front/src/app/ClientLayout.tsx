"use client";

import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import theme from "@/lib/theme";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
          inert={undefined}
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
  );
}