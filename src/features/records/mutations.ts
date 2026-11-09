import { z } from 'zod'
import type { Workspace } from '@/data/models'

export const handoffFormSchema = z.object({
  shiftId: z.string().min(1, 'Choose a shift.'),
  patientLabel: z.string().min(1, 'Choose a fictional room.'),
  situation: z.string().trim().min(3, 'Add a short situation note.').max(2000),
  background: z.string().trim().min(3, 'Add a short background note.').max(2000),
  assessment: z.string().trim().min(3, 'Add a short organization note.').max(2000),
  recommendation: z
    .string()
    .trim()
    .min(3, 'Add a short next-step reminder.')
    .max(2000),
})

export const reflectionFormSchema = z.object({
  shiftId: z.string().min(1, 'Choose a shift.'),
  wentWell: z.string().trim().min(3, 'Add a short reflection.').max(2000),
  difficult: z.string().trim().min(3, 'Add a short reflection.').max(2000),
  reviewLater: z.string().trim().min(3, 'Add a learning question.').max(2000),
  confidence: z.number().int().min(1).max(5),
})

export const learningNoteFormSchema = z.object({
  shiftId: z.string().min(1, 'Choose a shift.'),
  topic: z.string().trim().min(3, 'Use at least 3 characters.').max(100),
  question: z.string().trim().max(1000),
  followUp: z.string().trim().max(1000),
})

export type HandoffFormValues = z.infer<typeof handoffFormSchema>
export type ReflectionFormValues = z.infer<typeof reflectionFormSchema>
export type LearningNoteFormValues = z.infer<typeof learningNoteFormSchema>

function requireShift(workspace: Workspace, id: string) {
  const shift = workspace.shifts.find((item) => item.id === id)
  if (!shift) throw new Error('This shift no longer exists. Refresh and retry.')
  return shift
}

export function saveHandoff(
  workspace: Workspace,
  values: HandoffFormValues,
  id: string,
  editing: boolean,
  now = new Date(),
): Workspace {
  const valid = handoffFormSchema.parse(values)
  const shift = requireShift(workspace, valid.shiftId)
  if (!shift.patientLabels.includes(valid.patientLabel))
    throw new Error('Choose a fictional room belonging to this shift.')
  const existing = workspace.handoffs.find((item) => item.id === id)
  if (editing && !existing)
    throw new Error('This handoff draft no longer exists. Refresh and retry.')
  if (!editing && workspace.handoffs.some((item) => item.id === id))
    throw new Error('Draft identifier already exists. Please try again.')
  const handoff = {
    id,
    userId: shift.userId,
    ...valid,
    updatedAt: now.toISOString(),
  }
  return {
    ...workspace,
    handoffs: editing
      ? workspace.handoffs.map((item) => (item.id === id ? handoff : item))
      : [...workspace.handoffs, handoff],
  }
}

export function deleteHandoff(workspace: Workspace, id: string): Workspace {
  if (!workspace.handoffs.some((item) => item.id === id))
    throw new Error('This handoff draft no longer exists. Refresh and retry.')
  return { ...workspace, handoffs: workspace.handoffs.filter((item) => item.id !== id) }
}

export function saveReflection(
  workspace: Workspace,
  values: ReflectionFormValues,
  id: string,
  editing: boolean,
  now = new Date(),
): Workspace {
  const valid = reflectionFormSchema.parse(values)
  requireShift(workspace, valid.shiftId)
  const existing = workspace.reflections.find((item) => item.id === id)
  if (editing && !existing)
    throw new Error('This reflection no longer exists. Refresh and retry.')
  if (!editing && workspace.reflections.some((item) => item.id === id))
    throw new Error('Reflection identifier already exists. Please try again.')
  const reflection = {
    id,
    userId: requireShift(workspace, valid.shiftId).userId,
    ...valid,
    createdAt: existing?.createdAt ?? now.toISOString(),
  }
  return {
    ...workspace,
    reflections: editing
      ? workspace.reflections.map((item) => (item.id === id ? reflection : item))
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
  id: string,
  editing: boolean,
  now = new Date(),
): Workspace {
  const valid = learningNoteFormSchema.parse(values)
  requireShift(workspace, valid.shiftId)
  const existing = workspace.learningNotes.find((item) => item.id === id)
  if (editing && !existing)
    throw new Error('This learning note no longer exists. Refresh and retry.')
  if (!editing && workspace.learningNotes.some((item) => item.id === id))
    throw new Error('Note identifier already exists. Please try again.')
  const note = {
    id,
    userId: requireShift(workspace, valid.shiftId).userId,
    ...valid,
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

export function deleteLearningNote(workspace: Workspace, id: string): Workspace {
  if (!workspace.learningNotes.some((item) => item.id === id))
    throw new Error('This learning note no longer exists. Refresh and retry.')
  return {
    ...workspace,
    learningNotes: workspace.learningNotes.filter((item) => item.id !== id),
  }
}
