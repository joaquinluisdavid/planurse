import { Suspense, useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  UserRound,
  NotebookPen,
  BookOpen,
  Settings,
  Menu,
  LogOut,
  Sprout,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SafetyNotice } from './SafetyNotice'
import { ErrorState, LoadingState } from './Feedback'
import { useAuth } from '@/auth/useAuth'
import { cn } from '@/lib/utils'
import { errorMessage } from '@/lib/errors'

const navigation = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendar & reminders', icon: CalendarDays },
  { to: '/reflections', label: 'Reflections', icon: NotebookPen },
  { to: '/learning-notes', label: 'Learning notes', icon: BookOpen },
]

function Brand() {
  return (
    <Link
      to="/dashboard"
      className="flex items-center gap-3 text-xl font-bold tracking-tight"
    >
      <span className="bg-primary flex size-10 items-center justify-center rounded-xl text-white">
        <Sprout aria-hidden="true" className="size-6" />
      </span>
      planurse<span className="sr-only"> home</span>
    </Link>
  )
}

function Navigation({ close }: { close?: () => void }) {
  return (
    <nav aria-label="Main navigation" className="space-y-1">
      {navigation.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={close}
          className={({ isActive }) =>
            cn(
              'text-muted-foreground hover:bg-secondary flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
              isActive && 'bg-secondary text-primary',
            )
          }
        >
          <Icon aria-hidden="true" className="size-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const roleLabel =
    profile?.role === 'student-nurse' ? 'Student Nurse' : 'Registered Nurse'
  const displayName =
    profile?.nickname.trim() || profile?.firstName || user?.email
  async function exitAccount() {
    setSignOutError(null)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (cause) {
      setSignOutError(`Cannot sign out: ${errorMessage(cause)}`)
    }
  }
  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="bg-primary sr-only z-50 rounded p-3 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-[#fbfcf8] px-5 py-7 lg:flex">
        <Brand />
        <p className="text-muted-foreground mt-8 mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] uppercase">
          Your workspace
        </p>
        <Navigation />
        <div className="mt-auto">
          <NavLink
            to="/profile"
            className="hover:bg-secondary flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm"
          >
            <UserRound aria-hidden="true" className="size-5" />
            My Profile
          </NavLink>
          <NavLink
            to="/settings"
            className="hover:bg-secondary flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm"
          >
            <Settings aria-hidden="true" className="size-5" />
            Account settings
          </NavLink>
          <Button
            variant="ghost"
            className="mt-1 h-11 w-full justify-start"
            onClick={exitAccount}
          >
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </aside>
      <div className="lg:ml-64">
        <header className="flex min-h-18 items-center justify-between gap-3 border-b bg-white/70 px-4 sm:px-8">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="hidden flex-1 lg:block" aria-hidden="true" />
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 lg:flex">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="size-9 rounded-full object-cover"
                />
              ) : (
                <div className="bg-secondary text-primary flex size-9 items-center justify-center rounded-full text-sm font-semibold">
                  {(displayName?.[0] ?? 'A').toUpperCase()}
                </div>
              )}
              <div>
                <Link
                  to="/profile"
                  aria-label="Open My Profile"
                  className="max-w-52 truncate text-sm font-semibold hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {displayName}
                </Link>
                <p className="text-muted-foreground text-xs">
                  {roleLabel}
                  {profile?.position ? ` · ${profile.position}` : ''}
                </p>
              </div>
            </div>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11 lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-5">
                <SheetHeader className="px-0">
                  <SheetTitle>Planurse workspace</SheetTitle>
                  <SheetDescription>
                    {user?.email} · {roleLabel}
                  </SheetDescription>
                </SheetHeader>
                <Navigation close={() => setOpen(false)} />
                <NavLink
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center gap-3 px-3"
                >
                  <UserRound aria-hidden="true" className="size-5" />
                  My Profile
                </NavLink>
                <NavLink
                  to="/settings"
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center gap-3 px-3"
                >
                  <Settings aria-hidden="true" className="size-5" />
                  Account settings
                </NavLink>
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={exitAccount}
                >
                  <LogOut aria-hidden="true" />
                  Sign out
                </Button>
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-7xl p-4 pb-8 outline-none sm:p-8 lg:p-10"
        >
          {signOutError && (
            <div className="mb-5">
              <ErrorState message={signOutError} />
            </div>
          )}
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
          <div className="mt-8">
            <SafetyNotice />
          </div>
          <footer className="text-muted-foreground mt-4 flex flex-wrap justify-between gap-2 text-xs">
            <span>Planurse · Workflow, not clinical guidance.</span>
            <span>Account-scoped cloud workspace</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
