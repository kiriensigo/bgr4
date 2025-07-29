"use client";

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function Header() {
  const router = useRouter();
  const { user, signOut, getAuthHeaders } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [reviewCount, setReviewCount] = useState(0);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path: string) => {
    router.push(path);
    handleClose();
  };

  const handleSignOut = async () => {
    await signOut();
    handleClose();
    router.push("/");
  };

  // ユーザーのレビュー数を取得
  useEffect(() => {
    if (user) {
      const fetchReviewCount = async () => {
        try {
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
            }/api/v1/reviews/my`,
            {
              headers: {
                ...getAuthHeaders(),
              },
              credentials: "include",
            }
          );

          if (response.ok) {
            const data = await response.json();
            setReviewCount(
              Array.isArray(data.reviews) ? data.reviews.length : 0
            );
          } else {
            console.error("レビュー数の取得に失敗しました:", response.status);
            const errorData = await response.json().catch(() => ({}));
            console.error("エラー詳細:", errorData);
            setReviewCount(0);
          }
        } catch (error) {
          console.error("レビュー数の取得に失敗しました:", error);
          setReviewCount(0);
        }
      };

      fetchReviewCount();
    }
  }, [user, getAuthHeaders]);

  // レビュー5件以上のユーザーかどうかを判定
  const canRegisterGame = reviewCount >= 5;

  // 管理者かどうかを判定
  const isAdmin =
    user?.email?.endsWith("@boardgamereview.com") ||
    user?.email === "admin@example.com";

  // ゲーム登録リンクを表示するかどうか
  const showGameRegister = user && (canRegisterGame || isAdmin);

  const menuItems = [
    { label: "ホーム", path: "/" },
    { label: "検索", path: "/search" },
    { label: "ゲーム一覧", path: "/games" },
    { label: "レビュー一覧", path: "/reviews" },
    { label: "About", path: "/about" },
    ...(user && (showGameRegister || isAdmin)
      ? [{ label: "ゲーム登録", path: "/games/register" }]
      : []),
    ...(isAdmin ? [{ label: "編集履歴", path: "/admin/edit-histories" }] : []),
  ];

  if (isMobile) {
    return (
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BGR
          </Typography>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={handleMenu}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            {menuItems.map((item) => (
              <MenuItem
                key={item.path}
                onClick={() => handleMenuItemClick(item.path)}
              >
                {item.label}
              </MenuItem>
            ))}
            {user ? (
              <MenuItem onClick={handleSignOut}>ログアウト</MenuItem>
            ) : (
              <MenuItem onClick={() => handleMenuItemClick("/auth/signin")}>
                ログイン
              </MenuItem>
            )}
          </Menu>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Typography
              variant="h6"
              color="inherit"
              noWrap
              sx={{ fontWeight: "bold" }}
            >
              BGR
            </Typography>
          </Link>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {menuItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => router.push(item.path)}
              >
                {item.label}
              </Button>
            ))}

            {user ? (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <IconButton
                  onClick={handleMenu}
                  size="large"
                  aria-label="アカウントメニュー"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  color="inherit"
                >
                  {user.avatar_url ? (
                    <Avatar
                      src={user.avatar_url}
                      alt={user.name}
                      sx={{ width: 32, height: 32 }}
                    />
                  ) : (
                    <AccountCircleIcon />
                  )}
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem
                    component={Link}
                    href="/profile"
                    onClick={handleClose}
                  >
                    プロフィール
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    href="/reviews/my"
                    onClick={handleClose}
                  >
                    マイレビュー
                  </MenuItem>
                  <MenuItem onClick={handleSignOut}>ログアウト</MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Link href="/login" passHref>
                  <Button variant="contained" color="primary">
                    ログイン
                  </Button>
                </Link>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
