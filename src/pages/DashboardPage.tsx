import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Clock3,
  ListTodo,
  NotebookPen,
  Plus,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/Feedback'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useWorkspace } from '@/data/useWorkspace'
import { useNow } from '@/lib/useNow'
import { formatDate, localDate } from '@/lib/dates'

export default function DashboardPage() {
  const { data, loading, error, reload } = useWorkspace()
  const now = useNow()
  if (loading) return <LoadingState />
  if (error || !data)
    return (
      <ErrorState message={error ?? 'Workspace unavailable.'} retry={reload} />
    )
  const today = localDate(new Date(now))
  const items = data.plannerItems ?? []
  const todayItems = items
    .filter((item) => item.date === today)
    .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
  const upcoming = items
    .filter((item) => item.date >= today && !item.completedAt)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.startTime ?? '').localeCompare(b.startTime ?? ''),
    )
    .slice(0, 4)
  const openReminders = items.filter(
    (item) => item.kind === 'reminder' && !item.completedAt,
  )
  const recentReflections = [...data.reflections]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 2)
  const recentNotes = [...data.learningNotes]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 2)
  return (
    <>
      <PageHeader
        eyebrow={formatDate(today)}
        title="Plan at your own pace."
        description="See what is coming up, capture reminders when convenient, and reflect whenever you have a moment."
        action={
          <Button asChild className="h-11">
            <Link to="/calendar">
              <Plus aria-hidden="true" />
              Open calendar
            </Link>
          </Button>
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            label: 'Today',
            value: todayItems.length,
            detail: 'calendar entries',
            icon: CalendarDays,
          },
          {
            label: 'Reminders',
            value: openReminders.length,
            detail: 'still open',
            icon: Clock3,
          },
          {
            label: 'Learning records',
            value: data.learningNotes.length + data.reflections.length,
            detail: 'notes and reflections',
            icon: NotebookPen,
          },
        ].map(({ label, value, detail, icon: Icon }) => (
          <Card key={label} className="gap-0 py-0 shadow-none">
            <CardContent className="flex items-center gap-4 p-4">
              <span className="bg-secondary text-primary rounded-lg p-2.5">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-muted-foreground text-xs">{label}</p>
                <p className="text-2xl font-semibold">{value}</p>
                <p className="text-muted-foreground text-xs">{detail}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Coming up</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Your next scheduled items and reminders.
                  </p>
                </div>
                <Link to="/calendar" className="text-primary text-sm underline">
                  View calendar
                </Link>
              </div>
              {upcoming.length ? (
                <ul className="divide-y">
                  {upcoming.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 py-4 first:pt-0"
                    >
                      <span className="bg-primary/10 text-primary mt-0.5 rounded-lg p-2">
                        {item.kind === 'schedule' ? (
                          <CalendarDays aria-hidden="true" className="size-4" />
                        ) : (
                          <ListTodo aria-hidden="true" className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/calendar"
                          className="font-medium hover:underline"
                        >
                          {item.title}
                        </Link>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {item.date === today
                            ? 'Today'
                            : formatDate(item.date)}
                          {item.startTime
                            ? ` · ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(`2000-01-01T${item.startTime}`))}`
                            : ' · Flexible time'}
                        </p>
                        {item.notes && (
                          <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          item.kind === 'schedule' ? 'default' : 'secondary'
                        }
                      >
                        {item.kind === 'schedule' ? 'Scheduled' : 'Reminder'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="Your calendar is open"
                  description="Add a responsibility or a reminder whenever you have a moment. No formal shift log required."
                  action={
                    <Button asChild className="h-11">
                      <Link to="/calendar">
                        <Plus aria-hidden="true" />
                        Add calendar entry
                      </Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="p-5">
              <h2 className="mb-3 text-lg font-semibold">Capture a moment</h2>
              <p className="text-muted-foreground mb-4 text-sm">
                No need to wait until a shift ends. Add a reminder, learning
                note, or reflection on a date that works for you.
              </p>
              <div className="grid gap-2">
                {[
                  {
                    to: '/calendar',
                    label: 'Add a reminder or schedule item',
                    icon: CalendarDays,
                  },
                  {
                    to: `/learning-notes/new?date=${today}`,
                    label: 'Write a learning note',
                    icon: NotebookPen,
                  },
                  {
                    to: `/reflections/new?date=${today}`,
                    label: 'Write a reflection',
                    icon: Sparkles,
                  },
                ].map(({ to, label, icon: Icon }) => (
                  <Link
                    key={label}
                    to={to}
                    className="hover:border-primary hover:bg-secondary flex min-h-12 items-center gap-3 rounded-lg border p-3 text-sm font-medium"
                  >
                    <Icon aria-hidden="true" className="text-primary size-5" />
                    {label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent reflections</h2>
                <Link
                  to="/reflections"
                  className="text-primary text-sm underline"
                >
                  View all
                </Link>
              </div>
              {recentReflections.length ? (
                recentReflections.map((entry) => (
                  <div
                    key={entry.id}
                    className="border-t py-3 first:border-0 first:pt-0"
                  >
                    <p className="text-muted-foreground text-xs">
                      {formatDate(entry.entryDate)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm">
                      {entry.wentWell}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Your reflections will appear here.
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Learning notes</h2>
                <Link
                  to="/learning-notes"
                  className="text-primary text-sm underline"
                >
                  View all
                </Link>
              </div>
              {recentNotes.length ? (
                recentNotes.map((entry) => (
                  <div
                    key={entry.id}
                    className="border-t py-3 first:border-0 first:pt-0"
                  >
                    <p className="text-muted-foreground text-xs">
                      {formatDate(entry.entryDate)}
                    </p>
                    <p className="mt-1 text-sm font-medium">{entry.topic}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Your learning notes will appear here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
