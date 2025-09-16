'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useUser } from '@/hooks/useUser'
import { User, Upload, Check, AlertCircle, Loader2 } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'ユーザー名は3文字以上で入力してください')
    .max(20, 'ユーザー名は20文字以下で入力してください')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ユーザー名は英数字、ハイフン、アンダースコアのみ使用できます'),
  full_name: z
    .string()
    .max(50, '表示名は50文字以下で入力してください')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url('有効なURLを入力してください')
    .optional()
    .or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  user: SupabaseUser
  profile: Profile | null
}

export function ProfileForm({ user: _user, profile }: ProfileFormProps) {
  const { updateProfile, loading } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username || '',
      full_name: profile?.full_name || '',
      website: profile?.website || '',
    }
  })

  useEffect(() => {
    if (profile) {
      reset({
        username: profile.username || '',
        full_name: profile.full_name || '',
        website: profile.website || '',
      })
    }
  }, [profile, reset])

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true)
      setSubmitStatus('idle')
      setSubmitMessage('')

      await updateProfile({
        username: data.username,
        full_name: data.full_name || null,
        website: data.website || null,
        updated_at: new Date().toISOString(),
      })

      setSubmitStatus('success')
      setSubmitMessage('プロフィールが正常に更新されました')
      
      // 3秒後にメッセージをクリア
      setTimeout(() => {
        setSubmitStatus('idle')
        setSubmitMessage('')
      }, 3000)

    } catch (error) {
      console.error('Profile update error:', error)
      setSubmitStatus('error')
      setSubmitMessage(
        error instanceof Error 
          ? error.message 
          : 'プロフィールの更新に失敗しました'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">プロフィール編集</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Section */}
          <div className="space-y-4">
            <Label>プロフィール画像</Label>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage 
                  src={profile?.avatar_url || undefined}
                  alt={profile?.full_name || profile?.username || 'プロフィール画像'}
                />
                <AvatarFallback className="text-lg">
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button type="button" variant="outline" size="sm" disabled>
                  <Upload className="w-4 h-4 mr-2" />
                  画像を変更 (準備中)
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG形式、最大2MB
                </p>
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">
              ユーザー名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              {...register('username')}
              placeholder="username"
              className={errors.username ? 'border-destructive' : ''}
            />
            {errors.username && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.username.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              他のユーザーがあなたを識別するために使用されます
            </p>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">表示名</Label>
            <Input
              id="full_name"
              {...register('full_name')}
              placeholder="山田太郎"
              className={errors.full_name ? 'border-destructive' : ''}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.full_name.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              レビューやコメントで表示される名前です
            </p>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">ウェブサイト</Label>
            <Input
              id="website"
              {...register('website')}
              placeholder="https://example.com"
              className={errors.website ? 'border-destructive' : ''}
            />
            {errors.website && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.website.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              あなたの個人サイトやブログのURLを入力してください
            </p>
          </div>

          {/* Submit Status Message */}
          {submitMessage && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
              submitStatus === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {submitStatus === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {submitMessage}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={!isDirty || isSubmitting}
            >
              リセット
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || isSubmitting || loading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                '更新する'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}