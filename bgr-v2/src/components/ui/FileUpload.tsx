'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, File, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  maxFiles?: number
  onFileSelect?: (files: File[]) => void
  onFileRemove?: (index: number) => void
  className?: string
  disabled?: boolean
  children?: React.ReactNode
}

export function FileUpload({
  accept = "image/*",
  multiple = false,
  maxSize = 5,
  maxFiles = 1,
  onFileSelect,
  onFileRemove,
  className,
  disabled = false,
  children
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      return `ファイルサイズが${maxSize}MBを超えています`
    }
    
    if (accept && !accept.includes('*')) {
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const fileType = file.type
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.slice(0, -1))
        }
        return fileType === type
      })
      
      if (!isValidType) {
        return 'サポートされていないファイル形式です'
      }
    }
    
    return null
  }

  const handleFileSelect = (files: FileList) => {
    const newFiles = Array.from(files)
    const validationErrors: string[] = []
    
    // ファイル数チェック
    if (!multiple && newFiles.length > 1) {
      validationErrors.push('複数ファイルの選択はできません')
    }
    
    if (selectedFiles.length + newFiles.length > maxFiles) {
      validationErrors.push(`最大${maxFiles}ファイルまで選択できます`)
    }
    
    // 各ファイルの検証
    const validFiles: File[] = []
    newFiles.forEach(file => {
      const error = validateFile(file)
      if (error) {
        validationErrors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })
    
    setErrors(validationErrors)
    
    if (validFiles.length > 0) {
      const updatedFiles = multiple 
        ? [...selectedFiles, ...validFiles].slice(0, maxFiles)
        : validFiles.slice(0, 1)
      
      setSelectedFiles(updatedFiles)
      onFileSelect?.(updatedFiles)
    }
  }

  const handleRemoveFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(updatedFiles)
    onFileRemove?.(index)
    onFileSelect?.(updatedFiles)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled) return
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files)
    }
  }

  const openFileDialog = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  return (
    <div className={cn("w-full", className)}>
      {/* ドラッグ&ドロップエリア */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragActive 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="h-8 w-8 text-gray-400" />
          {children || (
            <>
              <p className="text-sm font-medium">
                ファイルをドラッグ&ドロップまたはクリックして選択
              </p>
              <p className="text-xs text-gray-500">
                {accept === "image/*" ? "画像ファイル" : "ファイル"}
                （最大{maxSize}MB、{maxFiles}ファイルまで）
              </p>
            </>
          )}
        </div>
      </div>

      {/* エラー表示 */}
      {errors.length > 0 && (
        <div className="mt-2 space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* 選択されたファイル一覧 */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">選択されたファイル:</h4>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded border"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getFileIcon(file)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(index)}
                className="flex-shrink-0"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}