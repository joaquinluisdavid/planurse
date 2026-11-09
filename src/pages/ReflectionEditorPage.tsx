import { useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useWorkspace } from '@/data/useWorkspace'
import { useAuth } from '@/auth/useAuth'
import {
  reflectionFormSchema,
  saveReflection,
  type ReflectionFormValues,
} from '@/features/records/mutations'
import { errorMessage } from '@/lib/errors'
import { localDate } from '@/lib/dates'

function ReflectionForm({
  initial,
  editing,
}: {
  initial: ReflectionFormValues & { id?: string }
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
    const result = reflectionFormSchema.safeParse(values)
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
      if (!user) throw new Error('Sign in before saving a reflection.')
      await update((workspace) =>
        saveReflection(
          workspace,
          result.data,
          user.id,
          initial.id ?? crypto.randomUUID(),
          editing,
        ),
      )
      navigate('/reflections')
    } catch (cause) {
      setSaveError(`Cannot save reflection: ${errorMessage(cause)}`)
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }
  return (
    <form className="max-w-3xl space-y-5" onSubmit={submit} noValidate>
      <div className="space-y-2 rounded-xl border bg-white p-5">
        <Label htmlFor="reflection-date">Date</Label>
        <input
          id="reflection-date"
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
            errors.entryDate ? 'reflection-date-error' : undefined
          }
          disabled={busy}
        />
        {errors.entryDate && (
          <p id="reflection-date-error" className="text-destructive text-sm">
            {errors.entryDate}
          </p>
        )}
        <Label htmlFor="reflection-calendar-item">
          Calendar entry (optional)
        </Label>
        <select
          id="reflection-calendar-item"
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
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
        <Label htmlFor="reflection-case-record">Case handled (optional)</Label>
        <select
          id="reflection-case-record"
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
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
          A shift does not need to be created or started to write a reflection.
          Use a case category, not patient details.
        </p>
      </div>
      {[
        [
          'wentWell',
          'What went well?',
          'Notice a process, habit, or learning moment.',
        ],
        [
          'difficult',
          'What felt difficult?',
          'Focus on your experience, not patient details.',
        ],
        [
          'reviewLater',
          'What would you like to review later?',
          'Write a question to discuss with a preceptor or approved learning resource.',
        ],
      ].map(([key, label, hint]) => (
        <div key={key} className="space-y-2 rounded-xl border bg-white p-5">
          <Label htmlFor={`reflection-${key}`}>{label}</Label>
          <textarea
            id={`reflection-${key}`}
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
            value={values[key as keyof ReflectionFormValues] as string}
            onChange={(event) => {
              setValues((current) => ({
                ...current,
                [key]: event.target.value,
              }))
              setErrors((current) => ({ ...current, [key]: '' }))
              setSaveError(null)
            }}
            maxLength={2000}
            aria-invalid={!!errors[key]}
            aria-describedby={
              errors[key] ? `reflection-${key}-error` : `reflection-${key}-hint`
            }
            disabled={busy}
          />
          <p
            id={`reflection-${key}-hint`}
            className="text-muted-foreground text-xs"
          >
            {hint} Do not include patient-identifying information.
          </p>
          {errors[key] && (
            <p
              id={`reflection-${key}-error`}
              className="text-destructive text-sm"
            >
              {errors[key]}
            </p>
          )}
        </div>
      ))}
      <div className="space-y-2 rounded-xl border bg-white p-5">
        <Label htmlFor="reflection-confidence">
          How confident did you feel?
        </Label>
        <select
          id="reflection-confidence"
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-md border px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
          value={values.confidence}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              confidence: Number(event.target.value),
            }))
          }
          disabled={busy}
        >
          {[1, 2, 3, 4, 5].map((score) => (
            <option key={score} value={score}>
              {score} of 5
            </option>
          ))}
        </select>
      </div>
      <p className="text-muted-foreground text-sm">
        Saved to your account. Do not include patient details. This is not a
        clinical record or advice.
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
          <Link to="/reflections">Cancel</Link>
        </Button>
        <Button type="submit" className="h-11" disabled={busy}>
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Save reflection'}
        </Button>
      </div>
    </form>
  )
}

export default function ReflectionEditorPage() {
  const { reflectionId } = useParams()
  const [search] = useSearchParams()
  const { data, loading, error, reload } = useWorkspace()
  if (loading) return <LoadingState />
  if (error || !data)
    return (
      <ErrorState message={error ?? 'Workspace unavailable.'} retry={reload} />
    )
  const reflection = data.reflections.find((item) => item.id === reflectionId)
  if (reflectionId && !reflection)
    return <ErrorState message="This reflection no longer exists." />
  const initial: ReflectionFormValues & { id?: string } = reflection
    ? {
        id: reflection.id,
        shiftId: reflection.shiftId ?? '',
        plannerItemId: reflection.plannerItemId ?? '',
        caseRecordId: reflection.caseRecordId ?? '',
        entryDate: reflection.entryDate,
        wentWell: reflection.wentWell,
        difficult: reflection.difficult,
        reviewLater: reflection.reviewLater,
        confidence: reflection.confidence,
      }
    : {
        shiftId: search.get('shiftId') ?? '',
        plannerItemId: search.get('plannerItemId') ?? '',
        caseRecordId: search.get('caseRecordId') ?? '',
        entryDate: search.get('date') ?? localDate(),
        wentWell: '',
        difficult: '',
        reviewLater: '',
        confidence: 3,
      }
  return (
    <>
      <Link
        to="/reflections"
        className="text-primary mb-4 inline-flex min-h-11 items-center gap-2 text-sm hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Reflections
      </Link>
      <PageHeader
        eyebrow="Account · Personal reflection"
        title={reflection ? 'Edit reflection' : 'New reflection'}
        description="A gentle space to notice your learning and prepare questions for your next check-in."
      />
      <ReflectionForm
        key={reflection?.id ?? 'new'}
        initial={initial}
        editing={!!reflection}
      />
    </>
  )
}
