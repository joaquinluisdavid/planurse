import { z } from 'zod'
import type { PlannerItem, Workspace } from '@/data/models'
import { localDate } from '@/lib/dates'

export const calendarEntrySchema = z
  .object({
    title: z.string().trim().min(3, 'Use at least 3 characters.').max(120),
    kind: z.enum(['schedule', 'reminder']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date.'),
    startTime: z.string(),
    endTime: z.string(),
    notes: z.string().trim().max(2000),
  })
  .superRefine((entry, context) => {
    const validDate = new Date(`${entry.date}T12:00:00`)
    if (
      Number.isNaN(validDate.getTime()) ||
      localDate(validDate) !== entry.date
    )
      context.addIssue({
        code: 'custom',
        path: ['date'],
        message: 'Choose a valid calendar date.',
      })
    if (entry.kind === 'schedule' && !entry.startTime)
      context.addIssue({
        code: 'custom',
        path: ['startTime'],
        message: 'Add a start time for a scheduled item.',
      })
    if (entry.startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.startTime))
      context.addIssue({
        code: 'custom',
        path: ['startTime'],
        message: 'Choose a valid time.',
      })
    if (entry.endTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.endTime))
      context.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'Choose a valid time.',
      })
    if (entry.startTime && entry.endTime && entry.endTime <= entry.startTime)
      context.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'End time must be after start time.',
      })
  })

export type CalendarEntryValues = z.infer<typeof calendarEntrySchema>

function linkedCaseIds(workspace: Workspace, plannerItemId: string) {
  return new Set(
    workspace.caseRecords
      .filter((entry) => entry.plannerItemId === plannerItemId)
      .map((entry) => entry.id),
  )
}

export function saveCalendarEntry(
  workspace: Workspace,
  values: CalendarEntryValues,
  userId: string,
  id: string,
  editing: boolean,
  now = new Date(),
): Workspace {
  const valid = calendarEntrySchema.parse(values)
  const existing = workspace.plannerItems.find((item) => item.id === id)
  if (editing && (!existing || existing.userId !== userId))
    throw new Error('This calendar entry no longer exists. Refresh and retry.')
  if (!editing && workspace.plannerItems.some((item) => item.id === id))
    throw new Error(
      'Calendar entry identifier already exists. Please try again.',
    )
  const entry: PlannerItem = {
    id,
    userId,
    ...valid,
    startTime: valid.startTime || null,
    endTime: valid.endTime || null,
    completedAt: existing?.completedAt ?? null,
    createdAt: existing?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
  }
  const linkedCases = editing ? linkedCaseIds(workspace, id) : new Set<string>()
  const caseRecords = editing
    ? workspace.caseRecords.map((item) =>
        item.plannerItemId === id
          ? { ...item, entryDate: valid.date, updatedAt: now.toISOString() }
          : item,
      )
    : workspace.caseRecords
  return {
    ...workspace,
    plannerItems: editing
      ? workspace.plannerItems.map((item) => (item.id === id ? entry : item))
      : [...workspace.plannerItems, entry],
    reflections: editing
      ? workspace.reflections.map((item) =>
          item.plannerItemId === id ||
          (item.caseRecordId && linkedCases.has(item.caseRecordId))
            ? { ...item, entryDate: valid.date }
            : item,
        )
      : workspace.reflections,
    learningNotes: editing
      ? workspace.learningNotes.map((item) =>
          item.plannerItemId === id ||
          (item.caseRecordId && linkedCases.has(item.caseRecordId))
            ? { ...item, entryDate: valid.date, updatedAt: now.toISOString() }
            : item,
        )
      : workspace.learningNotes,
    caseRecords,
  }
}

export function moveCalendarEntry(
  workspace: Workspace,
  id: string,
  date: string,
  now = new Date(),
): Workspace {
  const item = workspace.plannerItems.find((entry) => entry.id === id)
  if (!item)
    throw new Error('This calendar entry no longer exists. Refresh and retry.')
  const validDate = calendarEntrySchema.shape.date.parse(date)
  const linkedCases = linkedCaseIds(workspace, id)
  return {
    ...workspace,
    plannerItems: workspace.plannerItems.map((entry) =>
      entry.id === id
        ? { ...entry, date: validDate, updatedAt: now.toISOString() }
        : entry,
    ),
    learningNotes: workspace.learningNotes.map((entry) =>
      entry.plannerItemId === id ||
      (entry.caseRecordId && linkedCases.has(entry.caseRecordId))
        ? { ...entry, entryDate: validDate, updatedAt: now.toISOString() }
        : entry,
    ),
    caseRecords: workspace.caseRecords.map((entry) =>
      entry.plannerItemId === id
        ? { ...entry, entryDate: validDate, updatedAt: now.toISOString() }
        : entry,
    ),
    reflections: workspace.reflections.map((entry) =>
      entry.plannerItemId === id ||
      (entry.caseRecordId && linkedCases.has(entry.caseRecordId))
        ? { ...entry, entryDate: validDate }
        : entry,
    ),
  }
}

export function completeCalendarEntry(
  workspace: Workspace,
  id: string,
  complete: boolean,
  now = new Date(),
): Workspace {
  if (!workspace.plannerItems.some((item) => item.id === id))
    throw new Error('This calendar entry no longer exists. Refresh and retry.')
  return {
    ...workspace,
    plannerItems: workspace.plannerItems.map((item) =>
      item.id === id
        ? {
            ...item,
            completedAt: complete ? now.toISOString() : null,
            updatedAt: now.toISOString(),
          }
        : item,
    ),
  }
}

export function deleteCalendarEntry(
  workspace: Workspace,
  id: string,
): Workspace {
  if (!workspace.plannerItems.some((item) => item.id === id))
    throw new Error('This calendar entry no longer exists. Refresh and retry.')
  return {
    ...workspace,
    plannerItems: workspace.plannerItems.filter((item) => item.id !== id),
    reflections: workspace.reflections.map((item) =>
      item.plannerItemId === id ? { ...item, plannerItemId: null } : item,
    ),
    learningNotes: workspace.learningNotes.map((item) =>
      item.plannerItemId === id ? { ...item, plannerItemId: null } : item,
    ),
    caseRecords: workspace.caseRecords.map((item) =>
      item.plannerItemId === id ? { ...item, plannerItemId: null } : item,
    ),
  }
}
