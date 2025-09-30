import { SupabaseClient } from '@supabase/supabase-js'
import { Game, GamePlainObject } from '@/domain/entities/Game'
import { Database } from '@/types/database'
import { GameRepository, GameFilters, PaginatedResult } from '@/domain/repositories/GameRepository'

export class SupabaseGameRepository implements GameRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findById(id: number): Promise<Game | null> {
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch game: ${error.message}`)
    }

    return this.mapToGameEntity(data)
  }

  async findByBggId(bggId: string): Promise<Game | null> {
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .eq('bgg_id', parseInt(bggId))
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch game by BGG ID: ${error.message}`)
    }

    return this.mapToGameEntity(data)
  }

  async findByName(name: string): Promise<Game[]> {
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .eq('name', name)

    if (error) {
      throw new Error(`Failed to fetch games by name: ${error.message}`)
    }

    return data.map(item => this.mapToGameEntity(item))
  }

  async searchByName(name: string): Promise<Game[]> {
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .or(`name.ilike.%${name}%,japanese_name.ilike.%${name}%`)
      .limit(50)

    if (error) {
      throw new Error(`Failed to search games by name: ${error.message}`)
    }

    return data.map(item => this.mapToGameEntity(item))
  }

  async findAll(): Promise<Game[]> {
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch all games: ${error.message}`)
    }

    return data.map(item => this.mapToGameEntity(item))
  }

  async findMany(filters: GameFilters): Promise<PaginatedResult<Game>> {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit

    let query = this.supabase
      .from('games')
      .select(`
        *,
        review_stats:reviews(
          overall_score,
          id
        )
      `, { count: 'exact' })

    // Search filter
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,japanese_name.ilike.%${filters.search}%`)
    }

    // Category filter
    if (filters.category) {
      query = query.contains('site_categories', [filters.category])
    }

    // Mechanic filter
    if (filters.mechanic) {
      query = query.contains('site_mechanics', [filters.mechanic])
    }

    // Player count filters
    if (filters.minPlayers) {
      query = query.gte('min_players', filters.minPlayers)
    }
    if (filters.maxPlayers) {
      query = query.lte('max_players', filters.maxPlayers)
    }

    // Year filter
    if (filters.yearPublished) {
      query = query.eq('year_published', filters.yearPublished)
    }

    // Sorting
    const validSortFields = ['name', 'year_published', 'rating_average', 'created_at']
    const sortBy = filters.sortBy || 'rating_average'
    const sortOrder = filters.sortOrder || 'desc'
    
    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    // Pagination
    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch games: ${error.message}`)
    }

    return {
      data: (data || []).map(item => this.mapToGameEntity(item)),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  async save(game: Game): Promise<Game> {
    const gameData = this.mapFromGameEntity(game)
    const { data, error } = await this.supabase
      .from('games')
      .insert(gameData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save game: ${error.message}`)
    }

    return this.mapToGameEntity(data)
  }

  async update(game: Game): Promise<Game> {
    if (!game.id) {
      throw new Error('Game ID is required for update')
    }

    const gameData = this.mapFromGameEntity(game)
    const { data, error } = await this.supabase
      .from('games')
      .update({
        ...gameData,
        updated_at: new Date().toISOString()
      })
      .eq('id', game.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update game: ${error.message}`)
    }

    return this.mapToGameEntity(data)
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('games')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete game: ${error.message}`)
    }
  }

  async exists(bggId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('games')
      .select('id')
      .eq('bgg_id', parseInt(bggId))
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check game existence: ${error.message}`)
    }

    return !!data
  }

  async updateRatingStatistics(gameId: number): Promise<void> {
    const { error } = await this.supabase
      .rpc('update_game_statistics', { game_id_param: gameId })

    if (error) {
      throw new Error(`Failed to update game statistics: ${error.message}`)
    }
  }

  private mapToGameEntity(row: Database['public']['Tables']['games']['Row'] | any): Game {
    // レビュー統計の計算
    const reviewStats = row.review_stats || []
    const reviewCount = reviewStats.length
    const averageOverallScore = reviewCount > 0 
      ? reviewStats.reduce((sum: number, review: any) => sum + (review.overall_score || 0), 0) / reviewCount
      : null
    const normalizePlayerCounts = (values: any): number[] => {
      if (!Array.isArray(values)) return []
      const parsed: number[] = []
      for (const value of values) {
        const parsedValue = typeof value === 'number' ? value : parseInt(String(value), 10)
        if (!Number.isNaN(parsedValue)) {
          parsed.push(parsedValue)
        }
      }
      return Array.from(new Set(parsed))
    }
    const bggBestPlayers = normalizePlayerCounts((row as any).bgg_best_players)
    const bggRecommendedPlayers = normalizePlayerCounts((row as any).bgg_recommended_players)

    const plainObject: GamePlainObject = {
      id: row.id,
      bgg_id: row.bgg_id || '',
      name: row.name,
      japanese_name: row.japanese_name || undefined,
      description: row.description || undefined,
      year_published: row.year_published || undefined,
      min_players: row.min_players || 1,
      max_players: row.max_players || 1,
      playing_time: row.playing_time || undefined,
      // Prefer new schema columns; fallback to legacy if missing
      min_playing_time: (row as any).min_playing_time ?? undefined,
      max_playing_time: (row as any).max_playing_time ?? undefined,
      min_age: row.min_age || undefined,
      image_url: row.image_url || undefined,
      thumbnail_url: row.thumbnail_url || undefined,
      // We store mapped site values in legacy columns; keep BGG-original empty
      bgg_categories: [],
      bgg_mechanics: [],
      bgg_publishers: [],
      bgg_best_players: bggBestPlayers,
      bgg_recommended_players: bggRecommendedPlayers,
      site_categories: row.categories ?? [],
      site_mechanics: row.mechanics ?? [],
      site_publishers: row.publishers ?? [],
      designers: row.designers || [],
      rating_average: row.rating_average || undefined,
      rating_count: row.rating_count || undefined,
      // レビュー統計を追加
      review_stats: {
        review_count: reviewCount,
        overall_avg: averageOverallScore
      },
      created_at: row.created_at || undefined,
      updated_at: row.updated_at || undefined
    }

    return Game.fromPlainObject(plainObject)
  }

  private mapFromGameEntity(game: Game): Database['public']['Tables']['games']['Insert'] {
    const plainObject = game.toPlainObject()
    
    // Determine numeric BGG ID if available; ignore non-numeric like 'jp-*'
    const numericBggId = typeof plainObject.bgg_id === 'number'
      ? plainObject.bgg_id
      : (typeof plainObject.bgg_id === 'string' && /^\d+$/.test(plainObject.bgg_id))
        ? parseInt(plainObject.bgg_id, 10)
        : null

    // Build base insert object matching generated types
    const baseInsert: Database['public']['Tables']['games']['Insert'] = {
      // Preserve provided ID so BGG games use BGG ID as primary key
      id: plainObject.id,
      bgg_id: numericBggId,
      name: plainObject.name,
      description: plainObject.description || null,
      year_published: plainObject.year_published || null,
      min_players: plainObject.min_players,
      max_players: plainObject.max_players,
      playing_time: plainObject.playing_time || null,
      min_age: plainObject.min_age || null,
      image_url: plainObject.image_url || null,
      thumbnail_url: plainObject.thumbnail_url || null,
      // Persist site-mapped arrays as-is; empty is valid
      mechanics: plainObject.site_mechanics || [],
      categories: plainObject.site_categories || [],
      publishers: plainObject.site_publishers || [],
      designers: plainObject.designers || [],
      rating_average: plainObject.rating_average ?? null,
      rating_count: plainObject.rating_count ?? 0,
      created_at: plainObject.created_at || new Date().toISOString(),
      updated_at: plainObject.updated_at || new Date().toISOString()
    }

    // Add optional columns present in current DB schema via type cast
    const withExtendedFields = {
      ...baseInsert,
      ...(plainObject.min_playing_time !== undefined ? { min_playing_time: plainObject.min_playing_time } : {}),
      ...(plainObject.max_playing_time !== undefined ? { max_playing_time: plainObject.max_playing_time } : {}),
      bgg_best_players: (plainObject.bgg_best_players ?? []).map((value) => value.toString()),
      bgg_recommended_players: (plainObject.bgg_recommended_players ?? []).map((value) => value.toString())
    } as any

    return withExtendedFields
  }
}
