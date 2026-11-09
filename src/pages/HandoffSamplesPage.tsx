import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clipboard, Pencil, Plus, Printer, Trash2 } from 'lucide-react'
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
import { formatDue } from '@/lib/dates'
import { deleteHandoff } from '@/features/records/mutations'
import type { Handoff } from '@/data/models'
import { errorMessage } from '@/lib/errors'

export default function HandoffSamplesPage() {
  const { data, loading, error, reload, update } = useWorkspace()
  const [deleting, setDeleting] = useState<Handoff | null>(null)
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
        eyebrow="Account · Personal drafts"
        title="Handoff drafts"
        description="Organize personal SBAR preparation outlines. These are not official medical records or clinical guidance."
        action={
          <Button asChild className="h-11">
            <Link to="/handoffs/new"><Plus aria-hidden="true" />New draft</Link>
          </Button>
        }
      />
      {actionError && <div className="mb-5"><ErrorState message={actionError} /></div>}
      <div className="grid gap-5">
        {data.handoffs.length ? (
          data.handoffs.map((handoff) => (
            <Card key={handoff.id} className="max-w-3xl shadow-none">
              <CardContent>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold">{handoff.patientLabel}</h2>
                    <Badge variant="secondary">Preparation aid</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 print:hidden">
                    <Button asChild variant="outline" size="sm" className="min-h-11">
                      <Link to={`/handoffs/${handoff.id}/edit`} aria-label={`Edit handoff draft for ${handoff.patientLabel}`}><Pencil aria-hidden="true" />Edit</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="min-h-11" onClick={async () => {
                      const text = [
                        `${handoff.patientLabel} · Handoff preparation aid`,
                        `Situation: ${handoff.situation}`,
                        `Background: ${handoff.background}`,
                        `Assessment: ${handoff.assessment}`,
                        `Recommendation: ${handoff.recommendation}`,
                        'Not an official medical record or clinical guidance.',
                      ].join('\n\n')
                      try {
                        await navigator.clipboard.writeText(text)
                        toast.success('Draft copied.')
                      } catch {
                        toast.error('Clipboard access is unavailable in this browser.')
                      }
                    }}><Clipboard aria-hidden="true" />Copy</Button>
                    <Button variant="outline" size="sm" className="min-h-11" onClick={() => window.print()}><Printer aria-hidden="true" />Print</Button>
                    <Button variant="outline" size="sm" className="min-h-11" onClick={() => { setActionError(null); setDeleting(handoff) }} aria-label={`Delete handoff draft for ${handoff.patientLabel}`}><Trash2 aria-hidden="true" />Delete</Button>
                  </div>
                </div>
                <dl className="space-y-5">
                  {[
                    { label: 'Situation', content: handoff.situation },
                    { label: 'Background', content: handoff.background },
                    { label: 'Assessment', content: handoff.assessment },
                    {
                      label: 'Recommendation',
                      content: handoff.recommendation,
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
                  Updated {formatDue(handoff.updatedAt)}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No handoff drafts yet"
            description="Create a personal preparation outline to organize what you want to discuss with a preceptor."
            action={<Button asChild className="h-11"><Link to="/handoffs/new"><Plus aria-hidden="true" />Create a draft</Link></Button>}
          />
        )}
      </div>
      <Dialog open={!!deleting} onOpenChange={(open) => { if (!open && !busy) setDeleting(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this handoff draft?</DialogTitle>
            <DialogDescription>This removes the draft from your account. This cannot be undone.</DialogDescription>
          </DialogHeader>
          {actionError && <ErrorState message={actionError} />}
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="h-11" disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" className="h-11" disabled={busy} onClick={async () => {
              if (!deleting) return
              setBusy(true)
              try {
                await update((workspace) => deleteHandoff(workspace, deleting.id))
                toast.success('Handoff draft deleted.')
                setDeleting(null)
              } catch (cause) {
                setActionError(`Cannot delete handoff draft: ${errorMessage(cause)}`)
              } finally {
                setBusy(false)
              }
            }}>{busy ? 'Deleting…' : 'Delete draft'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
