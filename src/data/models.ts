import { z } from 'zod'
import {
  prioritySchema,
  shiftTypeSchema,
  shiftFormSchema,
} from '@/features/shifts/schemas'

export const DEMO_USER_ID = 'demo-user'
const ownership = { userId: z.literal(DEMO_USER_ID) }
const timestamp = z.iso.datetime()
const roomLabel = z.string().regex(/^Demo room [A-Za-z0-9-]{1,12}$/)

export const shiftSchema = z.object({
  id: z.string().min(1),
  ...ownership,
  type: shiftTypeSchema,
  date: shiftFormSchema.shape.date,
  startedAt: timestamp,
  endedAt: timestamp.nullable(),
  patientLabels: z.array(roomLabel),
})
export const taskSchema = z.object({
  id: z.string().min(1),
  ...ownership,
  shiftId: z.string().min(1),
  title: z.string().trim().min(3).max(120),
  patientLabel: z.union([z.literal(''), roomLabel]),
  priority: prioritySchema,
  dueAt: timestamp.nullable(),
  completedAt: timestamp.nullable(),
  createdAt: timestamp,
})
export const handoffSchema = z.object({
  id: z.string(),
  ...ownership,
  shiftId: z.string(),
  patientLabel: roomLabel,
  situation: z.string(),
  background: z.string(),
  assessment: z.string(),
  recommendation: z.string(),
  updatedAt: timestamp,
})
export const reflectionSchema = z.object({
  id: z.string(),
  ...ownership,
  shiftId: z.string(),
  wentWell: z.string(),
  difficult: z.string(),
  reviewLater: z.string(),
  confidence: z.number().int().min(1).max(5),
  createdAt: timestamp,
})

export const workspaceSchema = z
  .object({
    version: z.literal(1),
    shifts: z.array(shiftSchema),
    tasks: z.array(taskSchema),
    handoffs: z.array(handoffSchema),
    reflections: z.array(reflectionSchema),
  })
  .superRefine((value, context) => {
    if (value.shifts.filter((shift) => !shift.endedAt).length > 1)
      context.addIssue({
        code: 'custom',
        message: 'Only one shift can be active.',
      })
    for (const records of [
      value.shifts,
      value.tasks,
      value.handoffs,
      value.reflections,
    ]) {
      if (new Set(records.map((record) => record.id)).size !== records.length)
        context.addIssue({
          code: 'custom',
          message: 'Duplicate record identifiers.',
        })
    }
    for (const record of [
      ...value.tasks,
      ...value.handoffs,
      ...value.reflections,
    ]) {
      const shift = value.shifts.find((shift) => shift.id === record.shiftId)
      if (
        !shift ||
        ('patientLabel' in record &&
          record.patientLabel &&
          !shift.patientLabels.includes(record.patientLabel))
      )
        context.addIssue({
          code: 'custom',
          message:
            'Record must belong to an existing shift and fictional room.',
        })
    }
  })

export type Shift = z.infer<typeof shiftSchema>
export type Task = z.infer<typeof taskSchema>
export type Handoff = z.infer<typeof handoffSchema>
export type Reflection = z.infer<typeof reflectionSchema>
export type Workspace = z.infer<typeof workspaceSchema>
