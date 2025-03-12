"use client";

import React from "react";
import Slider from "react-slick";
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Skeleton,
} from "@mui/material";
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
    lazyLoad: "ondemand" as const,
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

  // ローディング中のスケルトン表示
  const renderSkeletons = () => {
    const skeletons = [];
    for (let i = 0; i < slidesToShow; i++) {
      skeletons.push(
        <Box key={i} sx={{ px: 1 }}>
          <Box sx={{ p: 2 }}>
            <Skeleton
              variant="rectangular"
              width="100%"
              height={0}
              sx={{ paddingTop: "100%", mb: 2, borderRadius: 1 }}
            />
            <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" height={24} />
          </Box>
        </Box>
      );
    }
    return skeletons;
  };

  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
        {title}
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", overflow: "hidden" }}>
          {renderSkeletons()}
        </Box>
      ) : games.length > 0 ? (
        <Slider {...settings}>
          {games.map((game) => (
            <Box key={game.id || game.bgg_id} sx={{ px: 1 }}>
              <GameCard
                game={game}
                type="game"
                useOverallScoreDisplay={true}
                overallScoreVariant="compact"
                showOverallScoreOverlay={false}
                variant="carousel"
              />
            </Box>
          ))}
        </Slider>
      ) : (
        <Typography variant="body1" color="text.secondary" align="center">
          表示するゲームがありません
        </Typography>
      )}
    </Box>
  );
}
