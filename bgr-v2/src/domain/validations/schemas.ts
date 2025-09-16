import { z } from 'zod'

// レビュースキーマ
export const reviewSchema = z.object({
  title: z
    .string()
    .min(5, 'タイトルは5文字以上で入力してください')
    .max(100, 'タイトルは100文字以下で入力してください'),
  content: z
    .string()
    .min(10, '内容は10文字以上で入力してください')
    .max(5000, '内容は5000文字以下で入力してください'),
  rating: z
    .number()
    .int('評価は整数で入力してください')
    .min(1, '評価は1以上で入力してください')
    .max(10, '評価は10以下で入力してください'),
  pros: z
    .array(z.string().min(1, '良い点は1文字以上で入力してください').max(200, '良い点は200文字以下で入力してください'))
    .max(10, '良い点は10個まで登録できます')
    .default([]),
  cons: z
    .array(z.string().min(1, '悪い点は1文字以上で入力してください').max(200, '悪い点は200文字以下で入力してください'))
    .max(10, '悪い点は10個まで登録できます')
    .default([]),
  gameId: z.number().int('ゲームIDは整数で指定してください').positive('ゲームIDは正の数で指定してください'),
})

export type ReviewFormData = z.infer<typeof reviewSchema>

// レビュー更新スキーマ（gameIdは不要）
export const reviewUpdateSchema = reviewSchema.omit({ gameId: true })
export type ReviewUpdateFormData = z.infer<typeof reviewUpdateSchema>

// コメントスキーマ
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'コメントは1文字以上で入力してください')
    .max(1000, 'コメントは1000文字以下で入力してください'),
  reviewId: z.number().int('レビューIDは整数で指定してください').positive('レビューIDは正の数で指定してください'),
})

export type CommentFormData = z.infer<typeof commentSchema>

// コメント更新スキーマ（reviewIdは不要）
export const commentUpdateSchema = commentSchema.omit({ reviewId: true })
export type CommentUpdateFormData = z.infer<typeof commentUpdateSchema>

// ゲーム作成/更新スキーマ
export const gameSchema = z.object({
  name: z
    .string()
    .min(1, 'ゲーム名は必須です')
    .max(200, 'ゲーム名は200文字以下で入力してください'),
  description: z
    .string()
    .max(5000, '説明は5000文字以下で入力してください')
    .nullable()
    .optional(),
  bggId: z.number().int().positive().nullable().optional(),
  yearPublished: z.number().int().min(1800).max(new Date().getFullYear() + 5).nullable().optional(),
  minPlayers: z.number().int().min(1).max(100).nullable().optional(),
  maxPlayers: z.number().int().min(1).max(100).nullable().optional(),
  playingTime: z.number().int().min(1).max(1440).nullable().optional(), // 最大24時間
  minAge: z.number().int().min(0).max(100).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  mechanics: z.array(z.string().max(100)).max(50).default([]),
  categories: z.array(z.string().max(100)).max(50).default([]),
  designers: z.array(z.string().max(100)).max(50).default([]),
  publishers: z.array(z.string().max(100)).max(50).default([]),
  ratingAverage: z.number().min(0).max(10).nullable().optional(),
  ratingCount: z.number().int().min(0).default(0),
})

export type GameFormData = z.infer<typeof gameSchema>

// プロフィール更新スキーマ
export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'ユーザー名は3文字以上で入力してください')
    .max(30, 'ユーザー名は30文字以下で入力してください')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ユーザー名は英数字、アンダースコア、ハイフンのみ使用できます')
    .nullable()
    .optional(),
  fullName: z
    .string()
    .max(100, '表示名は100文字以下で入力してください')
    .nullable()
    .optional(),
  website: z
    .string()
    .url('正しいURL形式で入力してください')
    .nullable()
    .optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>

// 検索パラメータスキーマ
export const searchParamsSchema = z.object({
  q: z.string().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'year_published', 'rating_average', 'rating_count', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  category: z.string().max(100).optional(),
  minPlayers: z.coerce.number().int().min(1).optional(),
  maxPlayers: z.coerce.number().int().min(1).optional(),
  minPlayingTime: z.coerce.number().int().min(1).optional(),
  maxPlayingTime: z.coerce.number().int().min(1).optional(),
  yearFrom: z.coerce.number().int().min(1800).optional(),
  yearTo: z.coerce.number().int().max(new Date().getFullYear() + 5).optional(),
})

export type SearchParamsData = z.infer<typeof searchParamsSchema>

// 文字列サニタイズ関数
export function sanitizeString(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // scriptタグ除去
    .replace(/javascript:/gi, '') // javascript:プロトコル除去
    .replace(/on\w+\s*=/gi, '') // onイベント除去
    .trim()
}

// HTMLサニタイズ関数（基本的な処理）
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

// ユーザープロフィールスキーマ（テスト用）
export const userProfileSchema = z.object({
  username: z.string().min(3).max(30),
  fullName: z.string().max(100).optional(),
  email: z.string().email(),
})

// ヘルパー関数
export function validateGameData(data: any): boolean {
  try {
    gameSchema.parse(data)
    return true
  } catch {
    return false
  }
}

export function validateReviewData(data: any): boolean {
  try {
    reviewSchema.parse(data)
    return true
  } catch {
    return false
  }
}