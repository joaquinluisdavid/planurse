import { useState, type ReactNode } from 'react'
import { demoSession, type DemoRole } from './session'
import { errorMessage } from '@/lib/errors'
import { DemoSessionContext } from './useDemoSession'

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try {
      return { role: demoSession.read(), error: null }
    } catch (error) {
      return { role: null, error: errorMessage(error) }
    }
  })
  const [role, setRole] = useState(initial.role)
  const [error, setError] = useState<string | null>(initial.error)
  function enter(nextRole: DemoRole) {
    try {
      demoSession.enter(nextRole)
      setRole(nextRole)
      setError(null)
    } catch (cause) {
      setError(`Cannot open demo session: ${errorMessage(cause)}`)
    }
  }
  function leave() {
    try {
      demoSession.leave()
      setRole(null)
      setError(null)
    } catch (cause) {
      setError(`Cannot close demo session: ${errorMessage(cause)}`)
    }
  }
  return (
    <DemoSessionContext.Provider value={{ role, error, enter, leave }}>
      {children}
    </DemoSessionContext.Provider>
  )
}
