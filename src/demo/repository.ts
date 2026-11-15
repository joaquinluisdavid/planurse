import { createDemoWorkspace } from './demoWorkspace'
import type { Workspace } from '@/data/models'
import type { WorkspaceRepository } from '@/data/repository'

export function createDemoRepository(): WorkspaceRepository {
  let data: Workspace = structuredClone(createDemoWorkspace())
  return {
    async load() {
      return data
    },
    async update(change) {
      data = change(structuredClone(data))
      return data
    },
  }
}
