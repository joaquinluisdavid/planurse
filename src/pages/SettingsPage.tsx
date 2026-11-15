import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/auth/useAuth'
import { useWorkspace } from '@/data/useWorkspace'
import { errorMessage } from '@/lib/errors'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { data, update } = useWorkspace()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [themeError, setThemeError] = useState<string | null>(null)
  const currentTheme = data?.dashboardSettings[0]?.theme ?? 'ocean'
  const customPrimary =
    (user ? localStorage.getItem(`planurse-accent-${user.id}`) : null) ??
    data?.dashboardSettings[0]?.customPrimary ??
    '#0e7490'
  const [selectedPrimary, setSelectedPrimary] = useState(customPrimary)
  const accentOptions = [
    { name: 'Blue', value: '#2563eb' },
    { name: 'Pink', value: '#db2777' },
    { name: 'Green', value: '#15803d' },
    { name: 'Red', value: '#dc2626' },
    { name: 'Amber', value: '#b45309' },
    { name: 'Purple', value: '#7c3aed' },
  ] as const
  const themes = [
    {
      value: 'light',
      name: 'Light',
      description: 'Bright and airy for everyday planning.',
      background: '#f8fafc',
      surface: '#ffffff',
      primary: '#0e7490',
      secondary: '#eff6ff',
    },
    {
      value: 'dark',
      name: 'Dark',
      description: 'Low-light workspace for evening planning.',
      background: '#17191c',
      surface: '#202428',
      primary: '#0e7490',
      secondary: '#252b31',
    },
    {
      value: 'ocean',
      name: 'Ocean',
      description: 'Teal sea-glass tones with warm contrast.',
      background: '#edf5f8',
      surface: '#fdfefe',
      primary: '#0e7490',
      secondary: '#d8edf2',
    },
    {
      value: 'minimalist',
      name: 'Minimalist',
      description: 'Quiet neutrals and low visual noise.',
      background: '#f7f7f5',
      surface: '#ffffff',
      primary: '#4a4a46',
      secondary: '#e9e9e5',
    },
    {
      value: 'high-contrast',
      name: 'High Contrast',
      description: 'Strong edges and maximum readability.',
      background: '#ffffff',
      surface: '#ffffff',
      primary: '#000000',
      secondary: '#f0f0f0',
    },
  ] as const
  async function saveAppearance(theme = currentTheme, primary = customPrimary) {
    if (!user || !data) return
    setThemeError(null)
    setSelectedPrimary(primary)
    localStorage.setItem(`planurse-accent-${user.id}`, primary)
    document.documentElement.style.setProperty('--primary', primary)
    try {
      await update((workspace) => ({
        ...workspace,
        dashboardSettings: [
          {
            id: user.id,
            userId: user.id,
            coverImageUrl: workspace.dashboardSettings[0]?.coverImageUrl ?? '',
            theme,
            customPrimary: primary,
            updatedAt: new Date().toISOString(),
          },
        ],
      }))
    } catch (cause) {
      setThemeError(
        cause instanceof Error ? cause.message : 'Cannot change theme.',
      )
    }
  }
  async function confirmSignOut() {
    setBusy(true)
    setError(null)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (cause) {
      setError(`Cannot sign out: ${errorMessage(cause)}`)
      setSignOutOpen(false)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="Account preferences"
        title="Settings"
        description="Manage sign-in and account security."
      />
      <div className="grid max-w-3xl gap-5">
        <Card className="shadow-none">
          <CardContent>
            <h2 className="font-semibold">My Profile</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Update your picture, name, display nickname, professional role,
              and current position.
            </p>
            <Button asChild variant="outline" className="mt-4 h-11">
              <Link to="/profile">View or edit profile</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent>
            <h2 className="font-semibold">Planner themes</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Choose a visual style for your Planurse workspace.
            </p>
            {themeError && (
              <p role="alert" className="text-destructive mt-3 text-sm">
                {themeError}
              </p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  className={`overflow-hidden rounded-xl border text-left transition-shadow ${currentTheme === theme.value ? 'border-primary ring-ring ring-2 ring-offset-1' : 'border-input hover:shadow-md'}`}
                  onClick={() =>
                    void saveAppearance(theme.value, theme.primary)
                  }
                  aria-pressed={currentTheme === theme.value}
                >
                  <div
                    className="relative h-28 overflow-hidden p-3"
                    style={{ backgroundColor: theme.background }}
                    aria-hidden="true"
                  >
                    <div
                      className="flex h-full overflow-hidden rounded-md border shadow-sm"
                      style={{
                        backgroundColor: theme.surface,
                        borderColor: theme.secondary,
                      }}
                    >
                      <div
                        className="w-1/4 p-2"
                        style={{ backgroundColor: theme.secondary }}
                      >
                        <div
                          className="mb-2 h-2 w-10 rounded-full"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div className="space-y-1.5">
                          <span
                            className="block h-1.5 w-full rounded-full opacity-40"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <span
                            className="block h-1.5 w-3/4 rounded-full opacity-40"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <span
                            className="block h-1.5 w-full rounded-full opacity-40"
                            style={{ backgroundColor: theme.primary }}
                          />
                        </div>
                      </div>
                      <div className="flex-1 p-2">
                        <div
                          className="mb-2 h-2 w-20 rounded-full"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <span
                            className="h-8 rounded"
                            style={{ backgroundColor: theme.secondary }}
                          />
                          <span
                            className="h-8 rounded"
                            style={{ backgroundColor: theme.secondary }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="block px-3 pt-3 text-sm font-semibold">
                    {theme.name}
                  </span>
                  <span className="text-muted-foreground block px-3 pt-1 pb-3 text-xs">
                    {theme.description}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
              <div>
                <p className="text-sm font-medium">Accent color</p>
                <p className="text-muted-foreground text-xs">
                  Choose a readable color for buttons and highlights.
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {accentOptions.map((accent) => (
                <button
                  key={accent.value}
                  type="button"
                  className={`flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium ${selectedPrimary.toLowerCase() === accent.value ? 'ring-2 ring-offset-1' : 'border-input hover:border-primary'}`}
                  style={
                    selectedPrimary.toLowerCase() === accent.value
                      ? ({
                          borderColor: selectedPrimary,
                          '--tw-ring-color': selectedPrimary,
                        } as CSSProperties)
                      : undefined
                  }
                  onClick={() =>
                    void saveAppearance(currentTheme, accent.value)
                  }
                  aria-pressed={selectedPrimary.toLowerCase() === accent.value}
                >
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: accent.value }}
                  />
                  {accent.name}
                </button>
              ))}
              <label
                className={`border-input flex h-9 cursor-pointer items-center gap-2 rounded-full border px-2 text-xs font-medium ${!accentOptions.some((accent) => accent.value === selectedPrimary.toLowerCase()) ? 'ring-2 ring-offset-1' : ''}`}
                style={
                  !accentOptions.some(
                    (accent) => accent.value === selectedPrimary.toLowerCase(),
                  )
                    ? ({
                        borderColor: selectedPrimary,
                        '--tw-ring-color': selectedPrimary,
                      } as CSSProperties)
                      : undefined
                }
                title="Choose a custom accent color"
              >
                <span
                  className="size-5 cursor-pointer rounded-full border border-black/15"
                  style={{ backgroundColor: selectedPrimary }}
                />
                <input
                  type="color"
                  value={selectedPrimary}
                  aria-label="Choose custom accent color"
                  onChange={(event) =>
                      void saveAppearance(currentTheme, event.target.value)
                  }
                  className="sr-only"
                />
                <span>Custom</span>
              </label>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent>
            <h2 className="font-semibold">Signed-in account</h2>
            <p className="text-muted-foreground mt-2 text-sm">{user?.email}</p>
            <Button asChild variant="outline" className="mt-4 h-11">
              <Link to="/forgot-password">Change password</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent>
            <h2 className="font-semibold">Sign out</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Sign out from this browser. Your cloud workspace remains
              associated with your account.
            </p>
            {error && (
              <p role="alert" className="text-destructive mt-3 text-sm">
                {error}
              </p>
            )}
            <Button
              variant="outline"
              className="mt-4 h-11"
              disabled={busy}
              onClick={() => setSignOutOpen(true)}
            >
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={signOutOpen}
        onOpenChange={(open) => {
          if (!busy) setSignOutOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out of Planurse?</DialogTitle>
            <DialogDescription>
              You will need to sign in again to access your workspace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSignOutOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmSignOut()}
              disabled={busy}
            >
              {busy ? 'Signing out…' : 'Sign out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
