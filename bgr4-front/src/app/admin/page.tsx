"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Button,
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
} from "@mui/material";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      // 管理者権限を確認
      setIsAdmin(user.is_admin === true);
      if (!user.is_admin) {
        // 管理者でない場合はホームページにリダイレクト
        router.push("/");
      }
    } else if (!authLoading && !user) {
      // ログインしていない場合はログインページにリダイレクト
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !isAdmin) {
    return (
      <Container sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        管理者ページ
      </Typography>

      <Box mt={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  サイト管理
                </Typography>
                <List>
                  <ListItem
                    button
                    component="a"
                    href="/admin/edit-histories"
                    divider
                  >
                    <ListItemText primary="ゲーム編集履歴" />
                  </ListItem>
                  <ListItem
                    button
                    component="a"
                    href="/admin/bgg-top100"
                    divider
                  >
                    <ListItemText primary="BGG TOP 100 ゲーム登録" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  システム情報
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                  <Typography variant="body2">
                    ユーザー名: {user.name}
                  </Typography>
                  <Typography variant="body2">メール: {user.email}</Typography>
                  <Typography variant="body2">
                    権限: {user.is_admin ? "管理者" : "一般ユーザー"}
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
