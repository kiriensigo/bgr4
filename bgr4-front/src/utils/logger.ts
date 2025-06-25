// 本番環境向けロガーユーティリティ
export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(...args);
    }
  },

  error: (...args: any[]) => {
    // エラーは本番環境でも出力（重要）
    console.error(...args);
  },

  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(...args);
    }
  },

  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(...args);
    }
  },
};

// 既存のconsole.logを段階的に置き換える際の一時的な対策
if (process.env.NODE_ENV === "production") {
  // 本番環境では一般的なconsole.logを無効化
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    // 重要なログのみ出力（エラー関連など）
    if (
      args.some(
        (arg) =>
          typeof arg === "string" &&
          (arg.includes("Error") || arg.includes("Failed"))
      )
    ) {
      originalLog(...args);
    }
    // その他のログは無効化
  };
}
