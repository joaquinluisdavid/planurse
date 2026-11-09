import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/errors'
import { AuthContext, type AuthValue, type AuthProfile, type UserRole } from './useAuth'

function profileErrorMessage(cause: unknown) {
  if (
    cause &&
    typeof cause === 'object' &&
    'code' in cause &&
    cause.code === 'PGRST205'
  ) {
    return 'The Planurse database tables are missing from this Supabase project. Apply supabase/migrations/20261109000000_initial_private_workspace.sql in the Supabase SQL Editor, then reload the app.'
  }
  return `Cannot load your account profile: ${errorMessage(cause)}`
}

async function getProfile(userId: string): Promise<AuthProfile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, role')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  if (data.role !== 'student' && data.role !== 'new-rn')
    throw new Error('Your profile has an unsupported role. Contact support.')
  return { userId: data.user_id, role: data.role }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState<string | null>(null)
  const sessionRevision = useRef(0)

  const syncSession = useCallback(async (session: Session | null) => {
    const revision = ++sessionRevision.current
    setError(null)
    setUser(session?.user ?? null)
    setProfile(null)
    if (!session?.user) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const next = await getProfile(session.user.id)
      if (revision !== sessionRevision.current) return
      setProfile(next)
    } catch (cause) {
      if (revision !== sessionRevision.current) return
      setError(profileErrorMessage(cause))
    } finally {
      if (revision === sessionRevision.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    if (!supabase) return
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (mounted) void syncSession(session)
      }, 0)
    })
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return
      if (sessionError) {
        setError(`Cannot restore your sign-in: ${sessionError.message}`)
        setLoading(false)
        return
      }
      void syncSession(data.session)
    })
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [syncSession])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      setProfile(await getProfile(user.id))
      setError(null)
    } catch (cause) {
      setError(profileErrorMessage(cause))
      throw cause
    } finally {
      setLoading(false)
    }
  }, [user])

  const saveProfile = useCallback(
    async (role: UserRole) => {
      if (!supabase || !user) throw new Error('Sign in before saving your profile.')
      const { error: saveError } = await supabase.from('profiles').upsert(
        { user_id: user.id, role, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
      if (saveError) throw saveError
      setProfile({ userId: user.id, role })
    },
    [user],
  )

  const signOut = useCallback(async () => {
    if (!supabase) return
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw signOutError
    setUser(null)
    setProfile(null)
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      user,
      profile,
      loading,
      error,
      configured: Boolean(supabase),
      refreshProfile,
      saveProfile,
      signOut,
    }),
    [user, profile, loading, error, refreshProfile, saveProfile, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
