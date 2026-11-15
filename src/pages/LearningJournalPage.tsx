import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { useWorkspace } from '@/data/useWorkspace'
import type { LearningNote, Reflection } from '@/data/models'
import { deleteLearningNote, deleteReflection } from '@/features/records/mutations'
import { formatDate } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'

type JournalEntry =
  | { kind: 'note'; value: LearningNote }
  | { kind: 'reflection'; value: Reflection }

export default function LearningJournalPage() {
  const { data, loading, error, reload, update } = useWorkspace()
  const navigate = useNavigate()
  const location = useLocation()
  const [deleting, setDeleting] = useState<JournalEntry | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  if (loading) return <LoadingState />
  if (error || !data)
    return (
      <ErrorState message={error ?? 'Workspace unavailable.'} retry={reload} />
    )

  if (location.pathname.endsWith('/new')) {
    return (
      <>
        <PageHeader
          eyebrow="Account · Personal learning"
          title="New journal entry"
          description="Choose the shape that fits this moment. You can keep it brief or use the guided prompts."
        />
        <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
          <button
            type="button"
            className="hover:border-primary rounded-xl border bg-white p-5 text-left transition-colors"
            onClick={() => navigate(`/learning-notes/new${location.search}`)}
          >
            <BookOpen aria-hidden="true" className="text-primary mb-4 size-6" />
            <h2 className="font-semibold">Quick learning note</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Save a topic, question, or follow-up without filling out a full reflection.
            </p>
          </button>
          <button
            type="button"
            className="hover:border-primary rounded-xl border bg-white p-5 text-left transition-colors"
            onClick={() => navigate(`/reflections/new${location.search}`)}
          >
            <NotebookPen aria-hidden="true" className="text-primary mb-4 size-6" />
            <h2 className="font-semibold">Guided reflection</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Use prompts to capture what went well, what felt difficult, and what to revisit.
            </p>
          </button>
        </div>
        <Button variant="outline" className="mt-5 h-11" onClick={() => navigate('/journal')}>
          Cancel
        </Button>
      </>
    )
  }

  const entries: JournalEntry[] = [
    ...data.learningNotes.map((value) => ({ kind: 'note' as const, value })),
    ...data.reflections.map((value) => ({
      kind: 'reflection' as const,
      value,
    })),
  ].sort((a, b) => {
    const aDate = a.kind === 'note' ? a.value.updatedAt : a.value.createdAt
    const bDate = b.kind === 'note' ? b.value.updatedAt : b.value.createdAt
    return bDate.localeCompare(aDate)
  })

  async function removeEntry() {
    if (!deleting) return
    setBusy(true)
    setActionError(null)
    try {
      await update((workspace) =>
        deleting.kind === 'note'
          ? deleteLearningNote(workspace, deleting.value.id)
          : deleteReflection(workspace, deleting.value.id),
      )
      toast.success('Journal entry deleted.')
      setDeleting(null)
    } catch (cause) {
      setActionError(`Cannot delete journal entry: ${errorMessage(cause)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account · Personal learning"
        title="Learning journal"
        description="Keep a note, capture a learning moment, or write down a question to revisit later."
        action={
          <Button className="h-11" onClick={() => navigate('/journal/new')}>
            <Plus aria-hidden="true" />
            New journal entry
          </Button>
        }
      />
      {actionError && (
        <div className="mb-5">
          <ErrorState message={actionError} />
        </div>
      )}
      <div className="grid max-w-3xl gap-5">
        {entries.length ? (
          entries.map((entry) => {
            const isNote = entry.kind === 'note'
            const title = isNote ? entry.value.topic : 'Learning reflection'
            const date = entry.value.entryDate
            return (
              <Card key={`${entry.kind}-${entry.value.id}`} className="shadow-none">
                <CardContent>
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {isNote ? (
                        <BookOpen aria-hidden="true" className="text-primary size-5" />
                      ) : (
                        <NotebookPen aria-hidden="true" className="text-primary size-5" />
                      )}
                      <div>
                        <h2 className="font-semibold">{title}</h2>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {isNote ? 'Note' : `Reflection · ${entry.value.confidence}/5`}
                      </Badge>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-11"
                        aria-label={`Edit ${isNote ? 'journal note' : 'reflection'}`}
                        asChild
                      >
                        <Link
                          to={
                            isNote
                              ? `/learning-notes/${entry.value.id}/edit`
                              : `/reflections/${entry.value.id}/edit`
                          }
                        >
                          <Pencil aria-hidden="true" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-11"
                        aria-label={`Delete ${isNote ? 'journal note' : 'reflection'}`}
                        onClick={() => {
                          setActionError(null)
                          setDeleting(entry)
                        }}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  {isNote ? (
                    <dl className="space-y-3 text-sm">
                      <div>
                        <dt className="text-primary font-semibold">Question</dt>
                        <dd className="text-muted-foreground mt-1 whitespace-pre-wrap">
                          {entry.value.question || 'No question added.'}
                        </dd>
                      </div>
                      {entry.value.followUp && (
                        <div>
                          <dt className="text-primary font-semibold">Follow-up</dt>
                          <dd className="text-muted-foreground mt-1 whitespace-pre-wrap">
                            {entry.value.followUp}
                          </dd>
                        </div>
                      )}
                    </dl>
                  ) : (
                    <dl className="space-y-3 text-sm">
                      <div>
                        <dt className="text-primary font-semibold">What went well</dt>
                        <dd className="text-muted-foreground mt-1 whitespace-pre-wrap">
                          {entry.value.wentWell}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-primary font-semibold">What was difficult</dt>
                        <dd className="text-muted-foreground mt-1 whitespace-pre-wrap">
                          {entry.value.difficult}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-primary font-semibold">Review later</dt>
                        <dd className="text-muted-foreground mt-1 whitespace-pre-wrap">
                          {entry.value.reviewLater}
                        </dd>
                      </div>
                    </dl>
                  )}
                </CardContent>
              </Card>
            )
          })
        ) : (
          <EmptyState
            title="Your journal is empty"
            description="Keep a note or capture a learning moment whenever it feels useful."
            action={
              <Button className="h-11" onClick={() => navigate('/journal/new')}>
                <Plus aria-hidden="true" />
                New journal entry
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
            <DialogTitle>Delete this journal entry?</DialogTitle>
            <DialogDescription>
              This removes the entry from your account.
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
              onClick={() => void removeEntry()}
            >
              {busy ? 'Deleting…' : 'Delete entry'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
