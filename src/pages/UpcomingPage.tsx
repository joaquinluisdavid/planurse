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
        title="Page not found"
        description="This address is not part of your Planurse workspace. No clinical advice is generated."
        action={
          <Button asChild variant="outline">
            <Link to="/dashboard">Back to overview</Link>
          </Button>
        }
      />
    </>
  )
}
