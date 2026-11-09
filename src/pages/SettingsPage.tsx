import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/useAuth'
import { errorMessage } from '@/lib/errors'
import { useState } from 'react'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
              {busy ? 'Signing out…' : 'Sign out'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
