import { Box, Chip } from "@mui/material";

type GameTagsProps = {
  tags: string[];
  maxTags?: number;
};

export default function GameTags({ tags, maxTags = 3 }: GameTagsProps) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        flexWrap: "wrap",
        mt: 1,
      }}
    >
      {tags.slice(0, maxTags).map((tag) => (
        <Chip key={tag} label={tag} size="small" variant="outlined" />
      ))}
    </Box>
  );
} 