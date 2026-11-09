import { describe, expect, it } from 'vitest'
import { createWorkspaceFixture } from '@/test/workspaceFixture'
import {
  addRoom,
  completeTask,
  deleteTask,
  endShift,
  saveTask,
  startShift,
} from './mutations'
import { defaultFilters, filterTasks, isOverdue } from './selectors'
import { shiftFormSchema, taskFormSchema, type TaskFormValues } from './schemas'
import { localDateTime } from '@/lib/dates'

const now = new Date('2026-11-07T09:00:00Z')
const values: TaskFormValues = {
  title: 'Review learning goals',
  priority: 'routine',
  patientLabel: '',
  dueAt: '',
}

describe('shift business logic', () => {
  it('creates, edits, completes, reopens and deletes a task without mutating the original', () => {
    const initial = createWorkspaceFixture(now)
    const added = saveTask(initial, 'shift-current', values, 'new', false, now)
    expect(initial.tasks).toHaveLength(6)
    expect(added.tasks.at(-1)).toMatchObject({
      id: 'new',
      title: values.title,
      completedAt: null,
    })
    const edited = saveTask(
      added,
      'shift-current',
      { ...values, priority: 'important' },
      'new',
      true,
      now,
    )
    expect(edited.tasks.at(-1)?.priority).toBe('important')
    const completed = completeTask(edited, 'shift-current', 'new', true, now)
    expect(completed.tasks.at(-1)?.completedAt).toBe(now.toISOString())
    const reopened = completeTask(completed, 'shift-current', 'new', false, now)
    expect(reopened.tasks.at(-1)?.completedAt).toBeNull()
    expect(deleteTask(reopened, 'shift-current', 'new').tasks).toHaveLength(6)
  })
  it('requires acknowledgement and preserves incomplete tasks when ending a shift', () => {
    const initial = createWorkspaceFixture(now)
    expect(() => endShift(initial, 'shift-current', false, now)).toThrow(
      'Acknowledge',
    )
    const ended = endShift(initial, 'shift-current', true, now)
    expect(ended.shifts[0].endedAt).toBe(now.toISOString())
    expect(ended.tasks).toEqual(initial.tasks)
    expect(() =>
      saveTask(ended, 'shift-current', values, 'new', false),
    ).toThrow('read-only')
    expect(() => completeTask(ended, 'shift-current', 'task-1', true)).toThrow(
      'read-only',
    )
    expect(() => deleteTask(ended, 'shift-current', 'task-1')).toThrow(
      'read-only',
    )
  })
  it('prevents two active shifts and future shift starts', () => {
    const initial = createWorkspaceFixture(now)
    expect(() =>
      startShift(initial, { type: 'night', date: '2026-11-07' }, 'new', now),
    ).toThrow('current shift')
    const ended = endShift(initial, 'shift-current', true, now)
    expect(() =>
      startShift(ended, { type: 'night', date: '2099-01-01' }, 'new', now),
    ).toThrow('future')
    expect(
      startShift(ended, { type: 'night', date: '2026-11-07' }, 'new', now)
        .shifts[0],
    ).toMatchObject({ type: 'night', endedAt: null })
  })
  it('accepts fictional codes, rejects duplicates and rejects unrelated rooms', () => {
    const initial = createWorkspaceFixture(now)
    expect(
      addRoom(initial, 'shift-current', 'd').shifts[0].patientLabels,
    ).toContain('Room D')
    expect(() => addRoom(initial, 'shift-current', 'A')).toThrow('already')
    expect(() => addRoom(initial, 'shift-current', 'Room / Name')).toThrow()
    expect(() =>
      saveTask(
        initial,
        'shift-current',
        { ...values, patientLabel: 'Room Z' },
        'new',
        false,
      ),
    ).toThrow('belonging')
    expect(() =>
      completeTask(initial, 'shift-current', 'task-previous', true),
    ).toThrow('not found')
  })
})

describe('task filtering and dates', () => {
  const tasks = createWorkspaceFixture(now).tasks.filter(
    (task) => task.shiftId === 'shift-current',
  )
  it('combines room, priority, completion and due filters', () => {
    expect(
      filterTasks(
        tasks,
        {
          ...defaultFilters,
          patient: 'Room A',
          priority: 'routine',
          due: 'next-hour',
        },
        now.getTime(),
      ).map((task) => task.id),
    ).toEqual(['task-2'])
    expect(
      filterTasks(
        tasks,
        { ...defaultFilters, priority: 'urgent', due: 'next-hour' },
        now.getTime(),
      ),
    ).toEqual([])
    expect(
      filterTasks(
        tasks,
        { ...defaultFilters, completion: 'completed' },
        now.getTime(),
      ).map((task) => task.id),
    ).toEqual(['task-4'])
    expect(
      filterTasks(
        tasks,
        { ...defaultFilters, due: 'overdue' },
        now.getTime(),
      ).map((task) => task.id),
    ).toEqual(['task-1'])
    expect(
      filterTasks(tasks, { ...defaultFilters, due: 'none' }, now.getTime()).map(
        (task) => task.id,
      ),
    ).toEqual(['task-5'])
  })
  it('never marks completed tasks overdue and orders overdue before priority', () => {
    expect(
      isOverdue({ ...tasks[0], completedAt: now.toISOString() }, now.getTime()),
    ).toBe(false)
    expect(filterTasks(tasks, defaultFilters, now.getTime())[0].id).toBe(
      'task-1',
    )
  })
  it('validates titles, real calendar dates, priorities and overnight due dates', () => {
    expect(taskFormSchema.safeParse({ ...values, title: '  ' }).success).toBe(
      false,
    )
    expect(
      taskFormSchema.safeParse({ ...values, priority: 'clinical' }).success,
    ).toBe(false)
    expect(
      taskFormSchema.safeParse({ ...values, dueAt: '2026-02-30T10:00' })
        .success,
    ).toBe(false)
    expect(
      shiftFormSchema.safeParse({ type: 'day', date: '2026-02-30' }).success,
    ).toBe(false)
    const overnight = { ...values, dueAt: '2026-11-08T02:30' }
    const saved = saveTask(
      createWorkspaceFixture(now),
      'shift-current',
      overnight,
      'night-task',
      false,
      now,
    )
    expect(localDateTime(saved.tasks.at(-1)!.dueAt!)).toBe(overnight.dueAt)
  })
})
