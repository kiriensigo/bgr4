'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Cookies from 'js-cookie'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      // トークンを保存
      Cookies.set('token', token)
      // ホームページにリダイレクト
      router.push('/')
    } else {
      // エラーがある場合はログインページに戻る
      router.push('/login?error=認証に失敗しました')
    }
  }, [router, searchParams])

  return <div>認証中...</div>
} 