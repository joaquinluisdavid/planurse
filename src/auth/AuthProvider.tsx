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
import {
  AuthContext,
  type AuthValue,
  type AuthProfile,
  type ProfileFields,
} from './useAuth'

function profileErrorMessage(cause: unknown) {
  if (
    cause &&
    typeof cause === 'object' &&
    'code' in cause &&
    cause.code === 'PGRST205'
  ) {
    return 'The Planurse database tables are missing from this Supabase project. Apply all workspace, calendar, cases-handled, and profile migrations in the Supabase SQL Editor, then reload the app.'
  }
  return `Cannot load your account profile: ${errorMessage(cause)}`
}

async function getProfile(userId: string): Promise<AuthProfile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'user_id, role, first_name, last_name, nickname, position, avatar_path',
    )
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  if (data.role !== 'student-nurse' && data.role !== 'registered-nurse')
    throw new Error('Your profile has an unsupported role. Contact support.')
  let avatarUrl: string | null = null
  if (data.avatar_path) {
    const { data: signed, error: signedError } = await supabase.storage
      .from('profile-avatars')
      .createSignedUrl(data.avatar_path, 60 * 60)
    if (!signedError) avatarUrl = signed.signedUrl
  }
  return {
    userId: data.user_id,
    role: data.role,
    firstName: data.first_name ?? '',
    lastName: data.last_name ?? '',
    nickname: data.nickname ?? '',
    position: data.position ?? '',
    avatarPath: data.avatar_path,
    avatarUrl,
  }
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
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        window.setTimeout(() => {
          if (mounted) void syncSession(session)
        }, 0)
      },
    )
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
    async (fields: ProfileFields) => {
      if (!supabase || !user)
        throw new Error('Sign in before saving your profile.')
      const { error: saveError } = await supabase.from('profiles').upsert(
        {
          user_id: user.id,
          role: fields.role,
          first_name: fields.firstName.trim(),
          last_name: fields.lastName.trim(),
          nickname: fields.nickname.trim(),
          position: fields.position.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      if (saveError) throw saveError
      setProfile(await getProfile(user.id))
    },
    [user],
  )

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!supabase || !user)
        throw new Error('Sign in before uploading a profile picture.')
      const extensionByType: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      }
      const extension = extensionByType[file.type]
      if (!extension) throw new Error('Choose a JPG, PNG, or WebP image.')
      if (file.size > 2 * 1024 * 1024)
        throw new Error('Profile pictures must be 2 MB or smaller.')
      const path = `${user.id}/avatar.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: '3600',
        })
      if (uploadError) throw uploadError
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_path: path, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
      if (updateError) throw updateError
      if (profile?.avatarPath && profile.avatarPath !== path) {
        const { error: removeError } = await supabase.storage
          .from('profile-avatars')
          .remove([profile.avatarPath])
        if (removeError)
          console.warn(
            'Could not remove previous profile picture.',
            removeError,
          )
      }
      setProfile(await getProfile(user.id))
    },
    [user, profile],
  )

  const removeAvatar = useCallback(async () => {
    if (!supabase || !user)
      throw new Error('Sign in before removing a profile picture.')
    const currentProfile = profile ?? (await getProfile(user.id))
    if (!currentProfile?.avatarPath) {
      setProfile(currentProfile)
      return
    }
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_path: null, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
    if (updateError) throw updateError
    const { error: removeError } = await supabase.storage
      .from('profile-avatars')
      .remove([currentProfile.avatarPath])
    if (removeError)
      console.warn('Could not remove previous profile picture.', removeError)
    setProfile(await getProfile(user.id))
  }, [user, profile])

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
      uploadAvatar,
      removeAvatar,
      signOut,
    }),
    [
      user,
      profile,
      loading,
      error,
      refreshProfile,
      saveProfile,
      uploadAvatar,
      removeAvatar,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
