import { workspaceSchema, type Workspace } from './models'
import type { WorkspaceRepository } from './repository'
import { supabase } from '@/lib/supabase'

function requireClient() {
  if (!supabase)
    throw new Error('Cloud storage is not configured. Add the Supabase URL and publishable key, then reload.')
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
    const { data, error } = await client.from(table).select('*').eq('user_id', userId)
    assertNoError(error)
    return (data ?? []) as Record<string, unknown>[]
  }
  const load = async (): Promise<Workspace> => {
    const [shifts, tasks, handoffs, reflections, learningNotes] = await Promise.all([
      readTable('shifts'),
      readTable('tasks'),
      readTable('handoffs'),
      readTable('reflections'),
      readTable('learning_notes'),
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
      handoffs: handoffs.map((row) => ({
        id: row.id,
        userId: row.user_id,
        shiftId: row.shift_id,
        patientLabel: row.patient_label,
        situation: row.situation,
        background: row.background,
        assessment: row.assessment,
        recommendation: row.recommendation,
        updatedAt: row.updated_at,
      })),
      reflections: reflections.map((row) => ({
        id: row.id,
        userId: row.user_id,
        shiftId: row.shift_id,
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
        topic: row.topic,
        question: row.question,
        followUp: row.follow_up,
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
        const { error } = await client.from(table).delete().eq('user_id', userId).eq('id', String(id))
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
      await syncTable('tasks', current.tasks, next.tasks, (record) => record, 'delete')
      await syncTable('handoffs', current.handoffs, next.handoffs, (record) => record, 'delete')
      await syncTable('reflections', current.reflections, next.reflections, (record) => record, 'delete')
      await syncTable('learning_notes', current.learningNotes, next.learningNotes, (record) => record, 'delete')
      await syncTable('shifts', current.shifts, next.shifts, (record) => ({
        id: record.id,
        type: record.type,
        date: record.date,
        started_at: record.startedAt,
        ended_at: record.endedAt,
        patient_labels: record.patientLabels,
      }))
      await syncTable('tasks', current.tasks, next.tasks, (record) => ({
        id: record.id,
        shift_id: record.shiftId,
        title: record.title,
        patient_label: record.patientLabel,
        priority: record.priority,
        due_at: record.dueAt,
        completed_at: record.completedAt,
        created_at: record.createdAt,
      }), 'upsert')
      await syncTable('handoffs', current.handoffs, next.handoffs, (record) => ({
        id: record.id,
        shift_id: record.shiftId,
        patient_label: record.patientLabel,
        situation: record.situation,
        background: record.background,
        assessment: record.assessment,
        recommendation: record.recommendation,
        updated_at: record.updatedAt,
      }), 'upsert')
      await syncTable('reflections', current.reflections, next.reflections, (record) => ({
        id: record.id,
        shift_id: record.shiftId,
        went_well: record.wentWell,
        difficult: record.difficult,
        review_later: record.reviewLater,
        confidence: record.confidence,
        created_at: record.createdAt,
      }), 'upsert')
      await syncTable('learning_notes', current.learningNotes, next.learningNotes, (record) => ({
        id: record.id,
        shift_id: record.shiftId,
        topic: record.topic,
        question: record.question,
        follow_up: record.followUp,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      }), 'upsert')
      return load()
    },
  }
}
