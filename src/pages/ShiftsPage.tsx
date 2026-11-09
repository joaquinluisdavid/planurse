import { Link } from 'react-router-dom'
import { Plus, ArrowRight, CalendarDays } from 'lucide-react'
import { useWorkspace } from '@/data/useWorkspace'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/Feedback'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatTime } from '@/lib/dates'

export default function ShiftsPage() {
  const { data, loading, error, reload } = useWorkspace()
  if (loading) return <LoadingState />
  if (error || !data)
    return (
      <ErrorState message={error ?? 'Workspace unavailable.'} retry={reload} />
    )
  const active = data.shifts.find((shift) => !shift.endedAt)
  return (
    <>
      <PageHeader
        eyebrow="Your workspace"
        title="Past shifts"
        description="Existing shift history remains available, but you do not need to start a shift to plan or record learning."
        action={
          <Button asChild className="h-11">
            <Link to={active ? `/shifts/${active.id}` : '/shifts/new'}>
              <Plus aria-hidden="true" />
              {active ? 'Open current shift' : 'Start a shift'}
            </Link>
          </Button>
        }
      />
      {data.shifts.length ? (
        <ul className="space-y-3">
          {[...data.shifts]
            .sort(
              (a, b) =>
                Number(!!a.endedAt) - Number(!!b.endedAt) ||
                b.startedAt.localeCompare(a.startedAt),
            )
            .map((shift) => {
              const tasks = data.tasks.filter(
                (task) => task.shiftId === shift.id,
              )
              return (
                <li key={shift.id}>
                  <Link
                    to={`/shifts/${shift.id}`}
                    className="hover:border-primary flex items-center gap-4 rounded-xl border bg-white p-5"
                  >
                    <span className="bg-secondary text-primary hidden rounded-xl p-3 sm:block">
                      <CalendarDays aria-hidden="true" className="size-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-semibold capitalize">
                          {shift.type} shift
                        </h2>
                        <Badge
                          variant={shift.endedAt ? 'outline' : 'secondary'}
                        >
                          {shift.endedAt ? 'Ended' : 'In progress'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-2 text-sm">
                        {formatDate(shift.date)} · {formatTime(shift.startedAt)}
                        {shift.endedAt && ` – ${formatTime(shift.endedAt)}`}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {tasks.filter((task) => task.completedAt).length}/
                        {tasks.length} tasks completed ·{' '}
                        {shift.patientLabels.length} rooms
                      </p>
                    </div>
                    <ArrowRight
                      aria-hidden="true"
                      className="text-primary size-5 shrink-0"
                    />
                  </Link>
                </li>
              )
            })}
        </ul>
      ) : (
        <EmptyState
          title="No shifts yet"
          description="Start your first shift and build a task list."
          action={
            <Button asChild>
              <Link to="/shifts/new">Start a shift</Link>
            </Button>
          }
        />
      )}
    </>
  )
}
