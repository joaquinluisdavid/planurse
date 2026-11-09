import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/Feedback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useWorkspace } from '@/data/useWorkspace'
import { useAuth } from '@/auth/useAuth'
import type { LearningNote } from '@/data/models'
import {
  deleteLearningNote,
  learningNoteFormSchema,
  saveLearningNote,
  type LearningNoteFormValues,
} from '@/features/records/mutations'
import { formatDate, formatDue, localDate } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'

function LearningNoteForm({
  initial,
  editing,
}: {
  initial: LearningNoteFormValues & { id?: string }
  editing: boolean
}) {
  const { data, update } = useWorkspace()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  if (!data) return null
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busyRef.current) return
    const result = learningNoteFormSchema.safeParse(values)
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        ),
      )
      return
    }
    busyRef.current = true
    setBusy(true)
    setSaveError(null)
    try {
      if (!user) throw new Error('Sign in before saving a learning note.')
      await update((workspace) =>
        saveLearningNote(
          workspace,
          result.data,
          user.id,
          initial.id ?? crypto.randomUUID(),
          editing,
        ),
      )
      navigate('/learning-notes')
    } catch (cause) {
      setSaveError(`Cannot save learning note: ${errorMessage(cause)}`)
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }
  return (
    <>
      <Link
        to="/learning-notes"
        className="text-primary mb-4 inline-flex min-h-11 items-center gap-2 text-sm hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Learning notes
      </Link>
      <PageHeader
        eyebrow="Account · Personal learning note"
        title={editing ? 'Edit learning note' : 'New learning note'}
        description="Keep a general topic, question, or reminder to discuss with your preceptor."
      />
      <form className="max-w-3xl space-y-5" onSubmit={submit} noValidate>
        <div className="space-y-2 rounded-xl border bg-white p-5">
          <Label htmlFor="learning-date">Date</Label>
          <input
            id="learning-date"
            type="date"
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-md border px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
            value={values.entryDate}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                entryDate: event.target.value,
                plannerItemId: '',
                caseRecordId: '',
              }))
            }
            aria-invalid={!!errors.entryDate}
            aria-describedby={
              errors.entryDate ? 'learning-date-error' : undefined
            }
            disabled={busy}
          />
          {errors.entryDate && (
            <p id="learning-date-error" className="text-destructive text-sm">
              {errors.entryDate}
            </p>
          )}
          <Label htmlFor="learning-calendar-item">
            Calendar entry (optional)
          </Label>
          <select
            id="learning-calendar-item"
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-md border px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
            value={values.plannerItemId}
            onChange={(event) => {
              const item = data.plannerItems.find(
                (entry) => entry.id === event.target.value,
              )
              setValues((current) => ({
                ...current,
                plannerItemId: event.target.value,
                ...(item ? { entryDate: item.date } : {}),
              }))
            }}
            disabled={busy}
          >
            <option value="">No linked calendar entry</option>
            {data.plannerItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.date} · {item.title}
              </option>
            ))}
          </select>
          <Label htmlFor="learning-case-record">Case handled (optional)</Label>
          <select
            id="learning-case-record"
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-md border px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
            value={values.caseRecordId}
            onChange={(event) => {
              const caseRecord = data.caseRecords.find(
                (entry) => entry.id === event.target.value,
              )
              setValues((current) => ({
                ...current,
                caseRecordId: event.target.value,
                ...(caseRecord ? { entryDate: caseRecord.entryDate } : {}),
              }))
            }}
            disabled={busy}
          >
            <option value="">No linked case entry</option>
            {data.caseRecords.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.entryDate} · {entry.category.replaceAll('-', ' ')}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">
            Save a note for any date. Optionally connect it to a case-handled
            category. Never include identifiable case details.
          </p>
        </div>
        {[
          [
            'topic',
            'Topic',
            'A general learning topic—avoid patient-specific details.',
          ],
          [
            'question',
            'Question to explore',
            'Optional. Bring clinical questions to a qualified preceptor or approved resource.',
          ],
          [
            'followUp',
            'Follow-up reminder',
            'Optional next step or check-in reminder.',
          ],
        ].map(([key, label, hint]) => (
          <div key={key} className="space-y-2 rounded-xl border bg-white p-5">
            <Label htmlFor={`learning-${key}`}>
              {label}
              {key !== 'topic' && (
                <span className="text-muted-foreground"> (optional)</span>
              )}
            </Label>
            <textarea
              id={`learning-${key}`}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
              value={values[key as keyof LearningNoteFormValues] as string}
              onChange={(event) => {
                setValues((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
                setErrors((current) => ({ ...current, [key]: '' }))
                setSaveError(null)
              }}
              maxLength={key === 'topic' ? 100 : 1000}
              aria-invalid={!!errors[key]}
              aria-describedby={
                errors[key] ? `learning-${key}-error` : `learning-${key}-hint`
              }
              disabled={busy}
            />
            <p
              id={`learning-${key}-hint`}
              className="text-muted-foreground text-xs"
            >
              {hint}
            </p>
            {errors[key] && (
              <p
                id={`learning-${key}-error`}
                className="text-destructive text-sm"
              >
                {errors[key]}
              </p>
            )}
          </div>
        ))}
        <p className="text-muted-foreground text-sm">
          Learning notes are saved to your account. Do not enter
          patient-identifying information. No clinical answers are generated.
        </p>
        {saveError && <ErrorState message={saveError} />}
        <div className="flex justify-end gap-3">
          <Button
            asChild
            type="button"
            variant="outline"
            className="h-11"
            disabled={busy}
          >
            <Link to="/learning-notes">Cancel</Link>
          </Button>
          <Button type="submit" className="h-11" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Save note'}
          </Button>
        </div>
      </form>
    </>
  )
}

