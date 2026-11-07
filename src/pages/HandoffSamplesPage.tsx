import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { LoadingState, ErrorState, EmptyState } from '@/components/Feedback'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/data/useWorkspace'
import { formatDue } from '@/lib/dates'

export default function HandoffSamplesPage() {
  const { data, loading, error, reload } = useWorkspace()
  if (loading) return <LoadingState />
  if (error || !data)
    return (
      <ErrorState message={error ?? 'Workspace unavailable.'} retry={reload} />
    )
  return (
    <>
      <PageHeader
        eyebrow="Fictional samples · Read-only"
        title="Handoff drafts"
        description="SBAR preparation aids, not official medical records. Creating, editing, copying, and printing drafts arrive in stage 7."
        action={
          <Button asChild variant="outline" className="h-11">
            <Link to="/handoffs/new">Editor status</Link>
          </Button>
        }
      />
      <div className="grid gap-5">
        {data.handoffs.length ? (
          data.handoffs.map((handoff) => (
            <Card key={handoff.id} className="max-w-3xl shadow-none">
              <CardContent>
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold">
                    {handoff.patientLabel}
                  </h2>
                  <Badge variant="secondary">Fictional sample</Badge>
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
                  Sample updated {formatDue(handoff.updatedAt)}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No handoff samples"
            description="Reset fictional demo data in Settings to restore examples."
          />
        )}
      </div>
    </>
  )
}
