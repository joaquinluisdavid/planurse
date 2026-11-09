import { describe, expect, it } from 'vitest'
import { createWorkspaceFixture } from '@/test/workspaceFixture'
import { localDate } from '@/lib/dates'
import {
  calendarEntrySchema,
  completeCalendarEntry,
  deleteCalendarEntry,
  moveCalendarEntry,
  saveCalendarEntry,
} from './mutations'

const values = {
  title: 'Preceptor learning check-in',
  kind: 'schedule' as const,
  date: '2026-11-10',
  startTime: '14:00',
  endTime: '14:30',
  notes: 'Bring questions about time management.',
}
const userId = '00000000-0000-4000-8000-000000000001'

describe('calendar planning', () => {
  it('accepts reminders with flexible time and requires times for scheduled items', () => {
    expect(
      calendarEntrySchema.safeParse({
        title: 'Review learning questions',
        kind: 'reminder',
        date: '2026-11-10',
        startTime: '',
        endTime: '',
        notes: '',
      }).success,
    ).toBe(true)
    expect(
      calendarEntrySchema.safeParse({ ...values, startTime: '' }).success,
    ).toBe(false)
    expect(
      calendarEntrySchema.safeParse({ ...values, endTime: '13:00' }).success,
    ).toBe(false)
    expect(
      calendarEntrySchema.safeParse({ ...values, date: '2026-02-30' }).success,
    ).toBe(false)
  })

  it('creates, edits, completes, and reopens an account-owned calendar entry', () => {
    const initial = createWorkspaceFixture()
    const created = saveCalendarEntry(
      initial,
      values,
      userId,
      'new-entry',
      false,
    )
    expect(
      created.plannerItems.find((item) => item.id === 'new-entry'),
    ).toMatchObject({
      userId,
      date: values.date,
      startTime: values.startTime,
    })
    const completed = completeCalendarEntry(created, 'new-entry', true)
    expect(
      completed.plannerItems.find((item) => item.id === 'new-entry')
        ?.completedAt,
    ).not.toBeNull()
    const reopened = completeCalendarEntry(completed, 'new-entry', false)
    expect(
      reopened.plannerItems.find((item) => item.id === 'new-entry')
        ?.completedAt,
    ).toBeNull()
    const edited = saveCalendarEntry(
      reopened,
      { ...values, title: 'Rescheduled check-in', date: '2026-11-11' },
      userId,
      'new-entry',
      true,
    )
    expect(
      edited.plannerItems.find((item) => item.id === 'new-entry'),
    ).toMatchObject({ title: 'Rescheduled check-in', date: '2026-11-11' })
  })

  it('moves linked notes with their calendar item and clears links on deletion', () => {
    const initial = createWorkspaceFixture()
    const movedDate = new Date()
    movedDate.setDate(movedDate.getDate() + 3)
    const date = localDate(movedDate)
    const entryDate = initial.plannerItems[0].date
    initial.reflections[0] = {
      ...initial.reflections[0],
      plannerItemId: 'calendar-entry-test',
      caseRecordId: 'case-record-test',
      entryDate,
    }
    initial.learningNotes[0] = {
      ...initial.learningNotes[0],
      plannerItemId: 'calendar-entry-test',
      caseRecordId: 'case-record-test',
      entryDate,
    }
    const moved = moveCalendarEntry(initial, 'calendar-entry-test', date)
    expect(moved.reflections[0]).toMatchObject({
      plannerItemId: 'calendar-entry-test',
      caseRecordId: 'case-record-test',
      entryDate: date,
    })
    expect(moved.learningNotes[0]).toMatchObject({
      plannerItemId: 'calendar-entry-test',
      caseRecordId: 'case-record-test',
      entryDate: date,
    })
    expect(moved.caseRecords[0]).toMatchObject({ entryDate: date })
    const deleted = deleteCalendarEntry(moved, 'calendar-entry-test')
    expect(deleted.reflections[0].plannerItemId).toBeNull()
    expect(deleted.learningNotes[0].plannerItemId).toBeNull()
    expect(deleted.reflections[0].entryDate).toBe(date)
  })
})
