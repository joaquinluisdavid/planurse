import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  demoRepository,
  WORKSPACE_KEY,
  type WorkspaceRepository,
} from './demoRepository'
import type { Workspace } from './models'
import { errorMessage } from '@/lib/errors'
import { WorkspaceContext } from './useWorkspace'

export function WorkspaceProvider({
  children,
  repository = demoRepository,
}: {
  children: ReactNode
  repository?: WorkspaceRepository
}) {
  const [data, setData] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision((value) => value + 1), [])
  useEffect(() => {
    let cancelled = false
    repository
      .load()
      .then((next) => {
        if (!cancelled) {
          setData(next)
          setLoading(false)
          setError(null)
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(`Cannot load demo workspace: ${errorMessage(cause)}`)
          setLoading(false)
        }
      })
    const onStorage = (event: StorageEvent) => {
      if (event.key === WORKSPACE_KEY || event.key === null) reload()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      cancelled = true
      window.removeEventListener('storage', onStorage)
    }
  }, [repository, revision, reload])
  async function update(change: (workspace: Workspace) => Workspace) {
    // Commit storage first; a failed write never appears as a successful UI change.
    const next = await repository.update(change)
    setData(next)
    setError(null)
  }
  async function reset() {
    const next = await repository.reset()
    setData(next)
    setError(null)
    setLoading(false)
  }
  return (
    <WorkspaceContext.Provider
      value={{ data, loading, error, reload, update, reset }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
