import { useState } from 'react'
import {
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  ClipboardList,
  LockKeyhole,
  NotebookPen,
  Plus,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const tasks = [
  { title: 'Confirm the orientation checklist with preceptor', priority: 'Important', done: false },
  { title: 'Review upcoming responsibilities', priority: 'Routine', done: false },
  { title: 'Check in about today’s learning goals', priority: 'Urgent', done: false },
]

const calendarItems = [
  { time: '3:00 PM', title: 'Orientation check-in', type: 'Scheduled' },
  { time: '', title: 'Write down learning questions', type: 'Reminder' },
]

const notes = [
  { title: 'Organizing a busy day', date: 'Yesterday', text: 'What general planning routine might work better next time?' },
  { title: 'Starting a new placement', date: 'Monday', text: 'Questions to bring to the next learning check-in.' },
]

export default function DemoPage() {
  const [view, setView] = useState<'overview' | 'calendar' | 'notebook'>('overview')
  const [completed, setCompleted] = useState<number[]>([])

  function toggleTask(index: number) {
    setCompleted((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-border bg-card/90 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/demo" className="flex items-center gap-3 text-lg font-bold tracking-tight">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
              <CalendarDays aria-hidden="true" className="size-5" />
            </span>
            planurse
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground hidden items-center gap-2 text-xs sm:flex">
              <LockKeyhole aria-hidden="true" className="size-3.5" /> Demo mode · fictional data
            </span>
            <Link
              to="/login"
              className="border-border hover:bg-secondary hover:text-secondary-foreground rounded-md border px-3 py-2 text-sm font-medium transition-colors"
            >
              Open real app
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:py-12">
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <p className="text-muted-foreground mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] uppercase">
            Demo workspace
          </p>
          <nav aria-label="Demo views" className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
            {[
              { id: 'overview' as const, label: 'Overview', icon: ClipboardList },
              { id: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
              { id: 'notebook' as const, label: 'Notebook', icon: NotebookPen },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-current={view === id ? 'page' : undefined}
                onClick={() => setView(id)}
                className={`flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${view === id ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'}`}
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </button>
            ))}
          </nav>
          <div className="border-border bg-card mt-8 hidden rounded-xl border p-4 text-xs leading-relaxed lg:block">
            <Sparkles aria-hidden="true" className="text-primary mb-3 size-4" />
            This preview uses fictional content and local interactions. Nothing is saved to an account.
          </div>
        </aside>

        <section aria-labelledby="demo-title" className="min-w-0">
          <div className="mb-8">
            <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">Planurse demo</p>
            <h1 id="demo-title" className="mt-2 text-3xl font-semibold sm:text-4xl">
              {view === 'overview' ? 'Your day, at a glance.' : view === 'calendar' ? 'Calendar & reminders' : 'Notebook'}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
              {view === 'overview'
                ? 'A calm place to see what is next, keep small responsibilities moving, and make room for learning.'
                : view === 'calendar'
                  ? 'Plan responsibilities and reminders without needing to start a shift.'
                  : 'Keep general learning notes in one private, non-clinical workspace.'}
            </p>
          </div>

          {view === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ['Today', 'Sunday, Nov 15'],
                  ['Open reminders', '2'],
                  ['Next check-in', '3:00 PM'],
                ].map(([label, value]) => (
                  <div key={label} className="border-border bg-card rounded-xl border p-5">
                    <p className="text-muted-foreground text-xs uppercase">{label}</p>
                    <p className="mt-2 text-lg font-semibold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="border-border bg-card rounded-xl border p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">Your tasks</h2>
                      <p className="text-muted-foreground mt-1 text-sm">A short list for the current shift.</p>
                    </div>
                    <button type="button" className="text-primary inline-flex items-center gap-1 text-sm font-medium" onClick={() => setView('calendar')}>
                      Calendar <ChevronRight aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {tasks.map((task, index) => {
                      const done = completed.includes(index)
                      return (
                        <button key={task.title} type="button" onClick={() => toggleTask(index)} className="border-border hover:bg-secondary/60 flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors">
                          {done ? <Check aria-hidden="true" className="text-primary mt-0.5 size-5 shrink-0" /> : <Circle aria-hidden="true" className="text-muted-foreground mt-0.5 size-5 shrink-0" />}
                          <span className="min-w-0 flex-1">
                            <span className={`block text-sm font-medium ${done ? 'text-muted-foreground line-through' : ''}`}>{task.title}</span>
                            <span className="text-muted-foreground mt-1 block text-xs">{task.priority}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="border-border bg-card rounded-xl border p-5 sm:p-6">
                  <h2 className="text-xl font-semibold">Coming up</h2>
                  <div className="mt-5 space-y-3">
                    {calendarItems.map((item) => (
                      <div key={item.title} className="border-border rounded-lg border p-4">
                        <p className="text-primary text-xs font-semibold uppercase">{item.type}</p>
                        <p className="mt-2 text-sm font-medium">{item.title}</p>
                        {item.time && <p className="text-muted-foreground mt-1 text-xs">{item.time}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'calendar' && (
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="border-border bg-card rounded-xl border p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div><h2 className="text-xl font-semibold">November 2026</h2><p className="text-muted-foreground mt-1 text-sm">Select a day to see its plan.</p></div>
                  <div className="flex gap-2"><button type="button" className="border-border rounded-md border px-3 py-2 text-sm">Today</button><button type="button" className="border-border rounded-md border px-3 py-2 text-sm" aria-label="Next month">›</button></div>
                </div>
                <div className="mt-6 grid grid-cols-7 border-l border-t">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div key={day} className="bg-muted border-border border-r border-b px-2 py-2 text-center text-xs font-semibold">{day}</div>)}
                  {Array.from({ length: 35 }, (_, index) => { const day = index - 1; const isToday = day === 15; return <div key={index} className={`border-border min-h-20 border-r border-b p-2 text-sm ${isToday ? 'bg-primary/10 text-primary font-semibold' : ''}`}>{day > 0 && day <= 30 ? day : ''}</div> })}
                </div>
              </div>
              <div className="border-border bg-card rounded-xl border p-5 sm:p-6"><p className="text-primary text-xs font-semibold uppercase">Selected day</p><h2 className="mt-2 text-xl font-semibold">Sunday, Nov 15</h2><div className="mt-5 space-y-3">{calendarItems.map((item) => <div key={item.title} className="border-border rounded-lg border p-4"><p className="text-sm font-medium">{item.title}</p><p className="text-muted-foreground mt-1 text-xs">{item.time || item.type}</p></div>)}</div><button type="button" className="bg-primary text-primary-foreground mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-medium"><Plus aria-hidden="true" className="size-4" /> Add entry</button></div>
            </div>
          )}

          {view === 'notebook' && (
            <div className="grid gap-4 md:grid-cols-2">
              {notes.map((note) => <article key={note.title} className="border-border bg-card rounded-xl border p-5 sm:p-6"><p className="text-muted-foreground text-xs uppercase">{note.date}</p><h2 className="mt-3 text-xl font-semibold">{note.title}</h2><p className="text-muted-foreground mt-3 text-sm leading-relaxed">{note.text}</p><button type="button" className="text-primary mt-6 inline-flex items-center gap-2 text-sm font-medium">Open note <ChevronRight aria-hidden="true" className="size-4" /></button></article>)}
              <button type="button" className="border-border text-muted-foreground hover:bg-secondary flex min-h-40 items-center justify-center gap-2 rounded-xl border border-dashed text-sm font-medium"><Plus aria-hidden="true" className="size-4" /> New notebook page</button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
