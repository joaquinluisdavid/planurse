import { workspaceSchema, type Workspace } from './models'
import { createDemoWorkspace } from '@/demo/fixtures'

export const WORKSPACE_KEY = 'planurse.fictional-workspace.v1'

export interface WorkspaceRepository {
  load: () => Promise<Workspace>
  update: (change: (workspace: Workspace) => Workspace) => Promise<Workspace>
  reset: () => Promise<Workspace>
}

function read(): Workspace {
  const stored = localStorage.getItem(WORKSPACE_KEY)
  if (stored === null) {
    const initial = workspaceSchema.parse(createDemoWorkspace())
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(initial))
    return initial
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(stored)
  } catch {
    throw new Error(
      'Saved demo data is unreadable. Reset the demo in Settings to recover.',
    )
  }
  const result = workspaceSchema.safeParse(parsed)
  if (!result.success)
    throw new Error(
      'Saved demo data is invalid. Reset the demo in Settings to recover.',
    )
  return result.data
}

export const demoRepository: WorkspaceRepository = {
  async load() {
    return read()
  },
  async update(change) {
    const next = workspaceSchema.parse(change(read()))
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(next))
    return next
  },
  async reset() {
    const initial = workspaceSchema.parse(createDemoWorkspace())
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(initial))
    return initial
  },
}
