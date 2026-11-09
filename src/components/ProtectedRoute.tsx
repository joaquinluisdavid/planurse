import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { isProfileComplete, useAuth } from '@/auth/useAuth'

export function ProtectedRoute({
  allowIncompleteProfile = false,
}: {
  allowIncompleteProfile?: boolean
}) {
  const { user, profile, loading, error, refreshProfile } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingState />
  if (error)
    return <ErrorState message={error} retry={() => void refreshProfile()} />
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    )
  if (!allowIncompleteProfile && !isProfileComplete(profile))
    return <Navigate to="/onboarding" replace />
  return <Outlet />
}
