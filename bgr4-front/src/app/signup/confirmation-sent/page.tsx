"use client";

import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
} from "@mui/material";
import Link from "next/link";
import MailIcon from "@mui/icons-material/Mail";
import { useSearchParams } from "next/navigation";

export default function ConfirmationSentPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <MailIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />

          <Typography variant="h4" component="h1" gutterBottom>
            確認メールを送信しました
          </Typography>

          {email && (
            <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
              <Typography variant="body1">
                {email} 宛に確認メールを送信しました。
              </Typography>
            </Alert>
          )}

          <Typography variant="body1" color="text.secondary" paragraph>
            メールに記載されているリンクをクリックして、登録を完了してください。
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            メールが届かない場合は、迷惑メールフォルダもご確認ください。
          </Typography>

          <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              component={Link}
              href="/login"
              variant="contained"
              fullWidth
            >
              ログインページへ
            </Button>

            <Button component={Link} href="/" variant="outlined" fullWidth>
              ホームに戻る
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
