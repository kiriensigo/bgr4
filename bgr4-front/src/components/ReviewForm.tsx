"use client";

import { useState } from "react";
import { Box, TextField, Button, Rating, Typography } from "@mui/material";

type ReviewFormProps = {
  onSubmit: (review: { content: string; rating: number }) => void;
};

export default function ReviewForm({ onSubmit }: ReviewFormProps) {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content && rating) {
      onSubmit({ content, rating });
      setContent("");
      setRating(null);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ mb: 2 }}>
        <Typography component="legend">評価</Typography>
        <Rating
          value={rating}
          onChange={(_, newValue) => setRating(newValue)}
          precision={0.5}
        />
      </Box>
      <TextField
        fullWidth
        multiline
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        label="レビュー内容"
        margin="normal"
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={!content || !rating}
        sx={{ mt: 2 }}
      >
        レビューを投稿
      </Button>
    </Box>
  );
}
