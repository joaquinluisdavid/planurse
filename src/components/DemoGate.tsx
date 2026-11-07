import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useDemoSession } from '@/demo/useDemoSession'

// This is a demo entry boundary, not authentication or an authorization mechanism.
export function DemoGate() {
  const { role } = useDemoSession()
  const location = useLocation()
  return role ? (
    <Outlet />
  ) : (
    <Navigate
      to="/login"
      state={{ from: location.pathname + location.search }}
      replace
    />
  )
}
