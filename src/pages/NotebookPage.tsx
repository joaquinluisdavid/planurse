import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Eraser,
  Pencil,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/Feedback'
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
import type { NotebookEntry } from '@/data/models'
import {
  deleteNotebookEntry,
  notebookEntryFormSchema,
  saveNotebookEntry,
  type NotebookEntryFormValues,
} from '@/features/records/mutations'
import { formatDate, localDate } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'

function NotebookCanvas({
  value,
  onChange,
  disabled,
}: {
  value: string | null
  onChange: (value: string | null) => void
  disabled: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const beforeStroke = useRef<ImageData | null>(null)
  const undoStack = useRef<ImageData[]>([])
  const redoStack = useRef<ImageData[]>([])
  const [hasUndo, setHasUndo] = useState(false)
  const [hasRedo, setHasRedo] = useState(false)
  const [color, setColor] = useState('#111827')
  const [size, setSize] = useState(4)
  const [erasing, setErasing] = useState(false)
  const initialized = useRef(false)
  const [ready, setReady] = useState(!value)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || initialized.current) return
    initialized.current = true
    const image = new Image()
    image.onload = () => {
      const context = canvas.getContext('2d')
      if (!context) return
      context.clearRect(0, 0, canvas.width, canvas.height)
      if (value) {
        const isPreviousFullscreenPage =
          image.naturalWidth === 720 && image.naturalHeight === 1100
        if (isPreviousFullscreenPage) {
          const scale = canvas.width / image.naturalWidth
          context.drawImage(
            image,
            0,
            0,
            image.naturalWidth * scale,
            image.naturalHeight * scale,
          )
        } else {
          context.drawImage(image, 0, 0)
        }
      }
      setReady(true)
    }
    if (!value) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
      return
    }
    image.src = value
  }, [value])
  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const bounds = canvas.getBoundingClientRect()
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    }
  }
  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled || !ready) return
    const position = point(event)
    const context = canvasRef.current?.getContext('2d')
    if (!position || !context) return
    drawing.current = true
    const canvas = canvasRef.current
    if (!canvas) return
    beforeStroke.current = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    )
    event.currentTarget.setPointerCapture(event.pointerId)
    context.globalCompositeOperation = erasing
      ? 'destination-out'
      : 'source-over'
    context.globalAlpha = 1
    context.strokeStyle = color
    context.lineWidth = erasing ? Math.max(size * 4, 24) : size
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.beginPath()
    context.moveTo(position.x, position.y)
  }
  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const position = point(event)
    const context = canvasRef.current?.getContext('2d')
    if (!position || !context) return
    context.lineTo(position.x, position.y)
    context.stroke()
  }
  function end() {
    if (!drawing.current) return
    drawing.current = false
    if (beforeStroke.current) undoStack.current.push(beforeStroke.current)
    redoStack.current = []
    beforeStroke.current = null
    setHasUndo(undoStack.current.length > 0)
    setHasRedo(false)
    onChange(canvasRef.current?.toDataURL('image/png') ?? null)
  }
  function restore(snapshot: ImageData) {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    context.globalCompositeOperation = 'source-over'
    context.putImageData(snapshot, 0, 0)
    onChange(canvas.toDataURL('image/png'))
  }
  function undo() {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    const previous = undoStack.current.pop()
    const current =
      context && canvas
        ? context.getImageData(0, 0, canvas.width, canvas.height)
        : null
    if (!previous || !current) return
    redoStack.current.push(current)
    restore(previous)
    setHasUndo(undoStack.current.length > 0)
    setHasRedo(true)
  }
  function redo() {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    const next = redoStack.current.pop()
    const current =
      context && canvas
        ? context.getImageData(0, 0, canvas.width, canvas.height)
        : null
    if (!next || !current) return
    undoStack.current.push(current)
    restore(next)
    setHasUndo(true)
    setHasRedo(redoStack.current.length > 0)
  }
  function clearPage() {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const current = context.getImageData(0, 0, canvas.width, canvas.height)
    undoStack.current.push(current)
    redoStack.current = []
    context.globalCompositeOperation = 'source-over'
    context.clearRect(0, 0, canvas.width, canvas.height)
    onChange(null)
    setHasUndo(true)
    setHasRedo(false)
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label htmlFor="notebook-canvas">Handwritten notes</Label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1" aria-label="Pen color">
            {[
              '#111827',
              '#2563eb',
              '#dc2626',
              '#16a34a',
              '#ca8a04',
              '#7c3aed',
            ].map((swatch) => (
              <button
                key={swatch}
                type="button"
                className={`size-7 rounded-full border-2 ${color === swatch && !erasing ? 'border-foreground ring-ring ring-2 ring-offset-1' : 'border-white'}`}
                style={{ backgroundColor: swatch }}
                aria-label={`Use ${swatch} pen`}
                aria-pressed={color === swatch && !erasing}
                onClick={() => {
                  setColor(swatch)
                  setErasing(false)
                }}
                disabled={disabled}
              />
            ))}
            <label
              className="border-input flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border"
              title="Custom pen color"
            >
              <input
                type="color"
                value={color}
                onChange={(event) => {
                  setColor(event.target.value)
                  setErasing(false)
                }}
                className="size-9 cursor-pointer border-0 p-0"
                aria-label="Choose custom pen color"
                disabled={disabled}
              />
            </label>
          </div>
          <details className="relative" aria-label="Pen size">
            <summary className="border-input bg-background flex h-8 list-none cursor-pointer items-center gap-2 rounded-md border px-2 font-sans text-xs font-medium marker:hidden">
              Stroke
              <span
                className="bg-foreground block w-7 rounded-full"
                style={{ height: `${size}px` }}
              />
            </summary>
            <div className="border-input bg-popover absolute top-10 right-0 z-20 min-w-32 rounded-md border p-1 shadow-md">
              {[2, 4, 6, 8, 12, 18].map((penSize) => (
                <button
                  key={penSize}
                  type="button"
                  className={`flex h-9 w-full items-center justify-center rounded-md ${size === penSize ? 'bg-secondary' : 'hover:bg-secondary/70'}`}
                  aria-label={`Use ${penSize} pixel pen stroke`}
                  aria-pressed={size === penSize}
                  onClick={(event) => {
                    setSize(penSize)
                    const menu = event.currentTarget.closest('details')
                    if (menu) menu.open = false
                  }}
                  disabled={disabled}
                >
                  <span
                    className="bg-foreground block w-7 rounded-full"
                    style={{ height: `${penSize}px` }}
                  />
                </button>
              ))}
            </div>
          </details>
          <Button
            type="button"
            variant={erasing ? 'default' : 'outline'}
            size="sm"
            onClick={() => setErasing((current) => !current)}
            disabled={disabled}
            aria-pressed={erasing}
          >
            <Eraser aria-hidden="true" />
            Eraser
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={disabled || !hasUndo}
          >
            <Undo2 aria-hidden="true" />
            Undo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={disabled || !hasRedo}
          >
            <Redo2 aria-hidden="true" />
            Redo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearPage}
            disabled={disabled}
          >
            <X aria-hidden="true" />
            Clear page
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        Write anything you want to remember on this page.
      </p>
      <canvas
        ref={canvasRef}
        id="notebook-canvas"
        width={1200}
        height={2000}
        className="bg-background aspect-[1200/2000] h-auto w-full touch-none rounded-md border bg-[linear-gradient(#dbe7ee_1px,transparent_1px)] bg-size-[100%_32px]"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        aria-label="Handwritten notebook canvas"
      />
    </div>
  )
}

