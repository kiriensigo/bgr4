'use client'

import { createSupabaseClient } from '@/lib/supabase-client'

export interface UploadConfig {
  maxSize: number // MB
  allowedTypes: string[]
  maxFiles: number
  bucket: string
  folder: string
}

export const uploadConfigs = {
  profile: {
    maxSize: 2,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 1,
    bucket: 'avatars',
    folder: 'profiles'
  },
  gameImage: {
    maxSize: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 1,
    bucket: 'images',
    folder: 'games'
  },
  reviewImages: {
    maxSize: 3,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 5,
    bucket: 'images',
    folder: 'reviews'
  }
} as const

export type UploadType = keyof typeof uploadConfigs

export interface UploadResponse {
  success: boolean
  url?: string
  error?: string
}

export async function uploadFile(
  file: File,
  type: UploadType,
  userId?: string
): Promise<UploadResponse> {
  try {
    const config = uploadConfigs[type]
    const supabase = createSupabaseClient()
    
    // ファイルサイズチェック
    if (file.size > config.maxSize * 1024 * 1024) {
      return {
        success: false,
        error: `ファイルサイズが${config.maxSize}MBを超えています`
      }
    }
    
    // ファイル形式チェック
    if (!config.allowedTypes.includes(file.type as any)) {
      return {
        success: false,
        error: 'サポートされていないファイル形式です'
      }
    }
    
    // ファイル名を生成
    const fileName = generateFileName(file.name, userId)
    const filePath = `${config.folder}/${fileName}`
    
    // Supabase Storageにアップロード
    const { data, error } = await supabase.storage
      .from(config.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return {
        success: false,
        error: `アップロードに失敗しました: ${error.message}`
      }
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from(config.bucket)
      .getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl
    }
    
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: 'アップロード中にエラーが発生しました'
    }
  }
}

export async function deleteFile(url: string, bucket?: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()
    
    // URLからパスを抽出
    const urlParts = url.split('/')
    const path = urlParts.slice(-2).join('/') // folder/filename
    const bucketName = bucket || 'images'
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path])
    
    if (error) {
      console.error('Delete file error:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Delete file error:', error)
    return false
  }
}

export function getFilePreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

export function generateFileName(originalName: string, userId?: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop() || 'jpg'
  const baseName = (originalName.split('.')[0] || 'file').replace(/[^a-zA-Z0-9]/g, '_')
  
  const prefix = userId ? `${userId}_` : ''
  return `${prefix}${baseName}_${timestamp}_${randomStr}.${extension}`
}

export function validateImageDimensions(
  file: File,
  minWidth?: number,
  minHeight?: number,
  maxWidth?: number,
  maxHeight?: number
): Promise<{ valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({ valid: false, error: '画像ファイルではありません' })
      return
    }
    
    const img = new Image()
    img.onload = () => {
      let error: string | undefined
      
      if (minWidth && img.width < minWidth) {
        error = `画像の幅は${minWidth}px以上である必要があります`
      } else if (minHeight && img.height < minHeight) {
        error = `画像の高さは${minHeight}px以上である必要があります`
      } else if (maxWidth && img.width > maxWidth) {
        error = `画像の幅は${maxWidth}px以下である必要があります`
      } else if (maxHeight && img.height > maxHeight) {
        error = `画像の高さは${maxHeight}px以下である必要があります`
      }
      
      resolve({ valid: !error, error })
    }
    
    img.onerror = () => {
      resolve({ valid: false, error: '画像ファイルが破損しています' })
    }
    
    img.src = URL.createObjectURL(file)
  })
}