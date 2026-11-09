import { z } from 'zod'
import { localDateTime } from '@/lib/dates'

export const prioritySchema = z.enum(['routine', 'important', 'urgent'])
export const shiftTypeSchema = z.enum(['day', 'evening', 'night'])
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date.')
  .refine((value) => {
    const date = new Date(`${value}T12:00:00`)
    return (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === Number(value.slice(0, 4)) &&
      date.getMonth() + 1 === Number(value.slice(5, 7)) &&
      date.getDate() === Number(value.slice(8, 10))
    )
  }, 'Choose a valid date.')

export const shiftFormSchema = z.object({
  type: shiftTypeSchema,
  date: dateSchema,
})
export type ShiftFormValues = z.infer<typeof shiftFormSchema>

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters.')
    .max(120, 'Keep the task under 120 characters.'),
  patientLabel: z.string().max(40),
  priority: prioritySchema,
  dueAt: z
    .string()
    .refine(
      (value) =>
        value === '' ||
        (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) &&
          !Number.isNaN(new Date(value).getTime()) &&
          localDateTime(new Date(value).toISOString()) === value),
      'Choose a valid due date and time.',
    ),
})
export type TaskFormValues = z.infer<typeof taskFormSchema>
export const roomSuffixSchema = z
  .string()
  .trim()
  .regex(
    /^[A-Za-z0-9-]{1,12}$/,
    'Use 1–12 letters, numbers, or hyphens. Do not include patient identifiers.',
  )
