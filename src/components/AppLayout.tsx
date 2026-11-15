import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  UserRound,
  NotebookPen,
  Settings,
  Menu,
  LogOut,
  CalendarCheck2,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SafetyNotice } from './SafetyNotice'
import { ErrorState, LoadingState } from './Feedback'
import { useAuth } from '@/auth/useAuth'
import { cn } from '@/lib/utils'
import { errorMessage } from '@/lib/errors'
import { useWorkspace } from '@/data/useWorkspace'

const navigation = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendar & reminders', icon: CalendarDays },
  { to: '/notebook', label: 'Notebook', icon: NotebookPen },
]

function Brand() {
  return (
    <Link
      to="/dashboard"
      className="flex items-center gap-3 text-xl font-bold tracking-tight"
    >
      <span className="bg-primary relative flex size-10 items-center justify-center rounded-xl text-white">
        <CalendarCheck2 aria-hidden="true" className="size-6" />
        <Stethoscope aria-hidden="true" className="absolute -right-1 -bottom-1 size-4 rounded-full bg-[#e38f7c] p-0.5 text-[#713b35]" />
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
              isActive && 'bg-secondary text-primary shadow-sm',
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

function ThemeSync() {
  const { data } = useWorkspace()
  const { user } = useAuth()
  useEffect(() => {
    const settings = data?.dashboardSettings[0]
    const theme = settings?.theme ?? 'ocean'
    const savedPrimary =
      (user ? localStorage.getItem(`planurse-accent-${user.id}`) : null) ||
      settings?.customPrimary ||
      ''
    const primary =
      theme === 'minimalist' &&
      ['#2563eb', '#0e7490', '#1f5f87'].includes(savedPrimary.toLowerCase())
        ? '#4a4a46'
        : savedPrimary
    document.documentElement.dataset.theme = theme
    document.documentElement.style.setProperty('--primary', primary)
    return () => {
      document.documentElement.style.removeProperty('--primary')
    }
  }, [data?.dashboardSettings, user])
  return null
}

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const demoMode = location.pathname.startsWith('/demo')
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
      <ThemeSync />
      <a
        href="#main-content"
        className="bg-primary sr-only z-50 rounded p-3 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <aside className="bg-(--sidebar) fixed inset-y-0 left-0 hidden w-72 flex-col border-r px-4 py-6 lg:flex">
        <Brand />
        <p className="text-muted-foreground mt-10 mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] uppercase">
          Your workspace
        </p>
        <Navigation />
        <div className="mt-auto">
          <div className="border-border mb-3 border-t pt-4">
            <div className="flex items-center gap-3 px-3 pb-3">
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
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="text-muted-foreground truncate text-xs">{roleLabel}</p>
              </div>
            </div>
          </div>
          <NavLink
            to="/profile"
            aria-label="Open My Profile"
            className="hover:bg-secondary flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium"
          >
            <UserRound aria-hidden="true" className="size-5" />
            My Profile
          </NavLink>
          <NavLink
            to="/settings"
            className="hover:bg-secondary flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium"
          >
            <Settings aria-hidden="true" className="size-5" />
            Account settings
          </NavLink>
          <Button
            variant="ghost"
            className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive mt-1 h-11 w-full justify-start"
            onClick={exitAccount}
          >
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </aside>
      <div className="lg:ml-72">
        <header className="bg-(--header) flex min-h-18 items-center justify-between gap-3 border-b px-4 sm:px-8 lg:hidden">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="flex items-center gap-3">
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
              <SheetContent side="left" className="w-[min(88vw,22rem)] gap-0 p-0">
                <SheetHeader className="border-b px-6 pt-7 pb-5 pr-14">
                  <SheetTitle className="text-left text-lg">Planurse workspace</SheetTitle>
                  <SheetDescription className="text-left leading-relaxed">
                    {displayName}
                    <span className="block">{roleLabel}</span>
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-4 py-5">
                  <p className="text-muted-foreground mb-2 px-3 text-[11px] font-semibold tracking-[0.16em] uppercase">
                    Workspace
                  </p>
                  <Navigation close={() => setOpen(false)} />
                </div>
                <SheetFooter className="border-t px-4 py-4">
                  <p className="text-muted-foreground px-3 text-[11px] font-semibold tracking-[0.16em] uppercase">
                    Account
                  </p>
                  <NavLink
                    to="/profile"
                    onClick={() => setOpen(false)}
                    aria-label="Open My Profile"
                    className="hover:bg-secondary flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium"
                  >
                    <UserRound aria-hidden="true" className="size-5" />
                    My Profile
                  </NavLink>
                  <NavLink
                    to="/settings"
                    onClick={() => setOpen(false)}
                    className="hover:bg-secondary flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium"
                  >
                    <Settings aria-hidden="true" className="size-5" />
                    Account settings
                  </NavLink>
                  <Button
                    variant="outline"
                    className="border-destructive/25 text-destructive/80 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive mt-1 h-11 w-full justify-start"
                    onClick={exitAccount}
                  >
                    <LogOut aria-hidden="true" />
                    Sign out
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-7xl p-4 pb-8 outline-none sm:p-8 lg:p-10"
        >
          {demoMode && (
            <div className="border-primary/20 bg-primary/5 text-muted-foreground mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm">
              <span><strong className="text-foreground">Demo mode.</strong> Fictional data only. Changes stay in this browser session.</span>
              <Link className="text-primary font-medium underline" to="/login">Open the real app</Link>
            </div>
          )}
          {signOutError && (
            <div className="mb-5">
              <ErrorState message={signOutError} />
            </div>
          )}
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
          <footer className="mt-8">
            <SafetyNotice />
            <div className="text-muted-foreground mt-4 flex flex-wrap justify-between gap-2 text-xs">
              <span>Planurse · Workflow, not clinical guidance.</span>
              <span>Account-scoped cloud workspace</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
