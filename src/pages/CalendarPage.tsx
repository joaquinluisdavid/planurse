import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  BriefcaseBusiness,
  GripVertical,
  ListTodo,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/auth/useAuth'
import { useWorkspace } from '@/data/useWorkspace'
import type { PlannerItem } from '@/data/models'
import type { CaseRecord } from '@/data/models'
import {
  completeCalendarEntry,
  deleteCalendarEntry,
  moveCalendarEntry,
  saveCalendarEntry,
  calendarEntrySchema,
  type CalendarEntryValues,
} from '@/features/calendar/mutations'
import {
  caseRecordFormSchema,
  deleteCaseRecord,
  saveCaseRecord,
  type CaseRecordFormValues,
} from '@/features/records/mutations'
import { formatDate, localDate } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'

const blankEntry: CalendarEntryValues = {
  title: '',
  kind: 'reminder',
  date: localDate(),
  startTime: '',
  endTime: '',
  notes: '',
}
const caseCategories = [
  { value: 'care-coordination', label: 'Care coordination' },
  { value: 'patient-education', label: 'Patient education' },
  { value: 'admission-discharge', label: 'Admission or discharge workflow' },
  { value: 'team-communication', label: 'Team communication' },
  { value: 'clinical-skills-practice', label: 'Clinical skills practice' },
  { value: 'other-learning', label: 'Other learning experience' },
] as const
const blankCase: CaseRecordFormValues = {
  plannerItemId: '',
  entryDate: localDate(),
  category: 'other-learning',
  learningTakeaway: '',
}
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const monthLabel = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  year: 'numeric',
})
const timeLabel = (time: string | null) =>
  time
    ? new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(`2000-01-01T${time}`))
    : ''

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1)
}
function calendarCells(date: Date) {
  const first = monthStart(date)
  const start = new Date(first)
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7))
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

