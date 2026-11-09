import { useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useWorkspace } from '@/data/useWorkspace'
import {
  handoffFormSchema,
  saveHandoff,
  type HandoffFormValues,
} from '@/features/records/mutations'
import { errorMessage } from '@/lib/errors'

const emptyValues: HandoffFormValues = {
  shiftId: '',
  patientLabel: '',
  situation: '',
  background: '',
  assessment: '',
  recommendation: '',
}

function HandoffForm({
  initial,
  editing,
}: {
  initial: HandoffFormValues & { id?: string }
  editing: boolean
}) {
  const { data, update } = useWorkspace()
  const navigate = useNavigate()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  if (!data) return null
  const availableShifts = data.shifts.filter((shift) => shift.patientLabels.length)
  const selectedShift = availableShifts.find((shift) => shift.id === values.shiftId)
  function updateField<K extends keyof HandoffFormValues>(
    key: K,
    value: HandoffFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
    setSaveError(null)
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busyRef.current) return
    const result = handoffFormSchema.safeParse(values)
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
      await update((workspace) =>
        saveHandoff(
          workspace,
          result.data,
          initial.id ?? crypto.randomUUID(),
          editing,
        ),
      )
      navigate('/handoffs')
    } catch (cause) {
      setSaveError(`Cannot save handoff draft: ${errorMessage(cause)}`)
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }
  return (
    <form className="max-w-3xl space-y-5" onSubmit={submit} noValidate>
      <div className="rounded-xl border bg-white p-5">
        <p className="mb-4 text-sm font-medium">Draft context</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="handoff-shift">Shift</Label>
            <select
              id="handoff-shift"
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-md border px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
              value={values.shiftId}
              onChange={(event) => {
                const nextShift = availableShifts.find(
                  (shift) => shift.id === event.target.value,
                )
                setValues((current) => ({
                  ...current,
                  shiftId: event.target.value,
                  patientLabel: nextShift?.patientLabels[0] ?? '',
                }))
                setErrors({})
              }}
              aria-invalid={!!errors.shiftId}
              aria-describedby={errors.shiftId ? 'handoff-shift-error' : undefined}
              disabled={busy}
            >
              <option value="">Choose a shift</option>
              {availableShifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.type} · {shift.date}
                  {shift.endedAt ? ' · ended' : ' · in progress'}
                </option>
              ))}
            </select>
            {errors.shiftId && (
              <p id="handoff-shift-error" className="text-destructive text-sm">
                {errors.shiftId}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="handoff-room">Room shorthand</Label>
            <select
              id="handoff-room"
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-md border px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
              value={values.patientLabel}
              onChange={(event) => updateField('patientLabel', event.target.value)}
              aria-invalid={!!errors.patientLabel}
              aria-describedby={errors.patientLabel ? 'handoff-room-error' : undefined}
              disabled={busy || !selectedShift}
            >
              <option value="">Choose a room</option>
              {selectedShift?.patientLabels.map((label) => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
            {errors.patientLabel && (
              <p id="handoff-room-error" className="text-destructive text-sm">
                {errors.patientLabel}
              </p>
            )}
          </div>
        </div>
        {!availableShifts.length && (
          <p className="text-muted-foreground mt-3 text-sm">
            Add room shorthand to a shift before creating a handoff draft.
          </p>
        )}
      </div>
      <div className="grid gap-4">
        {[
          ['situation', 'Situation', 'Short, non-identifying context for your preparation outline.'],
          ['background', 'Background', 'General workflow context only.'],
          ['assessment', 'Assessment', 'Organization notes, not clinical assessment.'],
          ['recommendation', 'Recommendation', 'A question or reminder to review with your preceptor.'],
        ].map(([key, label, hint]) => (
          <div key={key} className="space-y-2 rounded-xl border bg-white p-5">
            <Label htmlFor={`handoff-${key}`}>{label}</Label>
            <textarea
              id={`handoff-${key}`}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
              value={values[key as keyof HandoffFormValues] as string}
              onChange={(event) => updateField(key as keyof HandoffFormValues, event.target.value)}
              maxLength={2000}
              aria-invalid={!!errors[key]}
              aria-describedby={errors[key] ? `handoff-${key}-error` : `handoff-${key}-hint`}
              disabled={busy}
            />
            <p id={`handoff-${key}-hint`} className="text-muted-foreground text-xs">{hint} Do not include patient-identifying information.</p>
            {errors[key] && <p id={`handoff-${key}-error`} className="text-destructive text-sm">{errors[key]}</p>}
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">Preparation aid only—not an official medical record or clinical guidance. Never enter patient-identifying information.</p>
      {saveError && <ErrorState message={saveError} />}
      <div className="flex flex-wrap justify-end gap-3">
        <Button asChild type="button" variant="outline" className="h-11" disabled={busy}>
          <Link to="/handoffs">Cancel</Link>
        </Button>
        <Button type="submit" className="h-11" disabled={busy || !availableShifts.length}>
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Save draft'}
        </Button>
      </div>
    </form>
  )
}

export default function HandoffEditorPage() {
  const { handoffId } = useParams()
  const [search] = useSearchParams()
  const { data, loading, error, reload } = useWorkspace()
  if (loading) return <LoadingState />
  if (error || !data)
    return <ErrorState message={error ?? 'Workspace unavailable.'} retry={reload} />
  const handoff = data.handoffs.find((item) => item.id === handoffId)
  if (handoffId && !handoff)
    return <ErrorState message="This handoff draft no longer exists." />
  const shift = data.shifts.find(
    (item) => item.id === (handoff?.shiftId ?? search.get('shiftId')),
  ) ?? data.shifts.find((item) => !item.endedAt && item.patientLabels.length)
    ?? data.shifts.find((item) => item.patientLabels.length)
  const initial: HandoffFormValues & { id?: string } = handoff
    ? {
        id: handoff.id,
        shiftId: handoff.shiftId,
        patientLabel: handoff.patientLabel,
        situation: handoff.situation,
        background: handoff.background,
        assessment: handoff.assessment,
        recommendation: handoff.recommendation,
      }
    : { ...emptyValues, shiftId: shift?.id ?? '', patientLabel: shift?.patientLabels[0] ?? '' }
  return (
    <>
      <Link to="/handoffs" className="text-primary mb-4 inline-flex min-h-11 items-center gap-2 text-sm hover:underline">
        <ArrowLeft aria-hidden="true" className="size-4" /> Handoff drafts
      </Link>
      <PageHeader
        eyebrow="Account · Personal draft"
        title={handoff ? 'Edit handoff draft' : 'New handoff draft'}
        description="Organize a personal preparation outline using the SBAR headings."
      />
      <HandoffForm key={handoff?.id ?? 'new'} initial={initial} editing={!!handoff} />
    </>
  )
}
