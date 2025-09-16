import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { uploadConfigs, generateFileName, type UploadType } from '@/lib/upload'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

// アップロードディレクトリを作成
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir()
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as UploadType
    const userId = formData.get('userId') as string | null
    
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      )
    }
    
    if (!type || !uploadConfigs[type]) {
      return NextResponse.json(
        { error: '無効なアップロードタイプです' },
        { status: 400 }
      )
    }
    
    const config = uploadConfigs[type]
    
    // ファイルサイズチェック
    if (file.size > config.maxSize * 1024 * 1024) {
      return NextResponse.json(
        { error: `ファイルサイズが${config.maxSize}MBを超えています` },
        { status: 400 }
      )
    }
    
    // ファイル形式チェック
    if (!config.allowedTypes.includes(file.type as any)) {
      return NextResponse.json(
        { error: 'サポートされていないファイル形式です' },
        { status: 400 }
      )
    }
    
    // ファイル名生成
    const fileName = generateFileName(file.name, userId || undefined)
    const filePath = join(UPLOAD_DIR, type, fileName)
    
    // タイプ別ディレクトリ作成
    const typeDir = join(UPLOAD_DIR, type)
    if (!existsSync(typeDir)) {
      await mkdir(typeDir, { recursive: true })
    }
    
    // ファイル保存
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    
    // 公開URL生成
    const publicUrl = `/uploads/${type}/${fileName}`
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      size: file.size,
      type: file.type
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'アップロード中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URLが指定されていません' },
        { status: 400 }
      )
    }
    
    // URLからファイルパスを取得
    const urlPath = url.replace('/uploads/', '')
    const filePath = join(UPLOAD_DIR, urlPath)
    
    // ファイルが存在するかチェック
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 404 }
      )
    }
    
    // ファイル削除
    await unlink(filePath)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Delete file error:', error)
    return NextResponse.json(
      { error: 'ファイル削除中にエラーが発生しました' },
      { status: 500 }
    )
  }
}