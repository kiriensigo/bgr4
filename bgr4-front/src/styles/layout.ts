// 共通のレイアウト設定
export const LAYOUT_CONFIG = {
  // コンテナの最大幅
  maxWidth: "900px",

  // ページ全体のパディング
  pagePadding: {
    xs: 2, // モバイル
    sm: 3, // タブレット
    md: 4, // デスクトップ
  },

  // セクション間の間隔
  sectionSpacing: 4,

  // カードのパディング
  cardPadding: 4,

  // グリッドのギャップ
  gridSpacing: 3,
} as const;

// 共通のコンテナスタイル
export const containerStyle = {
  width: "100%",
  maxWidth: LAYOUT_CONFIG.maxWidth,
  mx: "auto",
  px: LAYOUT_CONFIG.pagePadding,
  py: LAYOUT_CONFIG.sectionSpacing,
};

// 共通のカードスタイル
export const cardStyle = {
  p: LAYOUT_CONFIG.cardPadding,
  mb: LAYOUT_CONFIG.sectionSpacing,
};
