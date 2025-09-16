// Enhanced Game Review System Constants

export const MECHANICS = [
  "エリア支配",
  "ダイスロール", 
  "オークション",
  "デッキ/バッグビルド",
  "拡大再生産",
  "エンジンビルド",
  "正体隠匿",
  "モジュラーボード",
  "ルート構築",
  "ドラフト",
  "バースト",
  "同時手番",
  "タイル配置",
  "プレイヤー別能力",
  "ワーカープレイスメント",
  "賭け",
  "協力",
  "チーム戦",
  "パターン構築",
  "セット収集",
  "カードドラフト",
  "手札管理",
  "リソース管理",
  "陣取り",
  "交渉",
] as const;

export const CATEGORIES = [
  "協力",
  "チーム戦", 
  "子供",
  "ソロ向き",
  "ペア向き",
  "多人数向き",
  "推理",
  "ブラフ",
  "記憶",
  "交渉",
  "演技",
  "紙ペン",
  "動物",
  "かわいい",
  "映え",
  "カードゲーム",
  "トリテ",
  "パーティー",
  "パズル",
  "ウォーゲーム",
  "ワードゲーム",
  "レガシー・キャンペーン",
  "ファミリー",
  "戦略",
  "抽象戦略",
  "経済",
  "文明",
  "都市建設",
  "ファンタジー",
  "SF",
  "歴史",
] as const;

export const PUBLISHERS = [
  "ホビージャパン",
  "アークライト",
  "数寄ゲームズ", 
  "オインクゲームズ",
  "グラウンディング",
  "アズモデージャパン",
  "テンデイズゲームズ",
  "ニューゲームズオーダー",
  "すごろくや",
  "コロンアーク", 
  "ダイスタワー",
  "ボードゲームジャパン",
  "ゲームマーケット",
  "ジーピー",
  "ハコニワ",
  "イエローサブマリン",
  "カプコン",
  "バンダイ",
  "JELLY JELLY GAMES",
] as const;

export const PLAYER_COUNT_OPTIONS = ["1", "2", "3", "4", "5", "6", "7"] as const;

export const PLAY_TIME_RANGES = [
  { min: 0, max: 15, label: "15分以下", value: 1 },
  { min: 16, max: 30, label: "15-30分", value: 2 },
  { min: 31, max: 45, label: "30-45分", value: 3 },
  { min: 46, max: 60, label: "45-60分", value: 4 },
  { min: 61, max: 90, label: "60-90分", value: 5 },
  { min: 91, max: 120, label: "90-120分", value: 6 },
  { min: 121, max: 150, label: "120-150分", value: 7 },
  { min: 151, max: 180, label: "150-180分", value: 8 },
  { min: 181, max: null, label: "180分以上", value: 9 },
] as const;

export const COMPLEXITY_LEVELS = [
  { value: 1, label: "とても簡単", description: "すぐに理解できる" },
  { value: 2, label: "簡単", description: "少し説明すれば理解できる" },
  { value: 3, label: "普通", description: "ルール説明に時間がかかる" },
  { value: 4, label: "難しい", description: "戦略性が高く複雑" },
  { value: 5, label: "とても難しい", description: "上級者向け" },
] as const;

export const LUCK_LEVELS = [
  { value: 1, label: "戦略100%", description: "運に左右されない" },
  { value: 2, label: "戦略重視", description: "少し運が関わる" },
  { value: 3, label: "バランス", description: "戦略と運が半々" },
  { value: 4, label: "運重視", description: "運が大きく関わる" },
  { value: 5, label: "運100%", description: "ほぼ運で決まる" },
] as const;

export const INTERACTION_LEVELS = [
  { value: 1, label: "ソロプレイ", description: "他プレイヤーとの関わりなし" },
  { value: 2, label: "少ない", description: "たまに関わる程度" },
  { value: 3, label: "普通", description: "適度に関わり合う" },
  { value: 4, label: "多い", description: "常に他プレイヤーを意識" },
  { value: 5, label: "激しい", description: "直接的な攻撃や妨害" },
] as const;

export const DOWNTIME_LEVELS = [
  { value: 1, label: "ほぼなし", description: "待ち時間がほとんどない" },
  { value: 2, label: "短い", description: "少し待つ程度" },
  { value: 3, label: "普通", description: "適度な待ち時間" },
  { value: 4, label: "長い", description: "結構待つ" },
  { value: 5, label: "とても長い", description: "かなり待たされる" },
] as const;

// Type definitions
export type Mechanic = typeof MECHANICS[number];
export type Category = typeof CATEGORIES[number];
export type Publisher = typeof PUBLISHERS[number];
export type PlayerCount = typeof PLAYER_COUNT_OPTIONS[number];

// Utility functions
export function getPlayTimeLabel(minutes: number): string {
  const range = PLAY_TIME_RANGES.find(r => 
    minutes >= r.min && (r.max === null || minutes <= r.max)
  );
  return range?.label || `${minutes}分`;
}

export function getComplexityLabel(value: number): string {
  const level = COMPLEXITY_LEVELS.find(l => l.value === value);
  return level?.label || "不明";
}

export function getComplexityDescription(value: number): string {
  const level = COMPLEXITY_LEVELS.find(l => l.value === value);
  return level?.description || "";
}

export function getLuckLabel(value: number): string {
  const level = LUCK_LEVELS.find(l => l.value === value);
  return level?.label || "不明";
}

export function getLuckDescription(value: number): string {
  const level = LUCK_LEVELS.find(l => l.value === value);
  return level?.description || "";
}

export function getInteractionLabel(value: number): string {
  const level = INTERACTION_LEVELS.find(l => l.value === value);
  return level?.label || "不明";
}

export function getInteractionDescription(value: number): string {
  const level = INTERACTION_LEVELS.find(l => l.value === value);
  return level?.description || "";
}

export function getDowntimeLabel(value: number): string {
  const level = DOWNTIME_LEVELS.find(l => l.value === value);
  return level?.label || "不明";
}

export function getDowntimeDescription(value: number): string {
  const level = DOWNTIME_LEVELS.find(l => l.value === value);
  return level?.description || "";
}

// Color schemes for ratings
export function getRatingColor(value: number, max: number = 10): string {
  const percentage = value / max;
  if (percentage >= 0.8) return "text-green-600 bg-green-50";
  if (percentage >= 0.6) return "text-blue-600 bg-blue-50";
  if (percentage >= 0.4) return "text-yellow-600 bg-yellow-50";
  if (percentage >= 0.2) return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
}

export function getComplexityColor(value: number): string {
  switch(value) {
    case 1: return "text-green-600 bg-green-50";
    case 2: return "text-blue-600 bg-blue-50"; 
    case 3: return "text-yellow-600 bg-yellow-50";
    case 4: return "text-orange-600 bg-orange-50";
    case 5: return "text-red-600 bg-red-50";
    default: return "text-gray-600 bg-gray-50";
  }
}