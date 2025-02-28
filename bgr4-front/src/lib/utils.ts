import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 日付をフォーマットする関数
 * @param dateString - 日付文字列
 * @returns フォーマットされた日付文字列（YYYY年MM月DD日）
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "不明";

  try {
    const date = new Date(dateString);

    // 無効な日付の場合
    if (isNaN(date.getTime())) {
      return "不明";
    }

    // 年だけの場合（月と日が1月1日の場合）
    if (date.getMonth() === 0 && date.getDate() === 1) {
      return `${date.getFullYear()}年`;
    }

    // 完全な日付の場合
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  } catch (error) {
    console.error("日付のフォーマットエラー:", error);
    return "不明";
  }
}

/**
 * 数値を日本語の桁区切りでフォーマットする関数
 * @param num - フォーマットする数値
 * @returns カンマ区切りされた数値文字列
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0";
  return num.toLocaleString("ja-JP");
}

/**
 * 文字列を指定した長さで切り詰める関数
 * @param text - 元の文字列
 * @param maxLength - 最大長
 * @returns 切り詰められた文字列
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number
): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * 数値を指定した小数点以下の桁数で丸める関数
 *
 * @param value - 丸める数値
 * @param precision - 小数点以下の桁数
 * @returns 丸められた数値
 */
export function roundToDecimal(value: number, precision: number = 1): number {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * 配列をシャッフルする関数
 *
 * @param array - シャッフルする配列
 * @returns シャッフルされた新しい配列
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * 指定された範囲内のランダムな整数を生成する関数
 *
 * @param min - 最小値（含む）
 * @param max - 最大値（含む）
 * @returns ランダムな整数
 */
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
