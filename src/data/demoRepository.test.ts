import { describe, expect, it, vi } from 'vitest'
import { demoRepository, WORKSPACE_KEY } from './demoRepository'
import { completeTask } from '@/features/shifts/mutations'

describe('demo repository', () => {
  it('seeds fictional data once and persists changes across reloads', async () => {
    const first = await demoRepository.load()
    await demoRepository.update((workspace) =>
      completeTask(workspace, 'shift-current', 'task-1', true),
    )
    expect((await demoRepository.load()).tasks[0].completedAt).not.toBeNull()
    expect(first.tasks[0].completedAt).toBeNull()
  })
  it('surfaces malformed data instead of silently replacing it', async () => {
    localStorage.setItem(WORKSPACE_KEY, '{invalid')
    await expect(demoRepository.load()).rejects.toThrow('unreadable')
    expect(localStorage.getItem(WORKSPACE_KEY)).toBe('{invalid')
    await demoRepository.reset()
    expect((await demoRepository.load()).shifts).toHaveLength(2)
  })
  it('rejects records not belonging to the fictional demo owner', async () => {
    const workspace = await demoRepository.load()
    localStorage.setItem(
      WORKSPACE_KEY,
      JSON.stringify({
        ...workspace,
        shifts: [{ ...workspace.shifts[0], userId: 'another-user' }],
      }),
    )
    await expect(demoRepository.load()).rejects.toThrow('invalid')
  })
  it('rejects invalid calendar dates before they reach page formatting', async () => {
    const workspace = await demoRepository.load()
    workspace.shifts[0].date = '2026-99-99'
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace))
    await expect(demoRepository.load()).rejects.toThrow('invalid')
  })
  it('surfaces quota errors and leaves previously stored data unchanged', async () => {
    const initial = await demoRepository.load()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is full', 'QuotaExceededError')
    })
    await expect(
      demoRepository.update((workspace) =>
        completeTask(workspace, 'shift-current', 'task-1', true),
      ),
    ).rejects.toThrow('Storage is full')
    expect((await demoRepository.load()).tasks).toEqual(initial.tasks)
  })
})
