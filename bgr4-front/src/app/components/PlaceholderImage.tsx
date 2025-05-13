"use client";

import { Box, Typography } from "@mui/material";

interface PlaceholderImageProps {
  gameName?: string;
}

export default function PlaceholderImage({ gameName }: PlaceholderImageProps) {
  return (
    <Box
      sx={{
        width: "100%",
        height: "200px",
        backgroundColor: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 1,
      }}
    >
      <Typography variant="body1" color="text.secondary">
        {gameName ? `${gameName} - No Image` : "No Image"}
      </Typography>
    </Box>
  );
}
