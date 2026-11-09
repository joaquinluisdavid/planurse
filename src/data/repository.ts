import type { Workspace } from './models'

export interface WorkspaceRepository {
  load: () => Promise<Workspace>
  update: (change: (workspace: Workspace) => Workspace) => Promise<Workspace>
}