function NotebookEditor({
  initial,
  editing,
}: {
  initial: NotebookEntryFormValues & { id?: string }
  editing: boolean
}) {
  const { data, update } = useWorkspace()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (!data) return null
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = notebookEntryFormSchema.safeParse(values)
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
    if (!user) return
    setBusy(true)
    setSaveError(null)
    try {
      await update((workspace) =>
        saveNotebookEntry(
          workspace,
          result.data,
          user.id,
          initial.id ?? crypto.randomUUID(),
          editing,
        ),
      )
      toast.success(editing ? 'Notebook page updated.' : 'Notebook page saved.')
      navigate('/notebook')
    } catch (cause) {
      setSaveError(`Cannot save notebook page: ${errorMessage(cause)}`)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Link
        to="/notebook"
        className="text-primary mb-4 inline-flex min-h-11 items-center text-sm underline"
      >
        Notebook
      </Link>
      <PageHeader
        eyebrow="Personal notebook"
        title={editing ? 'Edit page' : 'New page'}
        description="Write freely or use the page for handwriting. There is no required reflection format."
      />
      <form className="max-w-3xl space-y-5" onSubmit={submit} noValidate>
        <Card className="shadow-none">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notebook-title">Page title</Label>
              <input
                id="notebook-title"
                className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
                value={values.title}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                disabled={busy}
              />
              {errors.title && (
                <p className="text-destructive text-sm">{errors.title}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="notebook-date">Date</Label>
                <input
                  id="notebook-date"
                  type="date"
                  className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
                  value={values.entryDate}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      entryDate: event.target.value,
                    }))
                  }
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notebook-calendar">Calendar entry</Label>
                <select
                  id="notebook-calendar"
                  className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
                  value={values.plannerItemId}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      plannerItemId: event.target.value,
                    }))
                  }
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="notebook-content">Text notes</Label>
              <textarea
                id="notebook-content"
                className="border-input min-h-48 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                placeholder="What is on your mind today, or what would you like to remember?"
                value={values.content}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                disabled={busy}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent>
            <NotebookCanvas
              value={values.drawingData}
              onChange={(drawingData) =>
                setValues((current) => ({ ...current, drawingData }))
              }
              disabled={busy}
            />
          </CardContent>
        </Card>
        {saveError && <ErrorState message={saveError} />}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => navigate('/notebook')}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" className="h-11" disabled={busy}>
            {busy ? 'Saving…' : 'Save page'}
          </Button>
        </div>
      </form>
    </>
  )
}

