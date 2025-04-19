"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Typography,
  Container,
  Button,
  Box,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import GamesIcon from "@mui/icons-material/Games";
import PeopleIcon from "@mui/icons-material/People";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import DashboardIcon from "@mui/icons-material/Dashboard";

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      setLoading(false);
      if (!user || !user.is_admin) {
        router.push("/");
      }
    }
  }, [user, authLoading, router]);

  const handleLogout = () => {
    router.push("/");
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  if (loading || authLoading) {
    return (
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (!user || !user.is_admin) {
    return null;
  }

  const adminLinks = [
    { title: "ゲーム管理", icon: <GamesIcon />, path: "/admin/games" },
    { title: "ユーザー管理", icon: <PeopleIcon />, path: "/admin/users" },
    { title: "レビュー管理", icon: <StarBorderIcon />, path: "/admin/reviews" },
    {
      title: "ダッシュボード",
      icon: <DashboardIcon />,
      path: "/admin/dashboard",
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            管理者ページ
          </Typography>
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            ログアウト
          </Button>
        </Box>

        <Typography variant="body1" gutterBottom>
          ようこそ、{user.name}さん！
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          管理者機能にアクセスできます。
        </Typography>

        <List>
          {adminLinks.map((link, index) => (
            <Box key={link.path}>
              <ListItem
                onClick={() => navigateTo(link.path)}
                sx={{
                  borderRadius: 1,
                  "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                  cursor: "pointer",
                }}
              >
                <Box sx={{ mr: 2 }}>{link.icon}</Box>
                <ListItemText primary={link.title} />
              </ListItem>
              {index < adminLinks.length - 1 && <Divider component="li" />}
            </Box>
          ))}
        </List>
      </Paper>
    </Container>
  );
}
