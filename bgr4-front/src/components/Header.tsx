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
} from "@mui/material";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export default function Header() {
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    signOut();
    handleClose();
  };

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
            <Link href="/" passHref>
              <Button color="inherit">ホーム</Button>
            </Link>
            <Link href="/reviews" passHref>
              <Button color="inherit">最新レビュー</Button>
            </Link>
            <Link href="/games" passHref>
              <Button color="inherit">ゲーム一覧</Button>
            </Link>

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
