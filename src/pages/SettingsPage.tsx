import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState } from '@/components/Feedback'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth, type UserRole } from '@/auth/useAuth'
import { errorMessage } from '@/lib/errors'

export default function SettingsPage() {
  const { user, profile, saveProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<UserRole>(profile?.role ?? 'new-rn')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <>
      <PageHeader
        eyebrow="Account preferences"
        title="Settings"
        description="Manage your account profile and sign-in."
      />
      <div className="grid max-w-3xl gap-5">
        <Card className="shadow-none">
          <CardContent>
            <h2 className="font-semibold">Signed-in account</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {user?.email}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              Workspace records use your signed-in Supabase session. The
              included migration configures owner-scoped row-level security;
              verify it with separate accounts before production use.
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-4 h-11"
            >
              <Link to="/forgot-password">Change password</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent>
            <h2 className="font-semibold">Your perspective</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Update the perspective used to tailor organizational language.
            </p>
            <form
              className="mt-4 flex flex-wrap items-end gap-3"
              onSubmit={async (event) => {
                event.preventDefault()
                setBusy(true)
                setError(null)
                try {
                  await saveProfile(role)
                  toast.success('Profile updated.')
                } catch (cause) {
                  setError(`Cannot update profile: ${errorMessage(cause)}`)
                } finally {
                  setBusy(false)
                }
              }}
            >
              <div className="min-w-60 flex-1 space-y-2">
                <label
                  htmlFor="account-role"
                  className="text-sm font-medium"
                >
                  Perspective
                </label>
                <select
                  id="account-role"
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as UserRole)
                  }
                  disabled={busy}
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-md border px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
                >
                  <option value="student">Nursing student</option>
                  <option value="new-rn">New graduate RN</option>
                </select>
              </div>
              <Button
                type="submit"
                variant="outline"
                className="h-11"
                disabled={busy}
              >
                {busy ? 'Saving…' : 'Save perspective'}
              </Button>
            </form>
          </CardContent>
        </Card>
        {error && <ErrorState message={error} />}
        <Card className="shadow-none">
          <CardContent>
            <h2 className="font-semibold">Sign out</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Sign out from this browser. Your cloud workspace remains associated
              with your account.
            </p>
            <Button
              variant="outline"
              className="mt-4 h-11"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                setError(null)
                try {
                  await signOut()
                  navigate('/login', { replace: true })
                } catch (cause) {
                  setError(`Cannot sign out: ${errorMessage(cause)}`)
                } finally {
                  setBusy(false)
                }
              }}
            >
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
