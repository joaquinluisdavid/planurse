import { PageHeader } from '@/components/PageHeader'
import { LoadingState, ErrorState, EmptyState } from '@/components/Feedback'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useWorkspace } from '@/data/useWorkspace'
import { formatDue } from '@/lib/dates'

export default function ReflectionSamplesPage() {
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
        title="Reflections"
        description="A place to notice your progress. Recording reflections after a shift arrives in stage 8."
      />
      <div className="grid gap-5">
        {data.reflections.length ? (
          [...data.reflections]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((reflection) => (
              <Card key={reflection.id} className="max-w-3xl shadow-none">
                <CardContent>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">
                      {formatDue(reflection.createdAt)}
                    </h2>
                    <Badge variant="secondary">
                      Confidence {reflection.confidence}/5
                    </Badge>
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
                    Fictional learning reflection. No patient information.
                  </p>
                </CardContent>
              </Card>
            ))
        ) : (
          <EmptyState
            title="No reflections yet"
            description="Reflection creation arrives in stage 8."
          />
        )}
      </div>
    </>
  )
}
