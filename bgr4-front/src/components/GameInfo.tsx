import { Box, Typography } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

type GameInfoProps = {
  minPlayers: number;
  maxPlayers: number;
  playTime: number;
};

export default function GameInfo({
  minPlayers,
  maxPlayers,
  playTime,
}: GameInfoProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        color: "text.secondary",
        "& .MuiSvgIcon-root": { fontSize: 16 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <GroupIcon />
        <Typography variant="body2">
          {minPlayers}-{maxPlayers}人
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <AccessTimeIcon />
        <Typography variant="body2">{playTime}分</Typography>
      </Box>
    </Box>
  );
}
