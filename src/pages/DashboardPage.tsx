import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Plus,
  Clock3,
  CheckCheck,
  ListTodo,
  CalendarDays,
  ClipboardList,
  ArrowRight,
  NotebookPen,
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/Feedback'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useWorkspace } from '@/data/useWorkspace'
import { useNow } from '@/lib/useNow'
import { formatDate, formatTime, formatDue, localDate } from '@/lib/dates'
import { isOverdue } from '@/features/shifts/selectors'
import { PriorityBadge } from '@/features/shifts/PriorityBadge'

export default function DashboardPage() {
  const { data, loading, error, reload } = useWorkspace()
  const now = useNow()
  if (loading) return <LoadingState />
  if (error || !data)
    return (
      <ErrorState message={error ?? 'Workspace unavailable.'} retry={reload} />
    )
  const shift = data.shifts.find((shift) => !shift.endedAt)
  const tasks = data.tasks.filter((task) => task.shiftId === shift?.id)
  const active = tasks.filter((task) => !task.completedAt)
  const completed = tasks.length - active.length
  const overdue = active.filter((task) => isOverdue(task, now))
  const upcoming = active
    .filter((task) => task.dueAt && new Date(task.dueAt).getTime() >= now)
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())
    .slice(0, 3)
  const handoffs = [...data.handoffs]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 2)
  const reflections = [...data.reflections]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 2)
  const shiftPath = shift ? `/shifts/${shift.id}` : '/shifts/new'
  return (
    <>
      <PageHeader
        eyebrow={formatDate(localDate(new Date(now)))}
        title="Your day, at a glance."
        description="Keep the essentials in view. Give yourself space to learn."
        action={
          <Button asChild className="h-11">
            <Link to={shift ? `${shiftPath}?addTask=1` : shiftPath}>
              <Plus aria-hidden="true" />
              {shift ? 'Add a task' : 'Start a shift'}
            </Link>
          </Button>
        }
      />
      <section
        aria-label="Current shift"
        className="bg-primary relative mb-6 overflow-hidden rounded-2xl p-6 text-white sm:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm text-white/90">
              <span className="size-2 rounded-full bg-[#c7e4ce]" />
              {shift ? 'Shift in progress' : 'Between shifts'}
              <span className="ml-2 rounded-md border border-white/25 px-2 py-0.5 text-[10px] tracking-wider uppercase">
                Fictional demo
              </span>
            </div>
            <h2 className="text-2xl font-semibold">
              {shift
                ? `${shift.type.charAt(0).toUpperCase() + shift.type.slice(1)} shift`
                : 'A fresh start, when you’re ready.'}
            </h2>
            <p className="mt-2 text-sm text-white/85">
              {shift
                ? `${formatDate(shift.date)} · Started ${formatTime(shift.startedAt)} · ${shift.patientLabels.length} fictional rooms`
                : 'Choose your shift type and build a practical task list.'}
            </p>
          </div>
          <Button
            asChild
            variant="secondary"
            className="text-primary h-11 bg-white hover:bg-white/90"
          >
            <Link to={shiftPath}>
              {shift ? 'Open shift planner' : 'Start a shift'}
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        {shift && (
          <div className="mt-6 flex items-center gap-3 border-t border-white/20 pt-4">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-[#d5ebdb]"
                style={{
                  width: `${tasks.length ? (completed / tasks.length) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs text-white/90">
              {completed} of {tasks.length} tasks complete
            </span>
          </div>
        )}
      </section>
      <div className="mb-7 grid grid-cols-1 gap-3 min-[400px]:grid-cols-3 sm:gap-4">
        {[
          {
            label: 'Active tasks',
            value: active.length,
            icon: ListTodo,
            detail: 'On your current shift',
            style: 'text-primary bg-secondary',
          },
          {
            label: 'Completed',
            value: completed,
            icon: CheckCheck,
            detail: 'One step at a time',
            style: 'text-primary bg-secondary',
          },
          {
            label: 'Overdue',
            value: overdue.length,
            icon: Clock3,
            detail: 'Check your task plan',
            style: 'text-red-800 bg-red-50',
          },
        ].map(({ label, value, icon: Icon, detail, style }) => (
          <Card key={label} className="gap-0 py-0 shadow-none">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-muted-foreground text-xs font-medium sm:text-sm">
                  {label}
                </span>
                <span className={`rounded-lg p-2 ${style}`}>
                  <Icon aria-hidden="true" className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
              <p className="text-muted-foreground mt-2 text-xs">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Up next</h2>
                <Clock3
                  aria-hidden="true"
                  className="text-muted-foreground size-5"
                />
              </div>
              {upcoming.length ? (
                <ul className="divide-y">
                  {upcoming.map((task) => (
                    <li key={task.id} className="flex gap-4 py-4 first:pt-0">
                      <span className="bg-primary mt-1 size-2 shrink-0 rounded-full" />
                      <div className="min-w-0 flex-1">
                        <Link
                          to={shiftPath}
                          className="text-sm font-medium hover:underline"
                        >
                          {task.title}
                        </Link>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {task.patientLabel || 'Shift-wide'} ·{' '}
                          {formatDue(task.dueAt!)}
                        </p>
                      </div>
                      <div className="self-start">
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="Nothing scheduled next"
                  description="Tasks with upcoming due dates appear here."
                />
              )}
            </CardContent>
          </Card>
          {overdue.length > 0 && (
            <section
              className="rounded-xl border border-red-200 bg-red-50 p-5"
              aria-label="Overdue tasks"
            >
              <div className="mb-3 flex items-center gap-2">
                <Clock3 aria-hidden="true" className="size-4 text-red-800" />
                <h2 className="font-semibold text-red-900">
                  Worth a second look
                </h2>
                <Badge
                  variant="outline"
                  className="border-red-200 text-red-800"
                >
                  {overdue.length} overdue
                </Badge>
              </div>
              {overdue.slice(0, 3).map((task) => (
                <Link
                  key={task.id}
                  to={`${shiftPath}?due=overdue`}
                  className="mt-2 flex items-start justify-between gap-3 text-sm text-red-900 hover:underline"
                >
                  <span>
                    {task.title}
                    <span className="mt-1 block text-xs">
                      Due {formatDue(task.dueAt!)}
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0"
                  />
                </Link>
              ))}
            </section>
          )}
        </div>
        <div className="space-y-6">
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="p-5">
              <h2 className="mb-3 text-lg font-semibold">Quick actions</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    to: shiftPath,
                    label: shift ? 'Current shift' : 'Start a shift',
                    icon: CalendarDays,
                  },
                  {
                    to: `${shiftPath}${shift ? '?addTask=1' : ''}`,
                    label: 'Add a task',
                    icon: Plus,
                  },
                  {
                    to: '/handoffs/new',
                    label: 'Create handoff',
                    icon: ClipboardList,
                  },
                  { to: '/shifts', label: 'Shift history', icon: NotebookPen },
                ].map(({ to, label, icon: Icon }) => (
                  <Link
                    key={label}
                    to={to}
                    className="hover:border-primary hover:bg-secondary flex min-h-22 flex-col items-start justify-center gap-2 rounded-lg border p-3 text-sm font-medium"
                  >
                    <Icon aria-hidden="true" className="text-primary size-5" />
                    {label}
                  </Link>
                ))}
              </div>
              <p className="text-muted-foreground mt-3 text-xs">
                Handoff editing arrives in stage 7.
              </p>
            </CardContent>
          </Card>
          <div className="rounded-xl border bg-[#edf2eb] p-5">
            <p className="text-primary text-xs font-semibold tracking-widest uppercase">
              A small reminder
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              You don’t have to know everything today. Keep your questions
              close, and ask for support.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Recent handoff drafts</h2>
              <Link
                to="/handoffs"
                className="text-primary text-xs font-medium hover:underline"
              >
                View samples
              </Link>
            </div>
            {handoffs.length ? (
              handoffs.map((handoff) => (
                <div key={handoff.id}>
                  <div className="flex items-center gap-2">
                    <ClipboardList
                      aria-hidden="true"
                      className="text-primary size-4"
                    />
                    <h3 className="text-sm font-semibold">
                      {handoff.patientLabel}
                    </h3>
                    <Badge variant="secondary">Sample</Badge>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {handoff.situation}
                  </p>
                  <p className="text-muted-foreground mt-3 text-xs">
                    Preparation aid · {formatDue(handoff.updatedAt)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="No handoff drafts"
                description="Your fictional preparation aids will appear here."
              />
            )}
          </CardContent>
        </Card>
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Recent reflections</h2>
              <Link
                to="/reflections"
                className="text-primary text-xs font-medium hover:underline"
              >
                View samples
              </Link>
            </div>
            {reflections.length ? (
              reflections.map((reflection) => (
                <div key={reflection.id}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      A moment to reflect
                    </h3>
                    <Badge variant="outline">
                      Confidence {reflection.confidence}/5
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {reflection.wentWell}
                  </p>
                  <p className="text-muted-foreground mt-3 text-xs">
                    Fictional sample · {formatDue(reflection.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="No reflections yet"
                description="Your shift learning history will appear here."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
