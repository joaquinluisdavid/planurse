import { useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Plus, CheckCheck, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/Feedback'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useWorkspace } from '@/data/useWorkspace'
import type { Task, Workspace } from '@/data/models'
import { TaskForm } from '@/features/shifts/TaskForm'
import { TaskRow } from '@/features/shifts/TaskRow'
import { TaskFilterBar } from '@/features/shifts/TaskFilterBar'
import {
  filterTasks,
  defaultFilters,
  type TaskFilters,
} from '@/features/shifts/selectors'
import {
  completeTask,
  deleteTask,
  addRoom,
  endShift,
} from '@/features/shifts/mutations'
import { useNow } from '@/lib/useNow'
import { formatDate, formatTime } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'
import { roomSuffixSchema } from '@/features/shifts/schemas'
import { useDialogFocus } from '@/lib/useDialogFocus'

export default function ShiftRoute() {
  const { shiftId } = useParams()
  return <ShiftPage key={shiftId} />
}

function ShiftPage() {
  const { shiftId = '' } = useParams()
  const [search, setSearch] = useSearchParams()
  const { data, loading, error, reload, update } = useWorkspace()
  const now = useNow()
  const { rememberFocus, restoreFocus } = useDialogFocus()
  const [selectedFilters, setFilters] = useState<TaskFilters | null>(null)
  const [editor, setEditor] = useState<Task | 'new' | null>(() =>
    search.has('addTask') ? 'new' : null,
  )
  const [deleting, setDeleting] = useState<Task | null>(null)
  const [ending, setEnding] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [room, setRoom] = useState('')
  const [roomError, setRoomError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [actionError, setActionError] = useState<string | null>(null)
  function closeEditor() {
    setEditor(null)
    if (search.has('addTask')) {
      const next = new URLSearchParams(search)
      next.delete('addTask')
      setSearch(next, { replace: true })
    }
  }
  async function commit(
    change: (workspace: Workspace) => Workspace,
    success: string,
  ): Promise<boolean> {
    if (busyRef.current) return false
    busyRef.current = true
    setBusy(true)
    setActionError(null)
    try {
      await update(change)
      toast.success(success)
      return true
    } catch (cause) {
      setActionError(errorMessage(cause))
      return false
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }
  if (loading) return <LoadingState />
  if (error || !data)
    return (
      <ErrorState message={error ?? 'Workspace unavailable.'} retry={reload} />
    )
  const shift = data.shifts.find((shift) => shift.id === shiftId)
  if (!shift)
    return (
      <EmptyState
        title="Shift not found"
        description="This shift is not in your fictional workspace."
        action={
          <Button asChild>
            <Link to="/shifts">View shifts</Link>
          </Button>
        }
      />
    )
  const tasks = data.tasks.filter((task) => task.shiftId === shift.id)
  const active = tasks.filter((task) => !task.completedAt)
  const readOnly = !!shift.endedAt
  const filters = selectedFilters ?? {
    ...defaultFilters,
    completion: readOnly ? 'all' : defaultFilters.completion,
    due: search.get('due') === 'overdue' ? 'overdue' : 'all',
  }
  const visible = filterTasks(tasks, filters, now)
  return (
    <>
      <Link
        to="/shifts"
        className="text-primary mb-4 inline-flex min-h-11 items-center gap-2 text-sm hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All shifts
      </Link>
      <PageHeader
        eyebrow={formatDate(shift.date)}
        title={`${shift.type.charAt(0).toUpperCase() + shift.type.slice(1)} shift`}
        description={`Started ${formatTime(shift.startedAt)}${shift.endedAt ? ` · Ended ${formatTime(shift.endedAt)}` : ' · Keep your plan flexible.'}`}
        action={
          !readOnly && (
            <Button
              className="h-11"
              onClick={() => {
                rememberFocus()
                setActionError(null)
                setEditor('new')
              }}
              disabled={busy}
            >
              <Plus aria-hidden="true" />
              Add a task
            </Button>
          )
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">
            {readOnly ? 'Shift ended · Read-only' : 'In progress'}
          </Badge>
          <span className="text-muted-foreground text-sm">
            {active.length} {readOnly ? 'unfinished' : 'active'} ·{' '}
            {tasks.length - active.length} completed
          </span>
        </div>
        {!readOnly && (
          <Button
            variant="outline"
            className="h-11"
            disabled={busy}
            onClick={() => {
              rememberFocus()
              setActionError(null)
              setEnding(true)
              setAcknowledged(false)
            }}
          >
            <CheckCheck aria-hidden="true" />
            End shift
          </Button>
        )}
      </div>
      {readOnly && (
        <div className="bg-secondary mb-5 rounded-xl border p-4">
          <p className="text-sm font-semibold">
            Your shift is saved in history.
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Unfinished tasks remain unfinished. Reflection editing arrives in
            stage 8.
          </p>
          <Link
            to="/reflections"
            className="text-primary mt-2 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
          >
            View reflection samples
          </Link>
        </div>
      )}
      <section
        aria-label="Fictional rooms"
        className="mb-6 rounded-xl border bg-white p-4"
      >
        <h2 className="mb-3 text-sm font-semibold">Fictional rooms</h2>
        <div className="flex flex-wrap gap-2">
          {shift.patientLabels.length ? (
            shift.patientLabels.map((label) => (
              <Badge key={label} variant="outline">
                {label}
              </Badge>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              No rooms yet. Shift-wide tasks do not need a room.
            </p>
          )}
        </div>
        {!readOnly && (
          <form
            className="mt-4 flex flex-wrap items-end gap-3"
            onSubmit={async (event) => {
              event.preventDefault()
              setRoomError(null)
              const valid = roomSuffixSchema.safeParse(room)
              if (!valid.success) {
                setRoomError(valid.error.issues[0].message)
                return
              }
              if (
                await commit(
                  (workspace) => addRoom(workspace, shift.id, valid.data),
                  'Fictional room added.',
                )
              )
                setRoom('')
            }}
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="room-code">Add fictional room code</Label>
              <Input
                id="room-code"
                value={room}
                onChange={(event) => {
                  setRoom(event.target.value)
                  setRoomError(null)
                }}
                placeholder="e.g. D or 101"
                maxLength={12}
                aria-invalid={!!roomError}
                aria-describedby={
                  roomError ? 'room-help room-error' : 'room-help'
                }
                disabled={busy}
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="h-11"
              disabled={busy}
            >
              Add room
            </Button>
            <p id="room-help" className="text-muted-foreground w-full text-xs">
              Saved as “Demo room CODE.” Letters, numbers, and hyphens only.
              Never use names or identifying information.
            </p>
            {roomError && (
              <p
                id="room-error"
                role="alert"
                className="text-destructive text-sm"
              >
                {roomError}
              </p>
            )}
          </form>
        )}
      </section>
      {actionError && !ending && !deleting && (
        <div className="mb-5">
          <ErrorState message={actionError} />
        </div>
      )}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Your tasks</h2>
        <p role="status" className="text-muted-foreground text-xs">
          {visible.length} of {tasks.length} shown
        </p>
      </div>
      <TaskFilterBar
        filters={filters}
        labels={shift.patientLabels}
        onChange={setFilters}
      />
      {visible.length ? (
        <ul className="space-y-3">
          {visible.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              now={now}
              readOnly={readOnly}
              busy={busy}
              onEdit={() => {
                rememberFocus()
                setEditor(task)
              }}
              onDelete={() => {
                rememberFocus()
                setActionError(null)
                setDeleting(task)
              }}
              onComplete={(complete) => {
                void commit(
                  (workspace) =>
                    completeTask(workspace, shift.id, task.id, complete),
                  complete ? 'Task completed.' : 'Task reopened.',
                )
              }}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          title={
            tasks.length ? 'No tasks match these filters' : 'A clean slate'
          }
          description={
            tasks.length
              ? 'Try clearing filters to see your other tasks.'
              : 'Add a general workflow task to start organizing this shift.'
          }
          action={
            tasks.length ? (
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({
                    patient: 'all',
                    priority: 'all',
                    completion: 'all',
                    due: 'all',
                  })
                }
              >
                Clear filters
              </Button>
            ) : (
              !readOnly && (
                <Button
                  onClick={() => {
                    rememberFocus()
                    setEditor('new')
                  }}
                >
                  Add your first task
                </Button>
              )
            )
          }
        />
      )}
      {editor && !readOnly && (
        <TaskForm
          key={editor === 'new' ? 'new' : editor.id}
          shift={shift}
          task={editor === 'new' ? undefined : editor}
          close={closeEditor}
          restoreFocus={restoreFocus}
        />
      )}
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null)
        }}
      >
        <DialogContent onCloseAutoFocus={restoreFocus}>
          <DialogHeader>
            <DialogTitle>Delete this task?</DialogTitle>
            <DialogDescription>
              “{deleting?.title}” will be removed from this fictional shift.
              This cannot be undone.
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
                if (
                  deleting &&
                  (await commit(
                    (workspace) => deleteTask(workspace, shift.id, deleting.id),
                    'Task deleted.',
                  ))
                )
                  setDeleting(null)
              }}
            >
              {busy ? 'Deleting...' : 'Delete task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={ending}
        onOpenChange={(open) => {
          if (!busy) setEnding(open)
        }}
      >
        <DialogContent onCloseAutoFocus={restoreFocus}>
          <DialogHeader>
            <DialogTitle>End this shift?</DialogTitle>
            <DialogDescription>
              Your task list will become read-only and stay available in shift
              history. Ending a shift does not mark unfinished tasks complete.
            </DialogDescription>
          </DialogHeader>
          {active.length > 0 && (
            <label className="flex min-h-11 items-start gap-3 rounded-lg border p-4 text-sm">
              <Checkbox
                className="mt-0.5 size-5 shrink-0"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
              />
              <span>
                I understand that {active.length} unfinished task
                {active.length === 1 ? '' : 's'} will remain in history.
              </span>
            </label>
          )}
          {actionError && <ErrorState message={actionError} />}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="h-11"
              disabled={busy}
              onClick={() => setEnding(false)}
            >
              Keep planning
            </Button>
            <Button
              className="h-11"
              disabled={busy || (active.length > 0 && !acknowledged)}
              onClick={async () => {
                if (
                  await commit(
                    (workspace) => endShift(workspace, shift.id, acknowledged),
                    'Shift ended and saved to history.',
                  )
                ) {
                  setEnding(false)
                  setFilters({ ...defaultFilters, completion: 'all' })
                }
              }}
            >
              {busy ? 'Ending...' : 'End shift'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
