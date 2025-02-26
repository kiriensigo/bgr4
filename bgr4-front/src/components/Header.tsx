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
import { useState } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  const menuItems = [
    { label: "ホーム", path: "/" },
    { label: "検索", path: "/search" },
    { label: "レビュー一覧", path: "/reviews" },
    ...(user ? [{ label: "ゲーム登録", path: "/games/register" }] : []),
    ...(user?.email?.endsWith("@boardgamereview.com") ||
    user?.email === "admin@example.com"
      ? [{ label: "編集履歴", path: "/admin/edit-histories" }]
      : []),
  ];

  if (isMobile) {
    return (
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BGR4
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
              BGReviews
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

            {user && (
              <Link href="/games/register" passHref>
                <Tooltip title="ゲームを登録">
                  <Button
                    color="primary"
                    startIcon={<AddCircleOutlineIcon />}
                    variant="outlined"
                    size="small"
                  >
                    登録
                  </Button>
                </Tooltip>
              </Link>
            )}

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