export default function NotebookPage() {
  const { entryId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { data, loading, error, reload, update } = useWorkspace()
  const [deleting, setDeleting] = useState<NotebookEntry | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  if (loading) return <LoadingState />
  if (error || !data)
    return (
      <ErrorState message={error ?? 'Workspace unavailable.'} retry={reload} />
    )
  const entry = data.notebookEntries.find((item) => item.id === entryId)
  if (entryId && !entry)
    return <ErrorState message="This notebook page no longer exists." />
  if (entryId || location.pathname.endsWith('/new')) {
    const initial = entry
      ? {
          id: entry.id,
          plannerItemId: entry.plannerItemId ?? '',
          entryDate: entry.entryDate,
          title: entry.title,
          content: entry.content,
          drawingData: entry.drawingData,
        }
      : {
          plannerItemId:
            new URLSearchParams(location.search).get('plannerItemId') ?? '',
          entryDate:
            new URLSearchParams(location.search).get('date') ?? localDate(),
          title: '',
          content: '',
          drawingData: null,
        }
    return (
      <NotebookEditor
        key={entry?.id ?? 'new'}
        initial={initial}
        editing={!!entry}
      />
    )
  }
  const entries = [...data.notebookEntries].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  )
  async function removeEntry() {
    if (!deleting) return
    setBusy(true)
    try {
      await update((workspace) => deleteNotebookEntry(workspace, deleting.id))
      setDeleting(null)
      toast.success('Notebook page deleted.')
    } catch (cause) {
      setActionError(`Cannot delete notebook page: ${errorMessage(cause)}`)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="Account · Personal notes"
        title="Notebook"
        description="A quiet place to write, sketch, and keep useful thoughts."
        action={
          <Button className="h-11" onClick={() => navigate('/notebook/new')}>
            <Plus aria-hidden="true" /> New page
          </Button>
        }
      />
      {actionError && (
        <div className="mb-5">
          <ErrorState message={actionError} />
        </div>
      )}
      {entries.length ? (
        <div className="grid max-w-3xl gap-5">
          {entries.map((item) => (
            <Card key={item.id} className="shadow-none">
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{item.title}</h2>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatDate(item.entryDate)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="icon"
                      className="size-11"
                      aria-label="Edit notebook page"
                    >
                      <Link to={`/notebook/${item.id}/edit`}>
                        <Pencil aria-hidden="true" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-11"
                      aria-label="Delete notebook page"
                      onClick={() => setDeleting(item)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                {item.content && (
                  <p className="text-muted-foreground mt-4 text-sm whitespace-pre-wrap">
                    {item.content}
                  </p>
                )}
                {item.drawingData && (
                  <img
                    src={item.drawingData}
                    alt="Handwritten notebook page"
                    className="mt-4 w-full rounded-md border"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Your notebook is empty"
          description="Start with a blank page. Type, draw, or do both."
          action={
            <Button className="h-11" onClick={() => navigate('/notebook/new')}>
              <Plus aria-hidden="true" /> New page
            </Button>
          }
        />
      )}
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this notebook page?</DialogTitle>
            <DialogDescription>
              This removes the page from your account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="h-11"
              onClick={() => setDeleting(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-11"
              onClick={() => void removeEntry()}
              disabled={busy}
            >
              {busy ? 'Deleting…' : 'Delete page'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
