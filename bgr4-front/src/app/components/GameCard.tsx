import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Rating,
} from "@mui/material";
import { Game } from "@/types/game";
import Link from "next/link";
import PlaceholderImage from "./PlaceholderImage";
import { formatDate } from "@/lib/utils";

interface GameCardProps {
  game: Game;
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  // 日本語名があれば表示、なければ英語名を表示
  const displayName = game.japanese_name || game.name;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
        },
      }}
    >
      <Link
        href={`/games/${game.id}`}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Box sx={{ position: "relative", paddingTop: "75%", width: "100%" }}>
          {game.image_url ? (
            <CardMedia
              component="img"
              image={game.image_url}
              alt={displayName}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: 1,
                backgroundColor: "#f5f5f5",
              }}
            />
          ) : (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                padding: 1,
              }}
            >
              <PlaceholderImage gameName={displayName} />
            </Box>
          )}
        </Box>

        <CardContent
          sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{
              mb: 1,
              fontWeight: "bold",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              lineHeight: "1.3em",
              height: "2.6em",
            }}
          >
            {displayName}
          </Typography>

          {game.name !== displayName && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
              }}
            >
              {game.name}
            </Typography>
          )}

          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Rating
              value={game.average_score ? game.average_score / 2 : 0}
              precision={0.5}
              readOnly
              size="small"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {game.average_score ? game.average_score.toFixed(1) : "N/A"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
            <Chip
              label={`${game.min_players}-${game.max_players}人`}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.7rem" }}
            />
            <Chip
              label={`${game.play_time}分`}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.7rem" }}
            />
          </Box>

          {game.designer && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                mb: 0.5,
              }}
            >
              デザイナー: {game.designer}
            </Typography>
          )}

          {game.publisher && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                mb: 0.5,
              }}
            >
              出版社: {game.publisher}
            </Typography>
          )}

          {game.release_date && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: "auto" }}
            >
              発売日: {formatDate(game.release_date)}
            </Typography>
          )}
        </CardContent>
      </Link>
    </Card>
  );
};

export default GameCard;
