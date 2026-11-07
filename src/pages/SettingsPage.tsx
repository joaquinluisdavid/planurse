import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState } from '@/components/Feedback'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useDemoSession } from '@/demo/useDemoSession'
import { useWorkspace } from '@/data/useWorkspace'
import { errorMessage } from '@/lib/errors'
import { useDialogFocus } from '@/lib/useDialogFocus'

export default function SettingsPage() {
  const { role, leave } = useDemoSession()
  const { reset } = useWorkspace()
  const { rememberFocus, restoreFocus } = useDialogFocus()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <>
      <PageHeader
        eyebrow="Demo preferences"
        title="Settings"
        description="This workspace is local, fictional, and not a secure account."
      />
      <div className="grid max-w-3xl gap-5">
        <Card className="shadow-none">
          <CardContent>
            <h2 className="font-semibold">Demo perspective</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {role === 'student' ? 'Nursing student' : 'New graduate RN'}. Exit
              the demo to select a different perspective.
            </p>
            <Button variant="outline" className="mt-4 h-11" onClick={leave}>
              Exit demo
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent>
            <h2 className="font-semibold">Local demo data</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Fictional shifts and tasks are stored in this browser’s local
              storage. Everyone using the same browser profile shares this demo
              data. Exiting the demo does not erase it. Do not enter sensitive
              information. Clearing browser storage removes it; it is not a
              backup.
            </p>
            <Button
              variant="outline"
              className="mt-4 h-11"
              onClick={() => {
                rememberFocus()
                setError(null)
                setOpen(true)
              }}
            >
              Reset fictional demo
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent>
            <h2 className="font-semibold">Authentication is next</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Supabase sign up, sign in, password reset, account settings, and
              user-owned PostgreSQL records arrive in stages 5–6. No account
              credentials are collected in this release.
            </p>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!busy) setOpen(next)
        }}
      >
        <DialogContent onCloseAutoFocus={restoreFocus}>
          <DialogHeader>
            <DialogTitle>Reset the demo?</DialogTitle>
            <DialogDescription>
              All local edits will be replaced with fresh fictional examples.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && <ErrorState message={error} />}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                setError(null)
                try {
                  await reset()
                  toast.success('Fictional demo reset.')
                  setOpen(false)
                } catch (cause) {
                  setError(`Cannot reset demo: ${errorMessage(cause)}`)
                } finally {
                  setBusy(false)
                }
              }}
            >
              {busy ? 'Resetting...' : 'Reset demo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
