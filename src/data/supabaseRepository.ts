import { workspaceSchema, type Workspace } from './models'
import type { WorkspaceRepository } from './repository'
import { supabase } from '@/lib/supabase'

function requireClient() {
  if (!supabase)
    throw new Error(
      'Cloud storage is not configured. Add the Supabase URL and publishable key, then reload.',
    )
  return supabase
}

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

function same(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function createSupabaseRepository(userId: string): WorkspaceRepository {
  const client = requireClient()
  const readTable = async (table: string) => {
    const { data, error } = await client
      .from(table)
      .select('*')
      .eq('user_id', userId)
    assertNoError(error)
    return (data ?? []) as Record<string, unknown>[]
  }
  const load = async (): Promise<Workspace> => {
    const [
      shifts,
      tasks,
      reflections,
      learningNotes,
      plannerItems,
      caseRecords,
    ] = await Promise.all([
      readTable('shifts'),
      readTable('tasks'),
      readTable('reflections'),
      readTable('learning_notes'),
      readTable('planner_items'),
      readTable('case_records'),
    ])
    return workspaceSchema.parse({
      version: 1,
      shifts: shifts.map((row) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        date: row.date,
        startedAt: row.started_at,
        endedAt: row.ended_at,
        patientLabels: row.patient_labels,
      })),
      tasks: tasks.map((row) => ({
        id: row.id,
        userId: row.user_id,
        shiftId: row.shift_id,
        title: row.title,
        patientLabel: row.patient_label,
        priority: row.priority,
        dueAt: row.due_at,
        completedAt: row.completed_at,
        createdAt: row.created_at,
      })),
      reflections: reflections.map((row) => ({
        id: row.id,
        userId: row.user_id,
        shiftId: row.shift_id,
        plannerItemId: row.planner_item_id,
        caseRecordId: row.case_record_id,
        entryDate: row.entry_date,
        wentWell: row.went_well,
        difficult: row.difficult,
        reviewLater: row.review_later,
        confidence: row.confidence,
        createdAt: row.created_at,
      })),
      learningNotes: learningNotes.map((row) => ({
        id: row.id,
        userId: row.user_id,
        shiftId: row.shift_id,
        plannerItemId: row.planner_item_id,
        caseRecordId: row.case_record_id,
        entryDate: row.entry_date,
        topic: row.topic,
        question: row.question,
        followUp: row.follow_up,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      plannerItems: plannerItems.map((row) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        kind: row.kind,
        date: row.date,
        startTime: row.start_time ? String(row.start_time).slice(0, 5) : null,
        endTime: row.end_time ? String(row.end_time).slice(0, 5) : null,
        notes: row.notes,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      caseRecords: caseRecords.map((row) => ({
        id: row.id,
        userId: row.user_id,
        plannerItemId: row.planner_item_id,
        entryDate: row.entry_date,
        category: row.category,
        learningTakeaway: row.learning_takeaway,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    })
  }

  const syncTable = async (
    table: string,
    before: Record<string, unknown>[],
    after: Record<string, unknown>[],
    encode: (record: Record<string, unknown>) => Record<string, unknown>,
    phase: 'all' | 'delete' | 'upsert' = 'all',
  ) => {
    const oldById = new Map(before.map((record) => [record.id, record]))
    const newById = new Map(after.map((record) => [record.id, record]))
    const removed = [...oldById.keys()].filter((id) => !newById.has(id))
    const changed = after.filter((record) => {
      const previous = oldById.get(record.id)
      return !previous || !same(previous, record)
    })
    if (phase !== 'upsert') {
      for (const id of removed) {
        const { error } = await client
          .from(table)
          .delete()
          .eq('user_id', userId)
          .eq('id', String(id))
        assertNoError(error)
      }
    }
    if (phase !== 'delete' && changed.length) {
      const { error } = await client.from(table).upsert(
        changed.map((record) => ({ ...encode(record), user_id: userId })),
        { onConflict: 'id' },
      )
      assertNoError(error)
    }
  }

  return {
    load,
    async update(change) {
      const current = await load()
      const next = workspaceSchema.parse(change(structuredClone(current)))
      // Persist only changed rows, never the entire client snapshot. Parent rows are
      // written before children; children are removed before shifts for FK safety.
      await syncTable(
        'tasks',
        current.tasks,
        next.tasks,
        (record) => record,
        'delete',
      )
      await syncTable(
        'reflections',
        current.reflections,
        next.reflections,
        (record) => record,
        'delete',
      )
      await syncTable(
        'learning_notes',
        current.learningNotes,
        next.learningNotes,
        (record) => record,
        'delete',
      )
      await syncTable(
        'planner_items',
        current.plannerItems,
        next.plannerItems,
        (record) => record,
        'delete',
      )
      await syncTable(
        'case_records',
        current.caseRecords,
        next.caseRecords,
        (record) => record,
        'delete',
      )
      await syncTable('shifts', current.shifts, next.shifts, (record) => ({
        id: record.id,
        type: record.type,
        date: record.date,
        started_at: record.startedAt,
        ended_at: record.endedAt,
        patient_labels: record.patientLabels,
      }))
      await syncTable(
        'tasks',
        current.tasks,
        next.tasks,
        (record) => ({
          id: record.id,
          shift_id: record.shiftId,
          title: record.title,
          patient_label: record.patientLabel,
          priority: record.priority,
          due_at: record.dueAt,
          completed_at: record.completedAt,
          created_at: record.createdAt,
        }),
        'upsert',
      )
      await syncTable(
        'planner_items',
        current.plannerItems,
        next.plannerItems,
        (record) => ({
          id: record.id,
          title: record.title,
          kind: record.kind,
          date: record.date,
          start_time: record.startTime,
          end_time: record.endTime,
          notes: record.notes,
          completed_at: record.completedAt,
          created_at: record.createdAt,
          updated_at: record.updatedAt,
        }),
        'upsert',
      )
      await syncTable(
        'case_records',
        current.caseRecords,
        next.caseRecords,
        (record) => ({
          id: record.id,
          planner_item_id: record.plannerItemId,
          entry_date: record.entryDate,
          category: record.category,
          learning_takeaway: record.learningTakeaway,
          created_at: record.createdAt,
          updated_at: record.updatedAt,
        }),
        'upsert',
      )
      await syncTable(
        'reflections',
        current.reflections,
        next.reflections,
        (record) => ({
          id: record.id,
          shift_id: record.shiftId,
          planner_item_id: record.plannerItemId,
          case_record_id: record.caseRecordId,
          entry_date: record.entryDate,
          went_well: record.wentWell,
          difficult: record.difficult,
          review_later: record.reviewLater,
          confidence: record.confidence,
          created_at: record.createdAt,
        }),
        'upsert',
      )
      await syncTable(
        'learning_notes',
        current.learningNotes,
        next.learningNotes,
        (record) => ({
          id: record.id,
          shift_id: record.shiftId,
          planner_item_id: record.plannerItemId,
          case_record_id: record.caseRecordId,
          entry_date: record.entryDate,
          topic: record.topic,
          question: record.question,
          follow_up: record.followUp,
          created_at: record.createdAt,
          updated_at: record.updatedAt,
        }),
        'upsert',
      )
      return load()
    },
  }
}
