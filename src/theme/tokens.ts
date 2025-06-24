// 統一デザイントークン

export const designTokens = {
  // スペーシング
  spacing: {
    xs: 4, // 0.5rem
    sm: 8, // 1rem
    md: 16, // 2rem
    lg: 24, // 3rem
    xl: 32, // 4rem
    xxl: 48, // 6rem
  },

  // タイポグラフィ
  typography: {
    sizes: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      xxl: "1.5rem", // 24px
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.2,
      base: 1.5,
      relaxed: 1.75,
    },
  },

  // カラー
  colors: {
    primary: {
      50: "#e3f2fd",
      100: "#bbdefb",
      500: "#2196f3",
      700: "#1976d2",
      900: "#0d47a1",
    },
    text: {
      primary: "rgba(0, 0, 0, 0.87)",
      secondary: "rgba(0, 0, 0, 0.6)",
      disabled: "rgba(0, 0, 0, 0.38)",
    },
    background: {
      paper: "#ffffff",
      default: "#f5f5f5",
      overlay: "rgba(255, 255, 255, 0.9)",
    },
    success: "#4caf50",
    warning: "#ff9800",
    error: "#f44336",
  },

  // ボーダー
  borders: {
    radius: {
      none: 0,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999,
    },
    width: {
      thin: 1,
      medium: 2,
      thick: 4,
    },
  },

  // シャドウ
  shadows: {
    sm: "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
    md: "0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)",
    lg: "0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)",
    xl: "0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)",
  },

  // トランジション
  transitions: {
    fast: "150ms ease-in-out",
    base: "300ms ease-in-out",
    slow: "500ms ease-in-out",
  },

  // レイアウト
  layout: {
    maxWidth: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      full: "100%",
    },
    breakpoints: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },

  // アスペクト比
  aspectRatios: {
    square: "1:1",
    video: "16:9",
    card: "3:4",
    wide: "21:9",
  },
} as const;

// ゲームカード専用のトークン
export const gameCardTokens = {
  // カードサイズ
  sizes: {
    compact: {
      width: 200,
      height: 300,
      imageHeight: 200,
    },
    list: {
      width: "100%",
      height: 120,
      imageWidth: 80,
      imageHeight: 80,
    },
    featured: {
      width: 300,
      height: 450,
      imageHeight: 300,
    },
  },

  // アイコンサイズ
  iconSizes: {
    small: 16,
    medium: 20,
    large: 24,
  },

  // レーティング表示
  rating: {
    starSize: {
      small: 16,
      medium: 20,
      large: 24,
    },
    scoreDisplay: {
      compact: {
        fontSize: "0.875rem",
        fontWeight: 600,
      },
      default: {
        fontSize: "1rem",
        fontWeight: 600,
      },
      large: {
        fontSize: "1.25rem",
        fontWeight: 700,
      },
    },
  },
} as const;

export default designTokens;
