import { z } from 'zod'
import { caseCategorySchema, type Workspace } from '@/data/models'

export const reflectionFormSchema = z.object({
  shiftId: z.string(),
  plannerItemId: z.string(),
  caseRecordId: z.string(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date.'),
  wentWell: z.string().trim().min(3, 'Add a short reflection.').max(2000),
  difficult: z.string().trim().min(3, 'Add a short reflection.').max(2000),
  reviewLater: z.string().trim().min(3, 'Add a learning question.').max(2000),
  confidence: z.number().int().min(1).max(5),
})

export const learningNoteFormSchema = z.object({
  shiftId: z.string(),
  plannerItemId: z.string(),
  caseRecordId: z.string(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date.'),
  topic: z.string().trim().min(3, 'Use at least 3 characters.').max(100),
  question: z.string().trim().max(1000),
  followUp: z.string().trim().max(1000),
})

export type ReflectionFormValues = z.infer<typeof reflectionFormSchema>
export type LearningNoteFormValues = z.infer<typeof learningNoteFormSchema>

function requireShift(workspace: Workspace, id: string) {
  const shift = workspace.shifts.find((item) => item.id === id)
  if (!shift) throw new Error('This shift no longer exists. Refresh and retry.')
  return shift
}

export function saveReflection(
  workspace: Workspace,
  values: ReflectionFormValues,
  userId: string,
  id: string,
  editing: boolean,
  now = new Date(),
): Workspace {
  const valid = reflectionFormSchema.parse(values)
  const shift = valid.shiftId ? requireShift(workspace, valid.shiftId) : null
  if (
    valid.plannerItemId &&
    !workspace.plannerItems.some(
      (item) => item.id === valid.plannerItemId && item.userId === userId,
    )
  )
    throw new Error('This calendar entry no longer exists. Refresh and retry.')
  if (
    valid.caseRecordId &&
    !workspace.caseRecords.some(
      (entry) => entry.id === valid.caseRecordId && entry.userId === userId,
    )
  )
    throw new Error('This case entry no longer exists. Refresh and retry.')
  if (shift && shift.userId !== userId)
    throw new Error('This shift does not belong to your account.')
  const existing = workspace.reflections.find((item) => item.id === id)
  if (editing && (!existing || existing.userId !== userId))
    throw new Error('This reflection no longer exists. Refresh and retry.')
  if (!editing && workspace.reflections.some((item) => item.id === id))
    throw new Error('Reflection identifier already exists. Please try again.')
  const reflection = {
    id,
    userId,
    ...valid,
    shiftId: valid.shiftId || null,
    plannerItemId: valid.plannerItemId || null,
    caseRecordId: valid.caseRecordId || null,
    createdAt: existing?.createdAt ?? now.toISOString(),
  }
  return {
    ...workspace,
    reflections: editing
      ? workspace.reflections.map((item) =>
          item.id === id ? reflection : item,
        )
      : [...workspace.reflections, reflection],
  }
}

export function deleteReflection(workspace: Workspace, id: string): Workspace {
  if (!workspace.reflections.some((item) => item.id === id))
    throw new Error('This reflection no longer exists. Refresh and retry.')
  return {
    ...workspace,
    reflections: workspace.reflections.filter((item) => item.id !== id),
  }
}

export function saveLearningNote(
  workspace: Workspace,
  values: LearningNoteFormValues,
  userId: string,
  id: string,
  editing: boolean,
  now = new Date(),
): Workspace {
  const valid = learningNoteFormSchema.parse(values)
  const shift = valid.shiftId ? requireShift(workspace, valid.shiftId) : null
  if (
    valid.plannerItemId &&
    !workspace.plannerItems.some(
      (item) => item.id === valid.plannerItemId && item.userId === userId,
    )
  )
    throw new Error('This calendar entry no longer exists. Refresh and retry.')
  if (
    valid.caseRecordId &&
    !workspace.caseRecords.some(
      (entry) => entry.id === valid.caseRecordId && entry.userId === userId,
    )
  )
    throw new Error('This case entry no longer exists. Refresh and retry.')
  if (shift && shift.userId !== userId)
    throw new Error('This shift does not belong to your account.')
  const existing = workspace.learningNotes.find((item) => item.id === id)
  if (editing && (!existing || existing.userId !== userId))
    throw new Error('This learning note no longer exists. Refresh and retry.')
  if (!editing && workspace.learningNotes.some((item) => item.id === id))
    throw new Error('Note identifier already exists. Please try again.')
  const note = {
    id,
    userId,
    ...valid,
    shiftId: valid.shiftId || null,
    plannerItemId: valid.plannerItemId || null,
    caseRecordId: valid.caseRecordId || null,
    createdAt: existing?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
  }
  return {
    ...workspace,
    learningNotes: editing
      ? workspace.learningNotes.map((item) => (item.id === id ? note : item))
      : [...workspace.learningNotes, note],
  }
}

export function deleteLearningNote(
  workspace: Workspace,
  id: string,
): Workspace {
  if (!workspace.learningNotes.some((item) => item.id === id))
    throw new Error('This learning note no longer exists. Refresh and retry.')
  return {
    ...workspace,
    learningNotes: workspace.learningNotes.filter((item) => item.id !== id),
  }
}

export const caseRecordFormSchema = z.object({
  plannerItemId: z.string(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date.'),
  category: caseCategorySchema,
  learningTakeaway: z.string().trim().max(1000),
})

export type CaseRecordFormValues = z.infer<typeof caseRecordFormSchema>

export function saveCaseRecord(
  workspace: Workspace,
  values: CaseRecordFormValues,
  userId: string,
  id: string,
  editing: boolean,
  now = new Date(),
): Workspace {
  const valid = caseRecordFormSchema.parse(values)
  if (
    valid.plannerItemId &&
    !workspace.plannerItems.some(
      (item) =>
        item.id === valid.plannerItemId &&
        item.userId === userId &&
        item.date === valid.entryDate,
    )
  )
    throw new Error('Choose a calendar entry on the selected date.')
  const existing = workspace.caseRecords.find((item) => item.id === id)
  if (editing && (!existing || existing.userId !== userId))
    throw new Error('This case entry no longer exists. Refresh and retry.')
  if (!editing && workspace.caseRecords.some((item) => item.id === id))
    throw new Error('Case entry identifier already exists. Please try again.')
  const caseRecord = {
    id,
    userId,
    ...valid,
    plannerItemId: valid.plannerItemId || null,
    createdAt: existing?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
  }
  return {
    ...workspace,
    caseRecords: editing
      ? workspace.caseRecords.map((item) =>
          item.id === id ? caseRecord : item,
        )
      : [...workspace.caseRecords, caseRecord],
    learningNotes: editing
      ? workspace.learningNotes.map((item) =>
          item.caseRecordId === id
            ? {
                ...item,
                entryDate: valid.entryDate,
                updatedAt: now.toISOString(),
              }
            : item,
        )
      : workspace.learningNotes,
    reflections: editing
      ? workspace.reflections.map((item) =>
          item.caseRecordId === id
            ? { ...item, entryDate: valid.entryDate }
            : item,
        )
      : workspace.reflections,
  }
}

export function deleteCaseRecord(workspace: Workspace, id: string): Workspace {
  if (!workspace.caseRecords.some((item) => item.id === id))
    throw new Error('This case entry no longer exists. Refresh and retry.')
  return {
    ...workspace,
    caseRecords: workspace.caseRecords.filter((item) => item.id !== id),
    learningNotes: workspace.learningNotes.map((item) =>
      item.caseRecordId === id ? { ...item, caseRecordId: null } : item,
    ),
    reflections: workspace.reflections.map((item) =>
      item.caseRecordId === id ? { ...item, caseRecordId: null } : item,
    ),
  }
}
