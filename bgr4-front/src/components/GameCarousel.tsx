"use client";

import React from "react";
import Slider from "react-slick";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import GameCard from "./GameCard";
import { Game } from "@/lib/api";

// slick-carouselのCSSはglobals.cssでインポート済み

interface GameCarouselProps {
  title: string;
  games: Game[];
  loading?: boolean;
}

export default function GameCarousel({
  title,
  games,
  loading = false,
}: GameCarouselProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // 画面サイズに応じて表示するスライド数を調整
  const slidesToShow = isMobile ? 1 : isTablet ? 2 : 4;

  const settings = {
    dots: true,
    infinite: games.length > slidesToShow,
    speed: 500,
    slidesToShow: slidesToShow,
    slidesToScroll: 1,
    autoplay: false,
    arrows: !isMobile,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          arrows: false,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
        },
      },
    ],
  };

  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
        {title}
      </Typography>
      {games.length > 0 ? (
        <Slider {...settings}>
          {games.map((game) => (
            <Box key={game.id || game.bgg_id} sx={{ px: 1 }}>
              <GameCard
                game={game}
                type="game"
                useOverallScoreDisplay={true}
                overallScoreVariant="compact"
                showOverallScoreOverlay={false}
              />
            </Box>
          ))}
        </Slider>
      ) : (
        <Typography variant="body1" color="text.secondary" align="center">
          {loading ? "読み込み中..." : "表示するゲームがありません"}
        </Typography>
      )}
    </Box>
  );
}
