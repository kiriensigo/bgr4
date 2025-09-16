'use client'

import { useState, useEffect } from 'react'
import { getCurrentProfile, updateProfile } from '@/lib/auth'
import { useAuth } from './useAuth'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useUser() {
  const { user, isAuthenticated } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && user) {
      setLoading(true)
      getCurrentProfile()
        .then(setProfile)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    } else {
      setProfile(null)
    }
  }, [isAuthenticated, user])

  const updateUserProfile = async (updates: Partial<Profile>) => {
    try {
      setLoading(true)
      setError(null)
      const updatedProfile = await updateProfile(updates)
      setProfile(updatedProfile)
      return updatedProfile
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile: updateUserProfile,
    isAdmin: profile?.is_admin || false,
  }
}