import { createContext, useContext } from 'react'
import type { DemoRole } from './session'

type DemoSessionValue = {
  role: DemoRole | null
  error: string | null
  enter: (role: DemoRole) => void
  leave: () => void
}
export const DemoSessionContext = createContext<DemoSessionValue | null>(null)

export function useDemoSession() {
  const context = useContext(DemoSessionContext)
  if (!context) throw new Error('useDemoSession requires DemoSessionProvider.')
  return context
}
