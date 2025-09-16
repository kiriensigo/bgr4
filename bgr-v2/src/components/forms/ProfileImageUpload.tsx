'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/ui/FileUpload'
import { uploadFile, deleteFile, uploadConfigs, type UploadType } from '@/lib/upload'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { X, Upload, Loader2 } from 'lucide-react'
// import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileImageUploadProps {
  value?: string
  onChange: (url: string | null) => void
  userId?: string
  userName?: string
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ProfileImageUpload({
  value,
  onChange,
  userId,
  userName,
  disabled = false,
  className,
  size = 'md'
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  
  const uploadType: UploadType = 'profile'
  const config = uploadConfigs[uploadType]

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  }

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return

    const file = files[0]
    setUploading(true)

    try {
      // ローカルプレビューを即座に表示
      if (!file) return
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      const result = await uploadFile(file, uploadType, userId)

      if (result.success && result.url) {
        // 古い画像を削除（新しい画像がアップロード成功した場合のみ）
        if (value && value !== previewUrl) {
          await deleteFile(value, config.bucket)
        }
        
        URL.revokeObjectURL(previewUrl) // プレビューURLをクリーンアップ
        setPreview(result.url)
        onChange(result.url)
      } else {
        // アップロード失敗
        URL.revokeObjectURL(previewUrl)
        setPreview(value || null)
        console.error('Upload failed:', result.error)
        alert(result.error || 'アップロードに失敗しました')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setPreview(value || null)
      alert('アップロード中にエラーが発生しました')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!value) return

    setUploading(true)
    try {
      const success = await deleteFile(value, config.bucket)
      if (success) {
        setPreview(null)
        onChange(null)
      } else {
        alert('ファイルの削除に失敗しました')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('削除中にエラーが発生しました')
    } finally {
      setUploading(false)
    }
  }

  const getUserInitials = (name?: string): string => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* アバター表示 */}
      <div className="relative group">
        <Avatar className={cn(sizeClasses[size], 'relative')}>
          <AvatarImage 
            src={preview || undefined} 
            alt={userName || 'ユーザー'} 
          />
          <AvatarFallback>
            {getUserInitials(userName)}
          </AvatarFallback>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </Avatar>
        
        {preview && !disabled && !uploading && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* アップロードボタン */}
      {!disabled && (
        <div className="space-y-2">
          <FileUpload
            accept={config.allowedTypes.join(',')}
            multiple={false}
            maxSize={config.maxSize}
            maxFiles={1}
            onFileSelect={handleFileSelect}
            disabled={uploading}
            className="w-full"
          >
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              {uploading ? (
                <>
                  <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                  <p className="text-xs font-medium">アップロード中...</p>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-gray-400" />
                  <p className="text-xs font-medium">
                    {preview ? '画像を変更' : 'プロフィール画像をアップロード'}
                  </p>
                  <p className="text-xs text-gray-500">
                    JPEG, PNG, WebP • 最大{config.maxSize}MB
                  </p>
                </>
              )}
            </div>
          </FileUpload>
          
          {preview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              画像を削除
            </Button>
          )}
        </div>
      )}
    </div>
  )
}