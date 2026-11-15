import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Clock3,
  ImagePlus,
  ListTodo,
  NotebookPen,
  Pencil,
  Plus,
  Pin,
  Settings2,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/Feedback'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useWorkspace } from '@/data/useWorkspace'
import { useAuth } from '@/auth/useAuth'
import { useNow } from '@/lib/useNow'
import { formatDate, localDate } from '@/lib/dates'

export default function DashboardPage() {
  const { data, loading, error, reload, update } = useWorkspace()
  const { profile, user } = useAuth()
  const now = useNow()
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [bulletinOpen, setBulletinOpen] = useState(false)
  const [editingBulletinId, setEditingBulletinId] = useState<string | null>(
    null,
  )
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [bulletinTitle, setBulletinTitle] = useState('')
  const [bulletinContent, setBulletinContent] = useState('')
  const [bulletinImageUrl, setBulletinImageUrl] = useState('')
  const [bulletinColor, setBulletinColor] = useState<
    'yellow' | 'blue' | 'pink' | 'green'
  >('yellow')
  const [customizeError, setCustomizeError] = useState<string | null>(null)
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
  const recentNotebookEntries = [...data.notebookEntries]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3)
  const displayName =
    profile?.nickname.trim() ||
    profile?.firstName.trim() ||
    user?.email?.split('@')[0] ||
    'there'
  const settings = data.dashboardSettings[0]
  const bulletinPosts = [...data.bulletinPosts].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  )
  function readImage(file: File, onRead: (value: string) => void) {
    if (!file.type.startsWith('image/')) {
      setCustomizeError('Choose an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setCustomizeError('Images must be 2 MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => onRead(String(reader.result))
    reader.onerror = () => setCustomizeError('The image could not be read.')
    reader.readAsDataURL(file)
  }
  async function saveCover(nextCoverImageUrl = coverImageUrl) {
    setCustomizeError(null)
    try {
      await update((workspace) => ({
        ...workspace,
        dashboardSettings: [
          {
            id: user?.id ?? '',
            userId: user?.id ?? '',
            coverImageUrl: nextCoverImageUrl.trim(),
            theme: settings?.theme ?? 'light',
            customPrimary: settings?.customPrimary ?? '#0e7490',
            updatedAt: new Date().toISOString(),
          },
        ],
      }))
      setCustomizeOpen(false)
    } catch (cause) {
      setCustomizeError(
        cause instanceof Error ? cause.message : 'Cannot save cover image.',
      )
    }
  }
  async function addBulletinPost() {
    if (!user || !bulletinTitle.trim() || !bulletinContent.trim()) return
    setCustomizeError(null)
    try {
      await update((workspace) => {
        const now = new Date().toISOString()
        const post = {
          id: editingBulletinId ?? crypto.randomUUID(),
          userId: user.id,
          title: bulletinTitle.trim(),
          content: bulletinContent.trim(),
          imageUrl: bulletinImageUrl.trim(),
          color: bulletinColor,
          createdAt:
            workspace.bulletinPosts.find(
              (item) => item.id === editingBulletinId,
            )?.createdAt ?? now,
          updatedAt: now,
        }
        return {
          ...workspace,
          bulletinPosts: editingBulletinId
            ? workspace.bulletinPosts.map((item) =>
                item.id === editingBulletinId ? post : item,
              )
            : [...workspace.bulletinPosts, post],
        }
      })
      setBulletinTitle('')
      setBulletinContent('')
      setBulletinImageUrl('')
      setEditingBulletinId(null)
      setBulletinOpen(false)
    } catch (cause) {
      setCustomizeError(
        cause instanceof Error ? cause.message : 'Cannot add bulletin note.',
      )
    }
  }
  function editBulletinPost(id: string) {
    if (!data) return
    const post = data.bulletinPosts.find((item) => item.id === id)
    if (!post) return
    setEditingBulletinId(id)
    setBulletinTitle(post.title)
    setBulletinContent(post.content)
    setBulletinImageUrl(post.imageUrl)
    setBulletinColor(post.color)
    setBulletinOpen(true)
  }
  async function removeBulletinPost(id: string) {
    await update((workspace) => ({
      ...workspace,
      bulletinPosts: workspace.bulletinPosts.filter((post) => post.id !== id),
    }))
    setBulletinTitle('')
    setBulletinContent('')
    setBulletinImageUrl('')
    setBulletinColor('yellow')
    setEditingBulletinId(null)
  }
  function openNewBulletin() {
    setBulletinTitle('')
    setBulletinContent('')
    setBulletinImageUrl('')
    setBulletinColor('yellow')
    setEditingBulletinId(null)
    setBulletinOpen(true)
  }
  return (
    <>
      <section
        className="border-border bg-background relative mb-6 min-h-48 overflow-hidden rounded-2xl border p-6 sm:p-8"
        style={{
          backgroundImage: settings?.coverImageUrl
            ? `linear-gradient(90deg, rgba(17,24,39,.72), rgba(17,24,39,.15)), url(${settings.coverImageUrl})`
            : settings?.theme === 'minimalist'
              ? 'repeating-linear-gradient(120deg, #f1f1ed 0, #f1f1ed 24px, #e5e5df 24px, #e5e5df 48px)'
              : settings?.theme === 'dark'
                ? 'repeating-linear-gradient(120deg, #252b31 0, #252b31 24px, #202428 24px, #202428 48px)'
                : settings?.theme === 'high-contrast'
                  ? 'repeating-linear-gradient(120deg, #ffffff 0, #ffffff 24px, #f0f0f0 24px, #f0f0f0 48px)'
                  : 'repeating-linear-gradient(120deg, color-mix(in srgb, var(--primary) 8%, var(--background)) 0, color-mix(in srgb, var(--primary) 8%, var(--background)) 24px, color-mix(in srgb, var(--primary) 16%, var(--background)) 24px, color-mix(in srgb, var(--primary) 16%, var(--background)) 48px)',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="relative flex min-h-32 items-end justify-end text-white">
          <Button
            variant="outline"
            className="text-foreground border-border/80 bg-background/90 hover:text-primary w-fit hover:bg-[color-mix(in_srgb,var(--primary)_14%,var(--background))]"
            onClick={() => {
              setCoverImageUrl(settings?.coverImageUrl ?? '')
              setCustomizeOpen(true)
            }}
          >
            <Settings2 aria-hidden="true" />
            Customize cover
          </Button>
        </div>
      </section>
      <PageHeader
        eyebrow={formatDate(today)}
        title={`What’s on your calendar, ${displayName}?`}
        description="See what is coming up, capture reminders when convenient, and reflect whenever you have a moment."
      />
      <section
        className="mb-6 rounded-2xl border border-[#b99463] bg-[#c9a875] p-4 shadow-inner sm:p-6"
        style={{
          backgroundImage:
            'repeating-linear-gradient(105deg, rgba(91, 62, 33, 0.06) 0, rgba(91, 62, 33, 0.06) 1px, transparent 1px, transparent 7px)',
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#3d2c1e]">
              <Pin aria-hidden="true" className="size-5" /> Bulletin board
            </h2>
            <p className="mt-1 text-sm text-[#5e4935]">
              Keep a few small reminders, intentions, or encouraging notes in
              view.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {bulletinPosts.map((post, index) => (
            <Card
              key={post.id}
              style={{
                transform: `rotate(${[-1, 1, -0.5, 0.75][index % 4]}deg)`,
              }}
              className={`relative shadow-md ${post.color === 'blue' ? 'bg-[#c6e0ed]' : post.color === 'pink' ? 'bg-[#f2c5ce]' : post.color === 'green' ? 'bg-[#c6dfbe]' : 'bg-[#f6dda0]'}`}
            >
              <span
                className={`absolute -top-2 left-1/2 z-10 size-4 -translate-x-1/2 rounded-full border shadow-sm ${post.color === 'blue' ? 'border-[#347ca4] bg-[#4f9fc7]' : post.color === 'pink' ? 'border-[#b84f69] bg-[#d96b83]' : post.color === 'green' ? 'border-[#4d8c49] bg-[#70ad67]' : 'border-[#b17b18] bg-[#e3ad32]'}`}
                aria-hidden="true"
              />
              <CardContent className="relative p-4">
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Edit ${post.title}`}
                    onClick={() => editBulletinPost(post.id)}
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Delete ${post.title}`}
                    onClick={() => void removeBulletinPost(post.id)}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </div>
                <h3 className="pr-8 font-semibold">{post.title}</h3>
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="mt-3 aspect-video w-full rounded-md object-cover"
                  />
                )}
                <p className="mt-2 text-sm whitespace-pre-wrap">
                  {post.content}
                </p>
              </CardContent>
            </Card>
          ))}
          <button
            type="button"
            className="flex min-h-36 items-center justify-center rounded-xl border-2 border-dashed border-[#8f7048] text-sm font-medium text-[#5e4935] hover:bg-[#d7b986]"
            onClick={openNewBulletin}
          >
            <Plus aria-hidden="true" className="mr-2 size-4" />
            Add note
          </button>
        </div>
      </section>
      {customizeError && <ErrorState message={customizeError} />}
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
            value: data.notebookEntries.length,
            detail: 'notebook pages',
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
                      <span
                        className={`mt-0.5 rounded-lg p-2 ${
                          item.kind === 'schedule'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
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
                        variant="default"
                        className={
                          item.kind === 'schedule'
                            ? undefined
                            : 'bg-yellow-100 text-yellow-800'
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
                  description="Add a responsibility or a reminder whenever you have a moment."
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
                Keep a notebook page whenever it feels useful.
              </p>
              <div className="grid gap-2">
                {[
                  {
                    to: `/notebook/new?date=${today}`,
                    label: 'Open notebook',
                    icon: NotebookPen,
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
                <h2 className="text-lg font-semibold">
                  Recent journal entries
                </h2>
                <Link to="/notebook" className="text-primary text-sm underline">
                  View all
                </Link>
              </div>
              {recentNotebookEntries.length ? (
                recentNotebookEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border-t py-3 first:border-0 first:pt-0"
                  >
                    <p className="text-muted-foreground text-xs">
                      {formatDate(entry.entryDate)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm font-medium">
                      {entry.title}
                    </p>
                    {entry.content && (
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                        {entry.content}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Your journal entries will appear here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize your cover</DialogTitle>
            <DialogDescription>
              Choose an image file to give your planner a personal cover.
            </DialogDescription>
          </DialogHeader>
          <div
            className="relative aspect-[2.8/1] overflow-hidden rounded-xl border bg-[#dce9ef]"
            style={{
              backgroundImage: coverImageUrl
                ? `linear-gradient(90deg, rgba(17,24,39,.45), rgba(17,24,39,.05)), url(${coverImageUrl})`
                : 'repeating-linear-gradient(120deg, #dce9ef 0, #dce9ef 24px, #c8dce5 24px, #c8dce5 48px)',
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          >
            <span className="absolute inset-x-0 bottom-0 bg-black/35 px-4 py-2 text-xs text-white">
              {coverImageUrl ? 'Custom cover' : 'Default cover'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <label className="border-input bg-background hover:bg-secondary flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium">
              <ImagePlus aria-hidden="true" className="size-4" />
              Choose image
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) readImage(file, setCoverImageUrl)
                }}
              />
            </label>
            {coverImageUrl && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove cover image"
                title="Remove cover image"
                onClick={() => setCoverImageUrl('')}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setCustomizeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveCover()}>Save cover</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={bulletinOpen} onOpenChange={setBulletinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBulletinId ? 'Edit bulletin note' : 'Add bulletin note'}
            </DialogTitle>
            <DialogDescription>
              {editingBulletinId
                ? 'Update this pinned note.'
                : 'Pin a short thought, reminder, or image to your Overview.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input
              className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
              placeholder="Note title"
              value={bulletinTitle}
              onChange={(event) => setBulletinTitle(event.target.value)}
              maxLength={80}
            />
            <textarea
              className="border-input bg-background min-h-28 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Write your note..."
              value={bulletinContent}
              onChange={(event) => setBulletinContent(event.target.value)}
              maxLength={500}
            />
            <div className="flex items-center justify-between gap-3">
              <label
                className="border-input bg-background text-muted-foreground hover:text-foreground flex size-10 cursor-pointer items-center justify-center rounded-md border"
                title="Add image"
              >
                <ImagePlus aria-hidden="true" className="size-4" />
                <span className="sr-only">Add image to bulletin note</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) readImage(file, setBulletinImageUrl)
                  }}
                />
              </label>
              <details className="relative" aria-label="Bulletin note color">
                <summary className="border-input bg-background flex h-10 cursor-pointer list-none items-center gap-2 rounded-md border px-3 text-sm marker:hidden">
                  <span
                    className={`size-4 rounded-full ${bulletinColor === 'blue' ? 'bg-[#4f9fc7]' : bulletinColor === 'pink' ? 'bg-[#d96b83]' : bulletinColor === 'green' ? 'bg-[#70ad67]' : 'bg-[#e3ad32]'}`}
                  />
                  {bulletinColor.charAt(0).toUpperCase() +
                    bulletinColor.slice(1)}
                </summary>
                <div className="border-input bg-popover absolute right-0 bottom-12 z-20 min-w-36 rounded-lg border p-1 shadow-lg">
                  {[
                    ['yellow', 'Yellow', '#e3ad32'],
                    ['blue', 'Blue', '#4f9fc7'],
                    ['pink', 'Pink', '#d96b83'],
                    ['green', 'Green', '#70ad67'],
                  ].map(([value, label, swatch]) => (
                    <button
                      key={value}
                      type="button"
                      className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm ${bulletinColor === value ? 'bg-secondary' : 'hover:bg-secondary/70'}`}
                      aria-pressed={bulletinColor === value}
                      onClick={(event) => {
                        setBulletinColor(value as typeof bulletinColor)
                        const menu = event.currentTarget.closest('details')
                        if (menu) menu.open = false
                      }}
                    >
                      <span
                        className="size-5 rounded-full"
                        style={{ backgroundColor: swatch }}
                      />
                      {label}
                    </button>
                  ))}
                </div>
              </details>
            </div>
            {bulletinImageUrl && (
              <p className="text-muted-foreground text-xs">Image selected</p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setBulletinOpen(false)
                setEditingBulletinId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void addBulletinPost()}
              disabled={!bulletinTitle.trim() || !bulletinContent.trim()}
            >
              {editingBulletinId ? (
                <Pencil aria-hidden="true" />
              ) : (
                <Plus aria-hidden="true" />
              )}
              {editingBulletinId ? 'Save changes' : 'Pin note'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
