#!/bin/bash

# 検索APIの統合テストスクリプト

BASE_URL="http://localhost:3001/api/search/reviews"

echo "検索API 統合テスト開始"
echo "=========================="

# テスト1: 基本検索
echo "テスト1: 基本検索"
RESULT=$(curl -s "$BASE_URL")
if echo "$RESULT" | grep -q '"success":true'; then
  echo "✅ 基本検索: 成功"
else
  echo "❌ 基本検索: 失敗"
  echo "$RESULT" | head -3
fi

# テスト2: 総合得点フィルター
echo "テスト2: 総合得点フィルター (8点以上)"
RESULT=$(curl -s "$BASE_URL?overallScoreMin=8")
if echo "$RESULT" | grep -q '"success":true'; then
  echo "✅ 総合得点フィルター: 成功"
else
  echo "❌ 総合得点フィルター: 失敗"
fi

# テスト3: プレイ人数フィルター
echo "テスト3: プレイ人数フィルター (2人)"
RESULT=$(curl -s "$BASE_URL?gamePlayerCounts=2")
if echo "$RESULT" | grep -q '"success":true'; then
  echo "✅ プレイ人数フィルター: 成功"
else
  echo "❌ プレイ人数フィルター: 失敗"
fi

# テスト4: メカニクスフィルター
echo "テスト4: メカニクスフィルター"
RESULT=$(curl -s "$BASE_URL?mechanics=%E3%82%A8%E3%83%AA%E3%82%A2%E6%94%AF%E9%85%8D")
if echo "$RESULT" | grep -q '"success":true'; then
  echo "✅ メカニクスフィルター: 成功"
else
  echo "❌ メカニクスフィルター: 失敗"
fi

# テスト5: 複数条件組み合わせ
echo "テスト5: 複数条件組み合わせ"
RESULT=$(curl -s "$BASE_URL?overallScoreMin=7&gamePlayerCounts=2&mechanics=%E3%82%A8%E3%83%AA%E3%82%A2%E6%94%AF%E9%85%8D")
if echo "$RESULT" | grep -q '"success":true'; then
  echo "✅ 複数条件組み合わせ: 成功"
else
  echo "❌ 複数条件組み合わせ: 失敗"
fi

# テスト6: ページネーション
echo "テスト6: ページネーション"
RESULT=$(curl -s "$BASE_URL?page=1&limit=5")
if echo "$RESULT" | grep -q '"page":1' && echo "$RESULT" | grep -q '"limit":5'; then
  echo "✅ ページネーション: 成功"
else
  echo "❌ ページネーション: 失敗"
fi

# テスト7: ソート機能
echo "テスト7: ソート機能"
RESULT=$(curl -s "$BASE_URL?sortBy=overall_score&sortOrder=desc")
if echo "$RESULT" | grep -q '"sortBy":"overall_score"'; then
  echo "✅ ソート機能: 成功"
else
  echo "❌ ソート機能: 失敗"
fi

# テスト8: プレイ時間フィルター
echo "テスト8: プレイ時間フィルター"
RESULT=$(curl -s "$BASE_URL?playTimeMin=60&playTimeMax=120")
if echo "$RESULT" | grep -q '"success":true'; then
  echo "✅ プレイ時間フィルター: 成功"
else
  echo "❌ プレイ時間フィルター: 失敗"
fi

# テスト9: 5軸評価範囲フィルター
echo "テスト9: 5軸評価範囲フィルター"
RESULT=$(curl -s "$BASE_URL?ruleComplexityMin=3&ruleComplexityMax=5&luckFactorMin=2&luckFactorMax=4")
if echo "$RESULT" | grep -q '"success":true'; then
  echo "✅ 5軸評価範囲フィルター: 成功"
else
  echo "❌ 5軸評価範囲フィルター: 失敗"
fi

# テスト10: 不正なパラメータ
echo "テスト10: 不正なパラメータ処理"
RESULT=$(curl -s "$BASE_URL?overallScoreMin=invalid")
if echo "$RESULT" | grep -q '"success":true'; then
  echo "✅ 不正パラメータ処理: 成功 (エラーにならず処理継続)"
else
  echo "❌ 不正パラメータ処理: 失敗"
fi

echo "=========================="
echo "検索API 統合テスト完了"