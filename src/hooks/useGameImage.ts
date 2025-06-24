import { useState, useCallback } from "react";

interface UseGameImageProps {
  imageUrl?: string | null;
  fallbackUrl?: string;
}

interface UseGameImageReturn {
  displayImageUrl: string | null;
  isLoading: boolean;
  hasError: boolean;
  onLoad: () => void;
  onError: () => void;
  resetImage: () => void;
}

/**
 * ゲーム画像の読み込み状態を管理するフック
 *
 * 機能:
 * - 画像読み込み状態の管理
 * - エラー時のフォールバック処理
 * - 画像リセット機能
 */
export const useGameImage = ({
  imageUrl,
  fallbackUrl,
}: UseGameImageProps): UseGameImageReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const displayImageUrl = hasError ? fallbackUrl || null : imageUrl || null;

  const onLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const onError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const resetImage = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  return {
    displayImageUrl,
    isLoading,
    hasError,
    onLoad,
    onError,
    resetImage,
  };
};
