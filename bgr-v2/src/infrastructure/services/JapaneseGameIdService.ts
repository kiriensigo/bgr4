import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

/**
 * 日本独自ゲームID生成サービス
 */
export class JapaneseGameIdService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * 次の日本独自ゲームIDを生成（10,000,001から開始）
   */
  async generateNextId(): Promise<number> {
    const { data, error } = await (this.supabase as any)
      .rpc('get_next_jp_game_id')

    if (error) {
      throw new Error(`Failed to generate Japanese game ID: ${error.message}`)
    }

    return data as number
  }

  /**
   * 現在の連番状況を確認
   */
  async getCurrentSequence(): Promise<number> {
    const { data, error } = await (this.supabase as any)
      .from('jp_game_sequence')
      .select('last_number')
      .single()

    if (error) {
      throw new Error(`Failed to get current sequence: ${error.message}`)
    }

    return data.last_number
  }

  /**
   * IDが日本独自ゲームの範囲内かチェック
   */
  isJapaneseGameId(id: number): boolean {
    return id >= 10000000 && id < 20000000
  }

  /**
   * IDがBGGゲームの範囲内かチェック
   */
  isBggGameId(id: number): boolean {
    return id > 0 && id < 10000000
  }
}