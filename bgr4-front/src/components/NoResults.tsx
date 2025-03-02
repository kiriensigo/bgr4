import { Box, Typography, Paper, Button } from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import Link from "next/link";

interface NoResultsProps {
  searchTerm?: string;
}

export default function NoResults({ searchTerm }: NoResultsProps) {
  return (
    <Paper
      sx={{
        p: 4,
        textAlign: "center",
        bgcolor: "grey.50",
        borderRadius: 2,
        mt: 2,
      }}
    >
      <SearchOffIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        検索結果がありません
      </Typography>
      {searchTerm && (
        <Typography variant="body1" color="text.secondary" paragraph>
          「{searchTerm}」に一致するゲームが見つかりませんでした。
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" paragraph>
        別のキーワードで検索するか、新しいゲームを登録してみてください。
      </Typography>
      <Box sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          href="/games/register"
        >
          ゲームを登録する
        </Button>
        <Button variant="outlined" component={Link} href="/games">
          ゲーム一覧に戻る
        </Button>
      </Box>
    </Paper>
  );
}
