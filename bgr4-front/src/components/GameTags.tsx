import { Box, Chip } from "@mui/material";

type GameTagsProps = {
  categories: string[];
  maxTags?: number;
};

export default function GameTags({ categories, maxTags = 3 }: GameTagsProps) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        flexWrap: "wrap",
        mt: 1,
      }}
    >
      {categories.slice(0, maxTags).map((category) => (
        <Chip key={category} label={category} size="small" variant="outlined" />
      ))}
    </Box>
  );
}
