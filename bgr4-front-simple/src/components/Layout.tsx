import React, { ReactNode } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  createTheme,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";
import Head from "next/head";
import Link from "next/link";
import HomeIcon from "@mui/icons-material/Home";
import GamesIcon from "@mui/icons-material/Games";

// MUIテーマの作成
const theme = createTheme({
  palette: {
    primary: {
      main: "#3f51b5", // インディゴ
    },
    secondary: {
      main: "#f50057", // ピンク
    },
    background: {
      default: "#f5f5f5",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "0 4px 4px 0",
        },
      },
    },
  },
});

interface LayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  currentPath?: string;
}

export default function Layout({
  children,
  title,
  description = "BGr4 ボードゲームレビューアプリケーション",
  maxWidth = "lg",
  currentPath = "",
}: LayoutProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Head>
        <title>{title} | BGr4</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BGr4
          </Typography>
          <Button
            color="inherit"
            component={Link}
            href="/"
            startIcon={<HomeIcon />}
            sx={{ mr: 1, fontWeight: currentPath === "/" ? "bold" : "normal" }}
          >
            ホーム
          </Button>
          <Button
            color="inherit"
            component={Link}
            href="/games"
            startIcon={<GamesIcon />}
            sx={{
              fontWeight: currentPath.startsWith("/games") ? "bold" : "normal",
            }}
          >
            ゲーム一覧
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth={maxWidth} sx={{ py: 4 }}>
        {children}
      </Container>

      <Box
        component="footer"
        sx={{ mt: 4, py: 3, bgcolor: "background.paper", textAlign: "center" }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} BGr4 -
          ボードゲームレビューアプリケーション
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          このアプリケーションはCloud Runでホストされています
        </Typography>
      </Box>
    </ThemeProvider>
  );
}
