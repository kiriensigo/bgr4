"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  CircularProgress,
  Pagination,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useAuth } from "../../../contexts/AuthContext";
import { getGameEditHistories, type GameEditHistory } from "../../../lib/api";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";

export default function EditHistoriesPage() {
  const { user, getAuthHeaders } = useAuth();
  const router = useRouter();
  const [histories, setHistories] = useState<GameEditHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedHistory, setSelectedHistory] =
    useState<GameEditHistory | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    // ユーザーがログインしていない場合はログインページにリダイレクト
    if (user === null) {
      router.push("/login?redirect=/admin/edit-histories");
      return;
    }

    const fetchHistories = async () => {
      try {
        setLoading(true);
        setError(null);
        const authHeaders = getAuthHeaders();
        const response = await getGameEditHistories(
          authHeaders,
          undefined,
          page
        );
        setHistories(response.histories);
        setTotalPages(response.total_pages);
      } catch (err) {
        console.error("Error fetching edit histories:", err);
        setError(
          err instanceof Error ? err.message : "予期せぬエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistories();
  }, [user, router, page, getAuthHeaders]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "register_game":
        return "ゲーム登録";
      case "update_japanese_name":
        return "日本語名更新";
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "register_game":
        return "primary";
      case "update_japanese_name":
        return "secondary";
      default:
        return "default";
    }
  };

  const handleOpenDialog = (history: GameEditHistory) => {
    setSelectedHistory(history);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // この関数は実際には実装されていませんが、将来的に実装する予定です
  const handleDeleteUser = async () => {
    if (!selectedHistory) return;

    try {
      // ここでユーザーの削除APIを呼び出す
      alert(
        `ユーザー ${selectedHistory.user_name} の削除機能は現在実装中です。`
      );
      setOpenDialog(false);
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("ユーザーの削除に失敗しました");
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/")}
        >
          ホームに戻る
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h4" component="h1">
          編集履歴
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/")}
        >
          ホームに戻る
        </Button>
      </Box>

      {histories.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography>編集履歴がありません</Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>日時</TableCell>
                  <TableCell>ユーザー</TableCell>
                  <TableCell>ゲーム</TableCell>
                  <TableCell>操作</TableCell>
                  <TableCell>詳細</TableCell>
                  <TableCell>アクション</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {histories.map((history) => (
                  <TableRow key={history.id}>
                    <TableCell>{formatDate(history.created_at)}</TableCell>
                    <TableCell>
                      {history.user_name}
                      <Typography variant="caption" display="block">
                        {history.user_email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Link href={`/games/${history.game_id}`}>
                        {history.game_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getActionLabel(history.action)}
                        color={getActionColor(history.action) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {history.action === "update_japanese_name" && (
                        <>
                          {history.details.old_value ? (
                            <Typography variant="body2">
                              {history.details.old_value} →{" "}
                              {history.details.new_value}
                            </Typography>
                          ) : (
                            <Typography variant="body2">
                              新規登録: {history.details.new_value}
                            </Typography>
                          )}
                        </>
                      )}
                      {history.action === "register_game" && (
                        <Typography variant="body2">
                          BGG ID: {history.details.bgg_id}
                          {history.details.source === "auto_register" && (
                            <Chip
                              label="自動登録"
                              size="small"
                              color="info"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleOpenDialog(history)}
                      >
                        ユーザー削除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      )}

      {/* ユーザー削除確認ダイアログ */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>ユーザーを削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedHistory && (
              <>
                <strong>{selectedHistory.user_name}</strong> (
                {selectedHistory.user_email})
                を削除すると、このユーザーが登録したすべてのデータ（ゲーム、レビュー、コメントなど）も削除されます。
                <br />
                この操作は取り消せません。本当に削除しますか？
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleDeleteUser} color="error">
            削除する
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
