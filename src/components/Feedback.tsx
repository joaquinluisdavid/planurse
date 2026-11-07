import { LoaderCircle, AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function LoadingState() {
  return (
    <div
      role="status"
      className="text-muted-foreground flex items-center justify-center gap-3 py-20"
    >
      <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
      Loading your workspace...
    </div>
  )
}

export function ErrorState({
  message,
  retry,
}: {
  message: string
  retry?: () => void
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>Something needs attention</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {retry && (
          <Button className="mt-3" variant="outline" onClick={retry}>
            Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground mx-auto mt-2 mb-4 max-w-md text-sm">
        {description}
      </p>
      {action}
    </div>
  )
}
