import { z } from 'zod'
import {
  prioritySchema,
  shiftTypeSchema,
  shiftFormSchema,
} from '@/features/shifts/schemas'

const ownership = { userId: z.string().min(1) }
const timestamp = z.iso.datetime({ offset: true })
const roomLabel = z.string().regex(/^Room [A-Za-z0-9-]{1,12}$/)
const calendarDate = shiftFormSchema.shape.date
export const caseCategorySchema = z.enum([
  'care-coordination',
  'patient-education',
  'admission-discharge',
  'team-communication',
  'clinical-skills-practice',
  'other-learning',
])

export const plannerItemSchema = z.object({
  id: z.string().min(1),
  ...ownership,
  title: z.string().trim().min(3).max(120),
  kind: z.enum(['schedule', 'reminder']),
  date: calendarDate,
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  notes: z.string().max(2000),
  completedAt: timestamp.nullable(),
  createdAt: timestamp,
  updatedAt: timestamp,
})

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
export const reflectionSchema = z.object({
  id: z.string(),
  ...ownership,
  shiftId: z.string().nullable().default(null),
  plannerItemId: z.string().nullable().default(null),
  caseRecordId: z.string().nullable().default(null),
  entryDate: calendarDate,
  wentWell: z.string(),
  difficult: z.string(),
  reviewLater: z.string(),
  confidence: z.number().int().min(1).max(5),
  createdAt: timestamp,
})
export const learningNoteSchema = z.object({
  id: z.string().min(1),
  ...ownership,
  shiftId: z.string().nullable().default(null),
  plannerItemId: z.string().nullable().default(null),
  caseRecordId: z.string().nullable().default(null),
  entryDate: calendarDate,
  topic: z.string().trim().min(3).max(100),
  question: z.string().trim().max(1000),
  followUp: z.string().trim().max(1000),
  createdAt: timestamp,
  updatedAt: timestamp,
})
export const caseRecordSchema = z.object({
  id: z.string().min(1),
  ...ownership,
  plannerItemId: z.string().nullable().default(null),
  entryDate: calendarDate,
  category: caseCategorySchema,
  learningTakeaway: z.string().trim().max(1000),
  createdAt: timestamp,
  updatedAt: timestamp,
})

export const workspaceSchema = z
  .object({
    version: z.literal(1),
    shifts: z.array(shiftSchema),
    tasks: z.array(taskSchema),
    reflections: z.array(reflectionSchema),
    learningNotes: z.array(learningNoteSchema).default([]),
    plannerItems: z.array(plannerItemSchema).default([]),
    caseRecords: z.array(caseRecordSchema).default([]),
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
      value.reflections,
      value.learningNotes,
      value.plannerItems,
      value.caseRecords,
    ]) {
      if (new Set(records.map((record) => record.id)).size !== records.length)
        context.addIssue({
          code: 'custom',
          message: 'Duplicate record identifiers.',
        })
    }
    for (const record of [
      ...value.tasks,
      ...value.reflections,
      ...value.learningNotes,
      ...value.caseRecords,
    ]) {
      if ('shiftId' in record && record.shiftId) {
        const shift = value.shifts.find((shift) => shift.id === record.shiftId)
        if (!shift) {
          context.addIssue({
            code: 'custom',
            message: 'Record must belong to an existing shift.',
          })
          continue
        }
        if (shift.userId !== record.userId)
          context.addIssue({
            code: 'custom',
            message: 'Record and shift must belong to the same account.',
          })
        if (
          'patientLabel' in record &&
          record.patientLabel &&
          !shift.patientLabels.includes(record.patientLabel)
        )
          context.addIssue({
            code: 'custom',
            message: 'Record must belong to an existing room shorthand.',
          })
      }
      if ('plannerItemId' in record && record.plannerItemId) {
        const item = value.plannerItems.find(
          (entry) => entry.id === record.plannerItemId,
        )
        if (!item || item.userId !== record.userId)
          context.addIssue({
            code: 'custom',
            message: 'Record must link to your own calendar entry.',
          })
        else if ('entryDate' in record && record.entryDate !== item.date)
          context.addIssue({
            code: 'custom',
            message: 'Linked notes must use the calendar entry date.',
          })
      }
      if ('caseRecordId' in record && record.caseRecordId) {
        const caseRecord = value.caseRecords.find(
          (entry) => entry.id === record.caseRecordId,
        )
        if (!caseRecord || caseRecord.userId !== record.userId)
          context.addIssue({
            code: 'custom',
            message: 'Record must link to your own case handled entry.',
          })
        else if (
          'entryDate' in record &&
          record.entryDate !== caseRecord.entryDate
        )
          context.addIssue({
            code: 'custom',
            message: 'Linked case notes must use the case date.',
          })
      }
      if ('caseRecordId' in record && record.caseRecordId) {
        const caseRecord = value.caseRecords.find(
          (entry) => entry.id === record.caseRecordId,
        )
        if (!caseRecord || caseRecord.userId !== record.userId)
          context.addIssue({
            code: 'custom',
            message: 'Record must link to your own case handled entry.',
          })
        else if (
          'entryDate' in record &&
          record.entryDate !== caseRecord.entryDate
        )
          context.addIssue({
            code: 'custom',
            message: 'Linked case notes must use the case date.',
          })
      }
    }
    for (const caseRecord of value.caseRecords) {
      if (!caseRecord.plannerItemId) continue
      const item = value.plannerItems.find(
        (entry) => entry.id === caseRecord.plannerItemId,
      )
      if (!item || item.userId !== caseRecord.userId)
        context.addIssue({
          code: 'custom',
          message: 'Case record must link to your own calendar entry.',
        })
      else if (item.date !== caseRecord.entryDate)
        context.addIssue({
          code: 'custom',
          message: 'Linked case entry must use the calendar date.',
        })
    }
  })

export type Shift = z.infer<typeof shiftSchema>
export type Task = z.infer<typeof taskSchema>
export type Reflection = z.infer<typeof reflectionSchema>
export type LearningNote = z.infer<typeof learningNoteSchema>
export type PlannerItem = z.infer<typeof plannerItemSchema>
export type CaseRecord = z.infer<typeof caseRecordSchema>
export type Workspace = z.infer<typeof workspaceSchema>
