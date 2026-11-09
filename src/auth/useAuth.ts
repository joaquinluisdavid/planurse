import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'student-nurse' | 'registered-nurse'
export type ProfileFields = {
  role: UserRole
  firstName: string
  lastName: string
  nickname: string
  position: string
}
export type AuthProfile = ProfileFields & {
  userId: string
  avatarPath: string | null
  avatarUrl: string | null
}
export type AuthValue = {
  user: User | null
  profile: AuthProfile | null
  loading: boolean
  error: string | null
  configured: boolean
  refreshProfile: () => Promise<void>
  saveProfile: (fields: ProfileFields) => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
  removeAvatar: () => Promise<void>
  signOut: () => Promise<void>
}

export function isProfileComplete(profile: AuthProfile | null): boolean {
  return Boolean(profile?.firstName.trim() && profile.lastName.trim())
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth requires AuthProvider.')
  return context
}
