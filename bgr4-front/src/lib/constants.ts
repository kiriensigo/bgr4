// 定数設定
export const PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 72];
export const DEFAULT_PAGE_SIZE = 24;

// ソートオプション
export const DEFAULT_SORT_OPTIONS = [
  { value: "name_asc", label: "名前（昇順）" },
  { value: "name_desc", label: "名前（降順）" },
  { value: "average_score_desc", label: "評価（高い順）" },
  { value: "average_score_asc", label: "評価（低い順）" },
  { value: "created_at_desc", label: "登録日（新しい順）" },
  { value: "created_at_asc", label: "登録日（古い順）" },
];
