import { createContext, useContext } from 'react'
import type { Workspace } from './models'

type WorkspaceValue = {
  data: Workspace | null
  loading: boolean
  error: string | null
  reload: () => void
  update: (change: (workspace: Workspace) => Workspace) => Promise<void>
  reset: () => Promise<void>
}
export const WorkspaceContext = createContext<WorkspaceValue | null>(null)

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace requires WorkspaceProvider.')
  return context
}