export default function LearningNotesPage() {
  const { noteId } = useParams()
  const location = useLocation()
  const { data, loading, error, reload, update } = useWorkspace()
  const [deleting, setDeleting] = useState<LearningNote | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  if (loading) return <LoadingState />
  if (error || !data)
    return (
      <ErrorState message={error ?? 'Workspace unavailable.'} retry={reload} />
    )
  const note = data.learningNotes.find((item) => item.id === noteId)
  if (noteId && !note)
    return <ErrorState message="This learning note no longer exists." />
  if (noteId || location.pathname.endsWith('/new')) {
    const initial: LearningNoteFormValues & { id?: string } = note
      ? {
          id: note.id,
          shiftId: note.shiftId ?? '',
          plannerItemId: note.plannerItemId ?? '',
          caseRecordId: note.caseRecordId ?? '',
          entryDate: note.entryDate,
          topic: note.topic,
          question: note.question,
          followUp: note.followUp,
        }
      : {
          shiftId: '',
          plannerItemId:
            new URLSearchParams(location.search).get('plannerItemId') ?? '',
          caseRecordId:
            new URLSearchParams(location.search).get('caseRecordId') ?? '',
          entryDate:
            new URLSearchParams(location.search).get('date') ?? localDate(),
          topic: '',
          question: '',
          followUp: '',
        }
    return (
      <LearningNoteForm
        key={note?.id ?? 'new'}
        initial={initial}
        editing={!!note}
      />
    )
  }
  const sortedNotes = [...(data.learningNotes ?? [])].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  )
  return (
    <>
      <PageHeader
        eyebrow="Account · Personal notes"
        title="Learning notes"
        description="Collect general topics and questions to revisit with a preceptor. No clinical answers are generated."
        action={
          <Button asChild className="h-11">
            <Link to="/learning-notes/new">
              <Plus aria-hidden="true" />
              New note
            </Link>
          </Button>
        }
      />
      <p className="text-muted-foreground mb-5 max-w-3xl text-sm">
        Do not include patient-identifying information. Notes are account-linked
        but are not clinical records.
      </p>
      {actionError && (
        <div className="mb-5">
          <ErrorState message={actionError} />
        </div>
      )}
      <div className="grid gap-5">
        {sortedNotes.length ? (
          sortedNotes.map((item) => (
            <Card key={item.id} className="max-w-3xl shadow-none">
              <CardContent>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{item.topic}</h2>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatDate(item.entryDate)} · Updated{' '}
                      {formatDue(item.updatedAt)}
                    </p>
                    {item.caseRecordId && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Case handled:{' '}
                        {data.caseRecords
                          .find((entry) => entry.id === item.caseRecordId)
                          ?.category.replaceAll('-', ' ') ?? 'category'}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {item.shiftId && (
                      <Badge variant="secondary">
                        {data.shifts.find((shift) => shift.id === item.shiftId)
                          ?.type ?? 'Shift'}
                      </Badge>
                    )}
                    <Button asChild variant="outline" className="h-11">
                      <Link
                        to={`/learning-notes/${item.id}/edit`}
                        aria-label={`Edit ${item.topic}`}
                      >
                        <Pencil aria-hidden="true" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11"
                      aria-label={`Delete ${item.topic}`}
                      onClick={() => {
                        setActionError(null)
                        setDeleting(item)
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </div>
                {item.question && (
                  <div className="mb-4">
                    <h3 className="text-primary text-sm font-semibold">
                      Question to explore
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {item.question}
                    </p>
                  </div>
                )}
                {item.followUp && (
                  <div>
                    <h3 className="text-primary text-sm font-semibold">
                      Follow-up
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {item.followUp}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No learning notes yet"
            description="Save general topics, questions, and reminders to revisit during learning check-ins."
            action={
              <Button asChild className="h-11">
                <Link to="/learning-notes/new">
                  <Plus aria-hidden="true" />
                  Create a note
                </Link>
              </Button>
            }
          />
        )}
      </div>
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this learning note?</DialogTitle>
            <DialogDescription>
              This removes the note from your account.
            </DialogDescription>
          </DialogHeader>
          {actionError && <ErrorState message={actionError} />}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="h-11"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-11"
              disabled={busy}
              onClick={async () => {
                if (!deleting) return
                setBusy(true)
                try {
                  await update((workspace) =>
                    deleteLearningNote(workspace, deleting.id),
                  )
                  toast.success('Learning note deleted.')
                  setDeleting(null)
                } catch (cause) {
                  setActionError(
                    `Cannot delete learning note: ${errorMessage(cause)}`,
                  )
                } finally {
                  setBusy(false)
                }
              }}
            >
              {busy ? 'Deleting…' : 'Delete note'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
