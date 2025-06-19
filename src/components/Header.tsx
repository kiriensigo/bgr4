"use client";

import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import Link from "next/link";
import React from "react";

const Header = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{ flexGrow: 1, color: "inherit", textDecoration: "none" }}
        >
          ボードゲームレビュー
        </Typography>
        <Box>
          <Button color="inherit" component={Link} href="/">
            ホーム
          </Button>
          <Button color="inherit" component={Link} href="/games">
            ゲーム一覧
          </Button>
          <Button color="inherit" component={Link} href="/reviews/my">
            マイレビュー
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
