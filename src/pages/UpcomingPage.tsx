import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/Feedback'
import { Button } from '@/components/ui/button'

export function UpcomingPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <>
      <PageHeader
        eyebrow="Next development stages"
        title={title}
        description={description}
      />
      <EmptyState
        title="Not connected in this demo"
        description="This first release focuses on the dashboard and shift planner. No content entered on another page is used to generate clinical advice."
        action={
          <Button asChild variant="outline">
            <Link to="/dashboard">Back to overview</Link>
          </Button>
        }
      />
    </>
  )
}