export default function CalendarPage() {
  const { data, loading, error, reload, update } = useWorkspace()
  const { user } = useAuth()
  const today = localDate()
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(new Date()))
  const [selectedDate, setSelectedDate] = useState(today)
  const [editor, setEditor] = useState<PlannerItem | 'new' | null>(null)
  const [values, setValues] = useState<CalendarEntryValues>(blankEntry)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [dragged, setDragged] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PlannerItem | null>(null)
  const [caseEditor, setCaseEditor] = useState<CaseRecord | 'new' | null>(null)
  const [caseValues, setCaseValues] = useState<CaseRecordFormValues>(blankCase)
  const [caseError, setCaseError] = useState<string | null>(null)
  const [deleteCaseTarget, setDeleteCaseTarget] = useState<CaseRecord | null>(
    null,
  )
  const [actionError, setActionError] = useState<string | null>(null)

  const cells = useMemo(() => calendarCells(visibleMonth), [visibleMonth])
  if (loading) return <LoadingState />
  if (error || !data)
    return (
      <ErrorState message={error ?? 'Workspace unavailable.'} retry={reload} />
    )
  const items = data.plannerItems ?? []
  const selectedItems = items
    .filter((item) => item.date === selectedDate)
    .sort(
      (a, b) =>
        (a.startTime ?? '').localeCompare(b.startTime ?? '') ||
        a.title.localeCompare(b.title),
    )
  const selectedReflections = data.reflections.filter(
    (entry) => entry.entryDate === selectedDate,
  )
  const selectedNotes = data.learningNotes.filter(
    (entry) => entry.entryDate === selectedDate,
  )
  const selectedCases = data.caseRecords.filter(
    (entry) => entry.entryDate === selectedDate,
  )

  function openNew(date = selectedDate) {
    setValues({ ...blankEntry, date })
    setErrors({})
    setSaveError(null)
    setEditor('new')
  }
  function openEdit(item: PlannerItem) {
    setValues({
      title: item.title,
      kind: item.kind,
      date: item.date,
      startTime: item.startTime ?? '',
      endTime: item.endTime ?? '',
      notes: item.notes,
    })
    setErrors({})
    setSaveError(null)
    setEditor(item)
  }
  function openNewCase(date = selectedDate, plannerItemId = '') {
    setCaseValues({ ...blankCase, entryDate: date, plannerItemId })
    setCaseError(null)
    setCaseEditor('new')
  }
  function openEditCase(entry: CaseRecord) {
    setCaseValues({
      plannerItemId: entry.plannerItemId ?? '',
      entryDate: entry.entryDate,
      category: entry.category,
      learningTakeaway: entry.learningTakeaway,
    })
    setCaseError(null)
    setCaseEditor(entry)
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || busy) return
    const result = calendarEntrySchema.safeParse(values)
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
    const editing = editor !== 'new' && editor !== null
    const id = editing ? editor.id : crypto.randomUUID()
    setBusy(true)
    setSaveError(null)
    try {
      await update((workspace) =>
        saveCalendarEntry(workspace, result.data, user.id, id, editing),
      )
      setSelectedDate(result.data.date)
      setEditor(null)
      toast.success(
        editing ? 'Calendar entry updated.' : 'Calendar entry added.',
      )
    } catch (cause) {
      setSaveError(`Cannot save calendar entry: ${errorMessage(cause)}`)
    } finally {
      setBusy(false)
    }
  }
  async function moveItem(itemId: string, date: string) {
    try {
      await update((workspace) => moveCalendarEntry(workspace, itemId, date))
      setSelectedDate(date)
      toast.success('Calendar entry moved.')
    } catch (cause) {
      setActionError(`Cannot move calendar entry: ${errorMessage(cause)}`)
    }
  }
  async function submitCase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || busy) return
    const result = caseRecordFormSchema.safeParse(caseValues)
    if (!result.success) {
      setCaseError(
        result.error.issues[0]?.message ?? 'Check the entry and try again.',
      )
      return
    }
    const editing = caseEditor !== 'new' && caseEditor !== null
    const id = editing ? caseEditor.id : crypto.randomUUID()
    setBusy(true)
    setCaseError(null)
    try {
      await update((workspace) =>
        saveCaseRecord(workspace, result.data, user.id, id, editing),
      )
      setSelectedDate(result.data.entryDate)
      setCaseEditor(null)
      toast.success(
        editing ? 'Case-handled entry updated.' : 'Case-handled entry saved.',
      )
    } catch (cause) {
      setCaseError(`Cannot save case-handled entry: ${errorMessage(cause)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Plan ahead · Capture when convenient"
        title="Calendar & reminders"
        description="Add a schedule item or reminder whenever it suits you—no shift start required. Keep personal notes and reflections attached to a date or calendar item."
        action={
          <Button className="h-11" onClick={() => openNew()}>
            <Plus aria-hidden="true" />
            Add entry
          </Button>
        }
      />
      {actionError && (
        <div className="mb-5">
          <ErrorState message={actionError} />
        </div>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.8fr)]">
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">
                  {monthLabel.format(visibleMonth)}
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Drag an entry to another day to reschedule it.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={() => {
                    setVisibleMonth(monthStart(new Date()))
                    setSelectedDate(today)
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-label="Previous month"
                  onClick={() =>
                    setVisibleMonth((month) => addMonths(month, -1))
                  }
                >
                  <ChevronLeft aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-label="Next month"
                  onClick={() =>
                    setVisibleMonth((month) => addMonths(month, 1))
                  }
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div
              className="grid grid-cols-7 border-t border-l"
              role="grid"
              aria-label={monthLabel.format(visibleMonth)}
            >
              {weekDays.map((day) => (
                <div
                  key={day}
                  role="columnheader"
                  className="bg-muted border-r border-b px-1 py-2 text-center text-xs font-semibold sm:px-2"
                >
                  {day}
                </div>
              ))}
              {cells.map((date) => {
                const key = localDate(date)
                const dayItems = items.filter((item) => item.date === key)
                const recordCount =
                  data.learningNotes.filter((entry) => entry.entryDate === key)
                    .length +
                  data.reflections.filter((entry) => entry.entryDate === key)
                    .length +
                  data.caseRecords.filter((entry) => entry.entryDate === key)
                    .length
                const inMonth = date.getMonth() === visibleMonth.getMonth()
                return (
                  <div
                    key={key}
                    role="gridcell"
                    aria-label={`Calendar day ${formatDate(key)}`}
                    aria-selected={selectedDate === key}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      if (dragged) void moveItem(dragged, key)
                      setDragged(null)
                    }}
                    className={`min-h-24 border-r border-b p-1 transition-colors sm:min-h-28 sm:p-2 ${inMonth ? 'bg-white' : 'bg-muted/40'} ${selectedDate === key ? 'ring-primary relative z-10 ring-2 ring-inset' : ''}`}
                  >
                    <button
                      type="button"
                      className={`flex size-8 items-center justify-center rounded-full text-sm ${key === today ? 'bg-primary text-primary-foreground font-semibold' : ''} ${!inMonth ? 'text-muted-foreground' : ''}`}
                      aria-label={`Select ${formatDate(key)}`}
                      aria-pressed={selectedDate === key}
                      onClick={() => {
                        setSelectedDate(key)
                        if (!inMonth) setVisibleMonth(monthStart(date))
                      }}
                    >
                      {date.getDate()}
                    </button>
                    <div className="mt-1 space-y-1">
                      {dayItems.slice(0, 3).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          draggable
                          onDragStart={() => setDragged(item.id)}
                          onDragEnd={() => setDragged(null)}
                          onClick={() => {
                            setSelectedDate(key)
                            openEdit(item)
                          }}
                          className={`w-full truncate rounded px-1 py-1 text-left text-[10px] sm:text-xs ${item.kind === 'schedule' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'} ${item.completedAt ? 'line-through opacity-60' : ''}`}
                          title={`${item.startTime ? `${timeLabel(item.startTime)} ` : ''}${item.title}`}
                          aria-label={`${item.startTime ? `${timeLabel(item.startTime)} ` : ''}${item.title} on ${formatDate(key)}. Select to edit; drag to reschedule.`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <GripVertical
                              aria-hidden="true"
                              className="size-3 shrink-0"
                            />
                            {item.startTime && (
                              <span>{timeLabel(item.startTime)}</span>
                            )}
                            {item.title}
                          </span>
                        </button>
                      ))}
                      {dayItems.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setSelectedDate(key)}
                          className="text-muted-foreground px-1 text-[10px] underline"
                        >
                          +{dayItems.length - 3} more
                        </button>
                      )}
                      {recordCount > 0 && (
                        <p className="text-muted-foreground px-1 text-[9px] sm:text-[10px]">
                          {recordCount} note/reflection
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-primary text-xs font-semibold tracking-widest uppercase">
                  Selected day
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  {formatDate(selectedDate)}
                </h2>
              </div>
              <Button
                variant="outline"
                className="h-11"
                onClick={() => openNew(selectedDate)}
              >
                <Plus aria-hidden="true" />
                Add
              </Button>
            </div>
            {selectedItems.length ? (
              <ul className="space-y-3">
                {selectedItems.map((item) => (
                  <li
                    key={item.id}
                    draggable
                    onDragStart={() => setDragged(item.id)}
                    className="rounded-xl border p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 rounded-lg p-2 ${item.kind === 'schedule' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}
                      >
                        {item.kind === 'schedule' ? (
                          <CalendarDays aria-hidden="true" className="size-4" />
                        ) : (
                          <ListTodo aria-hidden="true" className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3
                          className={`font-medium ${item.completedAt ? 'text-muted-foreground line-through' : ''}`}
                        >
                          {item.title}
                        </h3>
                        {item.startTime && (
                          <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                            <Clock3 aria-hidden="true" className="size-3" />
                            {timeLabel(item.startTime)}
                            {item.endTime ? `–${timeLabel(item.endTime)}` : ''}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          item.kind === 'schedule' ? 'default' : 'secondary'
                        }
                      >
                        {item.kind === 'schedule' ? 'Scheduled' : 'Reminder'}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-11"
                        onClick={async () => {
                          try {
                            await update((workspace) =>
                              completeCalendarEntry(
                                workspace,
                                item.id,
                                !item.completedAt,
                              ),
                            )
                            toast.success(
                              item.completedAt
                                ? 'Reminder reopened.'
                                : 'Reminder completed.',
                            )
                          } catch (cause) {
                            setActionError(errorMessage(cause))
                          }
                        }}
                      >
                        {item.completedAt ? 'Reopen' : 'Complete'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-11"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-11"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 aria-hidden="true" />
                        Delete
                      </Button>
                      <Link
                        to={`/learning-notes/new?date=${item.date}&plannerItemId=${item.id}`}
                        className="text-primary inline-flex min-h-11 items-center rounded-md px-3 text-sm underline"
                      >
                        Add learning note
                      </Link>
                      <Link
                        to={`/reflections/new?date=${item.date}&plannerItemId=${item.id}`}
                        className="text-primary inline-flex min-h-11 items-center rounded-md px-3 text-sm underline"
                      >
                        Add reflection
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Nothing on this day"
                description="Add a schedule item or a simple reminder—there is no shift log to start."
                action={
                  <Button
                    className="h-11"
                    onClick={() => openNew(selectedDate)}
                  >
                    <Plus aria-hidden="true" />
                    Add entry
                  </Button>
                }
              />
            )}
            <section
              aria-labelledby="calendar-notes-heading"
              className="mt-6 border-t pt-5"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 id="calendar-notes-heading" className="font-semibold">
                  Learning notes
                </h3>
                <Link
                  to={`/learning-notes/new?date=${selectedDate}`}
                  className="text-primary text-sm underline"
                >
                  Add note
                </Link>
              </div>
              {selectedNotes.length ? (
                <ul className="space-y-2">
                  {selectedNotes.map((note) => (
                    <li
                      key={note.id}
                      className="bg-secondary/60 rounded-lg p-3"
                    >
                      <Link
                        to={`/learning-notes/${note.id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {note.topic}
                      </Link>
                      {note.question && (
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                          {note.question}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No learning notes for this date.
                </p>
              )}
              <div className="mt-5 mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold">Reflections</h3>
                <Link
                  to={`/reflections/new?date=${selectedDate}`}
                  className="text-primary text-sm underline"
                >
                  Add reflection
                </Link>
              </div>
              {selectedReflections.length ? (
                <ul className="space-y-2">
                  {selectedReflections.map((reflection) => (
                    <li
                      key={reflection.id}
                      className="bg-secondary/60 rounded-lg p-3"
                    >
                      <Link
                        to={`/reflections/${reflection.id}/edit`}
                        className="font-medium hover:underline"
                      >
                        Personal reflection · Confidence {reflection.confidence}
                        /5
                      </Link>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                        {reflection.wentWell}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No reflections for this date.
                </p>
              )}
              <div className="mt-5 border-t pt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <BriefcaseBusiness
                      aria-hidden="true"
                      className="text-primary size-4"
                    />
                    Cases handled
                  </h3>
                  <Button
                    variant="outline"
                    className="min-h-11"
                    onClick={() => openNewCase(selectedDate)}
                  >
                    <Plus aria-hidden="true" />
                    Log case handled
                  </Button>
                </div>
                <p className="text-muted-foreground mb-3 text-xs">
                  Broad categories only; no patient or case-identifying details.
                </p>
                {selectedCases.length ? (
                  <ul className="space-y-2">
                    {selectedCases.map((caseRecord) => (
                      <li
                        key={caseRecord.id}
                        className="bg-secondary/60 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              {caseCategories.find(
                                (category) =>
                                  category.value === caseRecord.category,
                              )?.label ?? 'Learning experience'}
                            </p>
                            {caseRecord.learningTakeaway && (
                              <p className="text-muted-foreground mt-1 text-sm">
                                {caseRecord.learningTakeaway}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-11"
                              aria-label="Edit case-handled entry"
                              onClick={() => openEditCase(caseRecord)}
                            >
                              <Pencil aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-11"
                              aria-label="Delete case-handled entry"
                              onClick={() => setDeleteCaseTarget(caseRecord)}
                            >
                              <Trash2 aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3">
                          <Link
                            to={`/learning-notes/new?date=${caseRecord.entryDate}&caseRecordId=${caseRecord.id}`}
                            className="text-primary inline-flex min-h-11 items-center text-sm underline"
                          >
                            Add learning note
                          </Link>
                          <Link
                            to={`/reflections/new?date=${caseRecord.entryDate}&caseRecordId=${caseRecord.id}`}
                            className="text-primary inline-flex min-h-11 items-center text-sm underline"
                          >
                            Add reflection
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No cases logged for this date.
                  </p>
                )}
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setEditor(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editor === 'new' ? 'Add to calendar' : 'Edit calendar entry'}
            </DialogTitle>
            <DialogDescription>
              Schedule an upcoming responsibility or save a reminder. No shift
              needs to be started.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="calendar-title">Title</Label>
              <Input
                id="calendar-title"
                autoFocus
                value={values.title}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                maxLength={120}
                aria-invalid={!!errors.title}
                aria-describedby={
                  errors.title ? 'calendar-title-error' : undefined
                }
                disabled={busy}
              />
              {errors.title && (
                <p
                  id="calendar-title-error"
                  className="text-destructive text-sm"
                >
                  {errors.title}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="calendar-kind">Entry type</Label>
                <select
                  id="calendar-kind"
                  className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
                  value={values.kind}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      kind: event.target.value as CalendarEntryValues['kind'],
                    }))
                  }
                  disabled={busy}
                >
                  <option value="reminder">Reminder / to-do</option>
                  <option value="schedule">Scheduled responsibility</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="calendar-date">Date</Label>
                <Input
                  id="calendar-date"
                  type="date"
                  value={values.date}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                  aria-invalid={!!errors.date}
                  aria-describedby={
                    errors.date ? 'calendar-date-error' : undefined
                  }
                  disabled={busy}
                />
                {errors.date && (
                  <p
                    id="calendar-date-error"
                    className="text-destructive text-sm"
                  >
                    {errors.date}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="calendar-start">
                  Start time {values.kind === 'reminder' && '(optional)'}
                </Label>
                <Input
                  id="calendar-start"
                  type="time"
                  value={values.startTime}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                  aria-invalid={!!errors.startTime}
                  aria-describedby={
                    errors.startTime ? 'calendar-start-error' : undefined
                  }
                  disabled={busy}
                />
                {errors.startTime && (
                  <p
                    id="calendar-start-error"
                    className="text-destructive text-sm"
                  >
                    {errors.startTime}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="calendar-end">End time (optional)</Label>
                <Input
                  id="calendar-end"
                  type="time"
                  value={values.endTime}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }
                  aria-invalid={!!errors.endTime}
                  aria-describedby={
                    errors.endTime ? 'calendar-end-error' : undefined
                  }
                  disabled={busy}
                />
                {errors.endTime && (
                  <p
                    id="calendar-end-error"
                    className="text-destructive text-sm"
                  >
                    {errors.endTime}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="calendar-notes">Notes (optional)</Label>
              <textarea
                id="calendar-notes"
                className="border-input focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
                value={values.notes}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                maxLength={2000}
                disabled={busy}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Use general, non-identifying reminders only. Do not put patient
              names, diagnoses, or record details in calendar entries.
            </p>
            {saveError && <ErrorState message={saveError} />}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={busy}
                onClick={() => setEditor(null)}
              >
                Cancel
              </Button>
              <Button type="submit" className="h-11" disabled={busy}>
                {busy
                  ? 'Saving…'
                  : editor === 'new'
                    ? 'Add entry'
                    : 'Save changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete calendar entry?</DialogTitle>
            <DialogDescription>
              Linked notes and reflections remain saved, but their calendar link
              will be cleared.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="h-11"
              disabled={busy}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-11"
              disabled={busy}
              onClick={async () => {
                if (!deleteTarget) return
                setBusy(true)
                try {
                  await update((workspace) =>
                    deleteCalendarEntry(workspace, deleteTarget.id),
                  )
                  toast.success('Calendar entry deleted.')
                  setDeleteTarget(null)
                } catch (cause) {
                  setActionError(errorMessage(cause))
                } finally {
                  setBusy(false)
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={caseEditor !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setCaseEditor(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {caseEditor === 'new'
                ? 'Log case handled'
                : 'Edit case-handled entry'}
            </DialogTitle>
            <DialogDescription>
              Track a broad work category and general learning takeaway. This is
              not a patient list. Never add patient or uniquely identifying case
              details.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitCase} noValidate>
            <div className="space-y-2">
              <Label htmlFor="case-entry-date">Date</Label>
              <Input
                id="case-entry-date"
                type="date"
                value={caseValues.entryDate}
                onChange={(event) =>
                  setCaseValues((current) => ({
                    ...current,
                    entryDate: event.target.value,
                    plannerItemId: '',
                  }))
                }
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="case-entry-category">General case category</Label>
              <select
                id="case-entry-category"
                className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
                value={caseValues.category}
                onChange={(event) =>
                  setCaseValues((current) => ({
                    ...current,
                    category: event.target
                      .value as CaseRecordFormValues['category'],
                  }))
                }
                disabled={busy}
              >
                {caseCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="case-entry-calendar">
                Calendar entry (optional)
              </Label>
              <select
                id="case-entry-calendar"
                className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
                value={caseValues.plannerItemId}
                onChange={(event) => {
                  const item = data.plannerItems.find(
                    (entry) => entry.id === event.target.value,
                  )
                  setCaseValues((current) => ({
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="case-entry-takeaway">
                General learning takeaway (optional)
              </Label>
              <textarea
                id="case-entry-takeaway"
                className="border-input focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
                value={caseValues.learningTakeaway}
                onChange={(event) =>
                  setCaseValues((current) => ({
                    ...current,
                    learningTakeaway: event.target.value,
                  }))
                }
                maxLength={1000}
                disabled={busy}
              />
              <p className="text-muted-foreground text-xs">
                Use general learning language only—no patient demographics,
                diagnoses, identifiers, room numbers, or unique details.
              </p>
            </div>
            {caseError && <ErrorState message={caseError} />}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={busy}
                onClick={() => setCaseEditor(null)}
              >
                Cancel
              </Button>
              <Button type="submit" className="h-11" disabled={busy}>
                {busy
                  ? 'Saving…'
                  : caseEditor === 'new'
                    ? 'Save entry'
                    : 'Save changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleteCaseTarget}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleteCaseTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this case-handled entry?</DialogTitle>
            <DialogDescription>
              Linked notes and reflections remain saved, with the case link
              cleared.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="h-11"
              disabled={busy}
              onClick={() => setDeleteCaseTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-11"
              disabled={busy}
              onClick={async () => {
                if (!deleteCaseTarget) return
                setBusy(true)
                try {
                  await update((workspace) =>
                    deleteCaseRecord(workspace, deleteCaseTarget.id),
                  )
                  toast.success('Case-handled entry deleted.')
                  setDeleteCaseTarget(null)
                } catch (cause) {
                  setActionError(errorMessage(cause))
                } finally {
                  setBusy(false)
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
