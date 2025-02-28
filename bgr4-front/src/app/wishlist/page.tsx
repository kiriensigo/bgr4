"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getWishlist, removeFromWishlist, WishlistItem } from "@/lib/api";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { containerStyle, LAYOUT_CONFIG } from "@/styles/layout";

export default function WishlistPage() {
  const router = useRouter();
  const { user, getAuthHeaders } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  // ユーザーがログインしていない場合はログインページにリダイレクト
  useEffect(() => {
    if (!user && !loading) {
      router.push("/login?redirect=/wishlist");
    }
  }, [user, loading, router]);

  // やりたいリストを取得
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const authHeaders = getAuthHeaders();
        const items = await getWishlist(authHeaders);
        setWishlistItems(items);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        setError(
          error instanceof Error
            ? error.message
            : "やりたいリストの取得に失敗しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user, getAuthHeaders]);

  // やりたいリストから削除
  const handleRemoveFromWishlist = async (itemId: number) => {
    try {
      setDeleting(itemId);
      const authHeaders = getAuthHeaders();
      await removeFromWishlist(itemId, authHeaders);
      // 削除成功したらリストから削除
      setWishlistItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      setError(
        error instanceof Error
          ? error.message
          : "やりたいリストからの削除に失敗しました"
      );
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false}>
      <Box sx={containerStyle}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/")}
            sx={{ mr: 2 }}
          >
            戻る
          </Button>
          <Typography variant="h4" component="h1">
            やりたいリスト
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {wishlistItems.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              やりたいリストにはまだゲームがありません
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              ゲーム詳細ページで「やりたい！」ボタンを押すと、ここに追加されます。
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push("/games")}
              sx={{ mt: 2 }}
            >
              ゲームを探す
            </Button>
          </Paper>
        ) : (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="body1" paragraph>
                ゲーム詳細ページで「やりたい！」ボタンを押すと、ここに追加されます。最大10件まで登録できます。
              </Typography>
              <Typography variant="body2" color="text.secondary">
                現在の登録数: {wishlistItems.length}/10
              </Typography>
            </Paper>

            <Grid container spacing={LAYOUT_CONFIG.gridSpacing}>
              {wishlistItems.map((item) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={`wishlist-item-${item.id}`}
                >
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                    }}
                  >
                    <Tooltip title="削除">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveFromWishlist(item.id)}
                        disabled={deleting === item.id}
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          zIndex: 1,
                          bgcolor: "rgba(255, 255, 255, 0.8)",
                        }}
                      >
                        {deleting === item.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <DeleteIcon />
                        )}
                      </IconButton>
                    </Tooltip>

                    <CardActionArea
                      component={Link}
                      href={`/games/${item.game_id}`}
                      sx={{ flexGrow: 1 }}
                    >
                      <CardMedia
                        component="img"
                        image={item.game?.image_url || "/images/no-image.png"}
                        alt={item.game?.name || "ゲーム画像"}
                        sx={{
                          aspectRatio: "1",
                          objectFit: "contain",
                          bgcolor: "grey.100",
                        }}
                      />
                      <CardContent>
                        <Typography
                          gutterBottom
                          variant="h6"
                          component="h2"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            minHeight: "3.6em",
                          }}
                        >
                          {item.game?.japanese_name ||
                            item.game?.name ||
                            "不明なゲーム"}
                        </Typography>

                        {item.game?.japanese_name &&
                          item.game?.japanese_name !== item.game?.name && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {item.game.name}
                            </Typography>
                          )}

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mt: 1,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {item.game?.min_players}～{item.game?.max_players}人
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.game?.play_time}分
                          </Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Box>
    </Container>
  );
}
