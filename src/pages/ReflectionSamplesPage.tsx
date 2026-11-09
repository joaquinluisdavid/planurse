import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { LoadingState, ErrorState, EmptyState } from '@/components/Feedback'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useWorkspace } from '@/data/useWorkspace'
import { formatDate } from '@/lib/dates'
import type { Reflection } from '@/data/models'
import { deleteReflection } from '@/features/records/mutations'
import { errorMessage } from '@/lib/errors'

export default function ReflectionSamplesPage() {
  const { data, loading, error, reload, update } = useWorkspace()
  const [deleting, setDeleting] = useState<Reflection | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  if (loading) return <LoadingState />
  if (error || !data)
    return (
      <ErrorState message={error ?? 'Workspace unavailable.'} retry={reload} />
    )
  return (
    <>
      <PageHeader
        eyebrow="Account · Personal reflections"
        title="Reflections"
        description="A place to notice your progress, build learning questions, and prepare for a preceptor check-in."
        action={
          <Button asChild className="h-11">
            <Link to="/reflections/new">
              <Plus aria-hidden="true" />
              New reflection
            </Link>
          </Button>
        }
      />
      <p className="text-muted-foreground mb-5 max-w-3xl text-sm">
        Do not include patient-identifying information. Reflections are not
        clinical records or advice.
      </p>
      {actionError && (
        <div className="mb-5">
          <ErrorState message={actionError} />
        </div>
      )}
      <div className="grid gap-5">
        {data.reflections.length ? (
          [...data.reflections]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((reflection) => (
              <Card key={reflection.id} className="max-w-3xl shadow-none">
                <CardContent>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold">
                        {formatDate(reflection.entryDate)}
                      </h2>
                      <Badge variant="secondary">
                        Confidence {reflection.confidence}/5
                      </Badge>
                    </div>
                    <div className="flex gap-2 print:hidden">
                      <Button asChild variant="outline" className="h-11">
                        <Link
                          to={`/reflections/${reflection.id}/edit`}
                          aria-label="Edit reflection"
                        >
                          <Pencil aria-hidden="true" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11"
                        aria-label="Delete reflection"
                        onClick={() => {
                          setActionError(null)
                          setDeleting(reflection)
                        }}
                      >
                        <Trash2 aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  <dl className="space-y-5">
                    {[
                      { label: 'What went well', content: reflection.wentWell },
                      {
                        label: 'What was difficult',
                        content: reflection.difficult,
                      },
                      {
                        label: 'What to review later',
                        content: reflection.reviewLater,
                      },
                    ].map((section) => (
                      <div key={section.label}>
                        <dt className="text-primary text-sm font-semibold">
                          {section.label}
                        </dt>
                        <dd className="text-muted-foreground mt-1 text-sm leading-relaxed">
                          {section.content}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="text-muted-foreground mt-5 text-xs">
                    {reflection.caseRecordId
                      ? `Case handled: ${data.caseRecords.find((entry) => entry.id === reflection.caseRecordId)?.category.replaceAll('-', ' ') ?? 'category'} · `
                      : ''}
                    {reflection.plannerItemId
                      ? `Calendar: ${data.plannerItems.find((item) => item.id === reflection.plannerItemId)?.title ?? 'entry'} · `
                      : ''}
                    {reflection.shiftId
                      ? `Shift: ${data.shifts.find((shift) => shift.id === reflection.shiftId)?.type ?? 'shift'} · `
                      : ''}
                    Personal learning reflection.
                  </p>
                </CardContent>
              </Card>
            ))
        ) : (
          <EmptyState
            title="No reflections yet"
            description="After a shift, capture a learning moment and a question to revisit."
            action={
              <Button asChild className="h-11">
                <Link to="/reflections/new">
                  <Plus aria-hidden="true" />
                  Create a reflection
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
            <DialogTitle>Delete this reflection?</DialogTitle>
            <DialogDescription>
              This removes the reflection from your account.
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
                    deleteReflection(workspace, deleting.id),
                  )
                  toast.success('Reflection deleted.')
                  setDeleting(null)
                } catch (cause) {
                  setActionError(
                    `Cannot delete reflection: ${errorMessage(cause)}`,
                  )
                } finally {
                  setBusy(false)
                }
              }}
            >
              {busy ? 'Deleting…' : 'Delete reflection'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
