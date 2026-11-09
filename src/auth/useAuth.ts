import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'student' | 'new-rn'
export type AuthProfile = { userId: string; role: UserRole }
export type AuthValue = {
  user: User | null
  profile: AuthProfile | null
  loading: boolean
  error: string | null
  configured: boolean
  refreshProfile: () => Promise<void>
  saveProfile: (role: UserRole) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth requires AuthProvider.')
  return context
}
