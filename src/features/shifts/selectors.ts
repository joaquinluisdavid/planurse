import type { Task } from '@/data/models'

export type TaskFilters = {
  patient: string
  priority: string
  completion: string
  due: string
}
export const defaultFilters: TaskFilters = {
  patient: 'all',
  priority: 'all',
  completion: 'active',
  due: 'all',
}
export const isOverdue = (task: Task, now: number) =>
  !task.completedAt &&
  task.dueAt !== null &&
  new Date(task.dueAt).getTime() < now

export function filterTasks(
  tasks: Task[],
  filters: TaskFilters,
  now: number,
): Task[] {
  const priorityOrder = { urgent: 0, important: 1, routine: 2 }
  return tasks
    .filter(
      (task) =>
        (filters.patient === 'all' || task.patientLabel === filters.patient) &&
        (filters.priority === 'all' || task.priority === filters.priority) &&
        (filters.completion === 'all' ||
          (filters.completion === 'completed'
            ? !!task.completedAt
            : !task.completedAt)) &&
        (filters.due === 'all' ||
          (filters.due === 'overdue'
            ? isOverdue(task, now)
            : filters.due === 'none'
              ? task.dueAt === null
              : !task.completedAt &&
                task.dueAt !== null &&
                new Date(task.dueAt).getTime() >= now &&
                new Date(task.dueAt).getTime() <= now + 3_600_000)),
    )
    .sort(
      (a, b) =>
        Number(!!a.completedAt) - Number(!!b.completedAt) ||
        Number(isOverdue(b, now)) - Number(isOverdue(a, now)) ||
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        (a.dueAt ? new Date(a.dueAt).getTime() : Infinity) -
          (b.dueAt ? new Date(b.dueAt).getTime() : Infinity),
    )
}
