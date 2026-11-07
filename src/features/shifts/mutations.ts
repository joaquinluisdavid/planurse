import { DEMO_USER_ID, type Workspace, type Task } from '@/data/models'
import { localDate } from '@/lib/dates'
import {
  roomSuffixSchema,
  shiftFormSchema,
  taskFormSchema,
  type ShiftFormValues,
  type TaskFormValues,
} from './schemas'

function requireActiveShift(workspace: Workspace, id: string) {
  const shift = workspace.shifts.find((shift) => shift.id === id)
  if (!shift)
    throw new Error('This shift no longer exists. Refresh your workspace.')
  if (shift.endedAt)
    throw new Error('This shift has ended. Its tasks are read-only.')
  return shift
}

export function startShift(
  workspace: Workspace,
  values: ShiftFormValues,
  id: string,
  now = new Date(),
): Workspace {
  const valid = shiftFormSchema.parse(values)
  if (workspace.shifts.some((shift) => !shift.endedAt))
    throw new Error('End your current shift before starting another.')
  if (valid.date > localDate(now))
    throw new Error('A shift cannot start on a future date.')
  return {
    ...workspace,
    shifts: [
      {
        id,
        userId: DEMO_USER_ID,
        ...valid,
        startedAt: now.toISOString(),
        endedAt: null,
        patientLabels: [],
      },
      ...workspace.shifts,
    ],
  }
}

export function saveTask(
  workspace: Workspace,
  shiftId: string,
  values: TaskFormValues,
  id: string,
  editing: boolean,
  now = new Date(),
): Workspace {
  const shift = requireActiveShift(workspace, shiftId)
  const valid = taskFormSchema.parse(values)
  if (valid.patientLabel && !shift.patientLabels.includes(valid.patientLabel))
    throw new Error('Choose a fictional room belonging to this shift.')
  const existing = workspace.tasks.find(
    (task) => task.id === id && task.shiftId === shiftId,
  )
  if (editing && !existing)
    throw new Error('This task no longer exists. Refresh and try again.')
  if (!editing && workspace.tasks.some((task) => task.id === id))
    throw new Error('Task identifier already exists. Please try again.')
  const task: Task = {
    id,
    userId: DEMO_USER_ID,
    shiftId,
    title: valid.title,
    patientLabel: valid.patientLabel,
    priority: valid.priority,
    dueAt: valid.dueAt ? new Date(valid.dueAt).toISOString() : null,
    createdAt: existing?.createdAt ?? now.toISOString(),
    completedAt: existing?.completedAt ?? null,
  }
  return {
    ...workspace,
    tasks: editing
      ? workspace.tasks.map((item) => (item.id === id ? task : item))
      : [...workspace.tasks, task],
  }
}

export function completeTask(
  workspace: Workspace,
  shiftId: string,
  id: string,
  complete: boolean,
  now = new Date(),
): Workspace {
  requireActiveShift(workspace, shiftId)
  if (
    !workspace.tasks.some((task) => task.id === id && task.shiftId === shiftId)
  )
    throw new Error('Task not found. Refresh your workspace.')
  return {
    ...workspace,
    tasks: workspace.tasks.map((task) =>
      task.id === id
        ? { ...task, completedAt: complete ? now.toISOString() : null }
        : task,
    ),
  }
}

export function deleteTask(
  workspace: Workspace,
  shiftId: string,
  id: string,
): Workspace {
  requireActiveShift(workspace, shiftId)
  if (
    !workspace.tasks.some((task) => task.id === id && task.shiftId === shiftId)
  )
    throw new Error('Task not found. Refresh your workspace.')
  return {
    ...workspace,
    tasks: workspace.tasks.filter((task) => task.id !== id),
  }
}

export function addRoom(
  workspace: Workspace,
  shiftId: string,
  suffix: string,
): Workspace {
  const shift = requireActiveShift(workspace, shiftId)
  const label = `Demo room ${roomSuffixSchema.parse(suffix).toUpperCase()}`
  if (shift.patientLabels.includes(label))
    throw new Error('That fictional room is already on this shift.')
  return {
    ...workspace,
    shifts: workspace.shifts.map((item) =>
      item.id === shiftId
        ? { ...item, patientLabels: [...item.patientLabels, label] }
        : item,
    ),
  }
}

export function endShift(
  workspace: Workspace,
  shiftId: string,
  acknowledgeOpenTasks: boolean,
  now = new Date(),
): Workspace {
  requireActiveShift(workspace, shiftId)
  if (
    !acknowledgeOpenTasks &&
    workspace.tasks.some(
      (task) => task.shiftId === shiftId && !task.completedAt,
    )
  )
    throw new Error('Acknowledge unfinished tasks before ending this shift.')
  return {
    ...workspace,
    shifts: workspace.shifts.map((shift) =>
      shift.id === shiftId ? { ...shift, endedAt: now.toISOString() } : shift,
    ),
  }
}
