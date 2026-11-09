import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { WorkspaceRepository } from './repository'
import { createSupabaseRepository } from './supabaseRepository'
import type { Workspace } from './models'
import { errorMessage } from '@/lib/errors'
import { WorkspaceContext } from './useWorkspace'
import { useAuth } from '@/auth/useAuth'

type LoadState = {
  repository: WorkspaceRepository
  revision: number
  data: Workspace | null
  error: string | null
}

const unavailableRepository: WorkspaceRepository = {
  async load() {
    throw new Error('Sign in before loading your workspace.')
  },
  async update() {
    throw new Error('Sign in before updating your workspace.')
  },
}

export function WorkspaceProvider({
  children,
  repository: injectedRepository,
}: {
  children: ReactNode
  repository?: WorkspaceRepository
}) {
  const { user, profile } = useAuth()
  const userId = user?.id
  const hasCompletedProfile = Boolean(profile)
  const repository = useMemo(
    () =>
      injectedRepository ??
      (userId && hasCompletedProfile
        ? createSupabaseRepository(userId)
        : unavailableRepository),
    [injectedRepository, userId, hasCompletedProfile],
  )
  const [revision, setRevision] = useState(0)
  const [loaded, setLoaded] = useState<LoadState | null>(null)
  const reload = useCallback(() => setRevision((value) => value + 1), [])
  const current = loaded?.repository === repository && loaded.revision === revision
  const data = current && loaded ? loaded.data : null
  const loading = !current
  const error = current && loaded ? loaded.error : null

  useEffect(() => {
    let cancelled = false
    repository
      .load()
      .then((next) => {
        if (!cancelled)
          setLoaded({ repository, revision, data: next, error: null })
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setLoaded({
            repository,
            revision,
            data: null,
            error: `Cannot load your workspace: ${errorMessage(cause)}`,
          })
      })
    return () => {
      cancelled = true
    }
  }, [repository, revision])

  async function update(change: (workspace: Workspace) => Workspace) {
    const next = await repository.update(change)
    setLoaded({ repository, revision, data: next, error: null })
  }
  return (
    <WorkspaceContext.Provider value={{ data, loading, error, reload, update }}>
      {children}
    </WorkspaceContext.Provider>
  )
}
