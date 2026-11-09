import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
const validUrl = (() => {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' ||
      ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
    )
  } catch {
    return false
  }
})()

export const supabase =
  validUrl && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : null

export const supabaseConfigured = Boolean(supabase)
