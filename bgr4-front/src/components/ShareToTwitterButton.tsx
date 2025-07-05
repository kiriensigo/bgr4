"use client";

import { Button, SvgIcon } from "@mui/material";

// X（旧Twitter）のSVGアイコン
const XIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </SvgIcon>
);

interface ShareToTwitterProps {
  gameName: string;
  gameId: string | number;
  score: number | string;
  comment?: string;
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "info";
  fullWidth?: boolean;
}

export default function ShareToTwitterButton({
  gameName,
  gameId,
  score,
  comment = "",
  variant = "contained",
  size = "medium",
  color = "primary",
  fullWidth = false,
}: ShareToTwitterProps) {
  const handleShareClick = () => {
    // ゲーム名とスコア（必須）
    const formattedScore = typeof score === "number" ? score.toFixed(1) : score;

    // ゲームのURL
    const gameUrl = `${
      typeof window !== "undefined" ? window.location.origin : ""
    }/games/${gameId}`;

    // ツイート本文（140文字制限を考慮）
    let tweetText = `「${gameName}」を評価しました！\n評価: ${formattedScore}/10\n`;

    // コメントがあれば追加（短くする）
    if (comment) {
      // コメントの長さを制限（50文字まで）
      const shortenedComment =
        comment.length > 50 ? comment.substring(0, 47) + "..." : comment;
      tweetText += `${shortenedComment}\n`;
    }

    // ハッシュタグとURL追加
    tweetText += `#ボードゲーム #bgr4\n${gameUrl}`;

    // URLエンコード
    const encodedText = encodeURIComponent(tweetText);

    // ツイート投稿ページを開く
    if (typeof window !== "undefined") {
      window.open(`https://x.com/intent/tweet?text=${encodedText}`, "_blank");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      color={color}
      onClick={handleShareClick}
      startIcon={<XIcon />}
      fullWidth={fullWidth}
    >
      レビューをシェア
    </Button>
  );
}
