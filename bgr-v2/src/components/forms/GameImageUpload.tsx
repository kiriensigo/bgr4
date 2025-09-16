'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/ui/FileUpload'
import { uploadFile, deleteFile, uploadConfigs, type UploadType } from '@/lib/upload'
import { Button } from '@/components/ui/button'
import { X, Upload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface GameImageUploadProps {
  value?: string
  onChange: (url: string | null) => void
  disabled?: boolean
  className?: string
}

export function GameImageUpload({
  value,
  onChange,
  disabled = false,
  className
}: GameImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  
  const uploadType: UploadType = 'gameImage'
  const config = uploadConfigs[uploadType]

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return

    const file = files[0]
    setUploading(true)

    try {
      // ローカルプレビューを即座に表示
      const previewUrl = file ? URL.createObjectURL(file) : null
      if (!previewUrl) return
      setPreview(previewUrl)

      if (!file) return
      const result = await uploadFile(file, uploadType)

      if (result.success && result.url) {
        // アップロード成功
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

  return (
    <div className={cn('space-y-4', className)}>
      {/* 現在の画像表示 */}
      {preview && (
        <div className="relative group">
          <div className="relative aspect-square w-full max-w-xs rounded-lg overflow-hidden border">
            <Image
              src={preview}
              alt="ゲーム画像"
              fill
              className="object-cover"
              sizes="(max-width: 384px) 100vw, 384px"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
          
          {!disabled && !uploading && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* アップロードエリア */}
      {!preview && (
        <FileUpload
          accept={config.allowedTypes.join(',')}
          multiple={false}
          maxSize={config.maxSize}
          maxFiles={1}
          onFileSelect={handleFileSelect}
          disabled={disabled || uploading}
          className="max-w-xs"
        >
          <div className="flex flex-col items-center justify-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                <p className="text-sm font-medium">アップロード中...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="text-sm font-medium">ゲーム画像をアップロード</p>
                <p className="text-xs text-gray-500">
                  JPEG, PNG, WebP • 最大{config.maxSize}MB
                </p>
              </>
            )}
          </div>
        </FileUpload>
      )}

      {/* 再アップロードボタン */}
      {preview && !uploading && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreview(null)}
          className="max-w-xs"
        >
          <Upload className="h-4 w-4 mr-2" />
          画像を変更
        </Button>
      )}
    </div>
  )
}