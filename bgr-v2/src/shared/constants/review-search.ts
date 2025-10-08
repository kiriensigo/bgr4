export interface ReviewToggleOption<T = string | number> {
  value: T
  label: string
}

export const REVIEW_MECHANIC_OPTIONS: ReviewToggleOption<string>[] = [
  { label: 'エリア支配', value: 'mech_area_control' },
  { label: 'オークション', value: 'mech_auction' },
  { label: '賭け', value: 'mech_betting' },
  { label: 'ドラフト', value: 'mech_drafting' },
  { label: '協力', value: 'mech_cooperative' },
  { label: 'デッキ/バッグビルド', value: 'mech_deck_building' },
  { label: 'ダイスロール', value: 'mech_dice_rolling' },
  { label: '正体隠匿', value: 'mech_hidden_roles' },
  { label: 'モジュラーボード', value: 'mech_modular_board' },
  { label: 'ルート構築', value: 'mech_route_building' },
  { label: 'バースト', value: 'mech_push_luck' },
  { label: 'セット収集', value: 'mech_set_collection' },
  { label: '同時手番', value: 'mech_simultaneous' },
  { label: 'タイル配置', value: 'mech_tile_placement' },
  { label: 'プレイヤー別能力', value: 'mech_variable_powers' },
  { label: 'ワカプレ', value: 'mech_worker_placement' }
]

export const REVIEW_CATEGORY_OPTIONS: ReviewToggleOption<string>[] = [
  { label: '動物', value: 'cat_animals' },
  { label: 'ブラフ', value: 'cat_bluffing' },
  { label: 'カードゲーム', value: 'cat_card_game' },
  { label: '子供向け', value: 'cat_childrens' },
  { label: '推理', value: 'cat_deduction' },
  { label: '記憶', value: 'cat_memory' },
  { label: '交渉', value: 'cat_negotiation' },
  { label: 'パーティー', value: 'cat_party' },
  { label: 'パズル', value: 'cat_puzzle' },
  { label: 'ウォーゲーム', value: 'cat_wargame' },
  { label: 'ワードゲーム', value: 'cat_word_game' },
  { label: '演技', value: 'cat_acting' },
  { label: 'レガシー・キャンペーン', value: 'cat_legacy_campaign' },
  { label: '紙ペン', value: 'cat_paper_pencil' },
  { label: 'ソロ向き', value: 'cat_solo' },
  { label: 'トリテ', value: 'cat_trick_taking' },
  { label: 'ペア向き', value: 'cat_pair' },
  { label: '多人数向き', value: 'cat_large_group' }
]

export const REVIEW_RECOMMENDED_PLAYER_COUNTS: ReviewToggleOption<number>[] = [
  { label: '2人', value: 2 },
  { label: '3人', value: 3 },
  { label: '4人', value: 4 },
  { label: '5人', value: 5 },
  { label: '6人以上', value: 7 }
]

export const REVIEW_GAME_PLAYER_COUNTS: ReviewToggleOption<number>[] = [
  { label: '1人', value: 1 },
  { label: '2人', value: 2 },
  { label: '3人', value: 3 },
  { label: '4人', value: 4 },
  { label: '5人', value: 5 },
  { label: '6人', value: 6 },
  { label: '7人以上', value: 7 }
]

export const REVIEW_DEFAULT_FILTERS = {
  query: '',
  overallScore: [1, 10] as [number, number],
  ruleComplexity: [1, 5] as [number, number],
  luckFactor: [1, 5] as [number, number],
  interaction: [1, 5] as [number, number],
  downtime: [1, 5] as [number, number],
  playTimeRange: [15, 180] as [number, number],
  selectedRecommendedCounts: [] as number[],
  selectedGameCounts: [] as number[],
  selectedMechanics: [] as string[],
  selectedCategories: [] as string[]
}
