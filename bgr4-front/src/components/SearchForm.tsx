"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

// 日本語の出版社リスト
const JAPANESE_PUBLISHERS = [
  "ホビージャパン (Hobby Japan)",
  "アークライト (Arclight)",
  "数寄ゲームズ (Suki Games)",
  "オインクゲームズ (Oink Games)",
  "グラウンディング (Grounding Inc.)",
  "アズモデージャパン (Asmodee Japan)",
  "テンデイズゲームズ",
  "ニューゲームズオーダー",
  "すごろくや",
  "コロンアーク",
  "アナログランチボックス",
  "ドミナゲームズ",
  "おかずブランド",
  "ジェリージェリーゲームズ",
  "いつつ",
  "遊歩堂",
  "ヨクトゲームズ",
  "タコアシゲームズ",
  "耐気圏内ゲームズ",
  "チーム彩園",
];

interface SearchFormProps {
  initialQuery?: string;
}

export default function SearchForm({ initialQuery = "" }: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [publisher, setPublisher] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (query.trim()) {
      // キーワード検索
      router.push(`/games/search?query=${encodeURIComponent(query.trim())}`);
    } else if (publisher) {
      // 出版社検索
      router.push(`/games/search?publisher=${encodeURIComponent(publisher)}`);
    } else {
      // 何も入力されていない場合は全ゲーム表示
      router.push("/games/search");
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <form onSubmit={handleSubmit}>
        <Typography variant="h6" gutterBottom>
          ゲームを検索
        </Typography>

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="ゲーム名、出版社、デザイナーなどで検索"
            variant="outlined"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // キーワード検索を選択した場合は出版社をクリア
              if (e.target.value) setPublisher("");
            }}
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              または
            </Typography>
          </Divider>

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel id="publisher-select-label">
              日本語版の出版社で検索
            </InputLabel>
            <Select
              labelId="publisher-select-label"
              value={publisher}
              onChange={(e) => {
                setPublisher(e.target.value);
                // 出版社を選択した場合はキーワードをクリア
                if (e.target.value) setQuery("");
              }}
              label="日本語版の出版社で検索"
            >
              <MenuItem value="">
                <em>選択してください</em>
              </MenuItem>
              {JAPANESE_PUBLISHERS.map((pub) => (
                <MenuItem key={pub} value={pub}>
                  {pub}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={<SearchIcon />}
          fullWidth
        >
          検索
        </Button>
      </form>
    </Paper>
  );
}
