import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Sprout, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SafetyNotice } from '@/components/SafetyNotice'
import { ErrorState } from '@/components/Feedback'
import { useDemoSession } from '@/demo/useDemoSession'
import type { DemoRole } from '@/demo/session'

export function DemoEntryPage({
  mode = 'welcome',
}: {
  mode?: 'welcome' | 'login' | 'signup' | 'onboarding'
}) {
  const { role, enter, error } = useDemoSession()
  const [selected, setSelected] = useState<DemoRole>('new-rn')
  const location = useLocation()
  const state: unknown = location.state
  const from =
    state &&
    typeof state === 'object' &&
    'from' in state &&
    typeof state.from === 'string' &&
    state.from.startsWith('/') &&
    !state.from.startsWith('//')
      ? state.from
      : '/dashboard'
  if (role) return <Navigate to={from} replace />
  const onboarding = mode === 'onboarding'
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-5 py-12">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold">
        <Sprout aria-hidden="true" className="text-primary size-7" />
        planurse
      </Link>
      <Card className="shadow-none">
        <CardContent className="p-6 sm:p-8">
          <p className="text-primary mb-3 text-xs font-semibold tracking-widest uppercase">
            Your shift, organized
          </p>
          <h1 className="text-3xl font-semibold">
            {onboarding
              ? 'Make room for learning.'
              : 'A clearer start to every shift.'}
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            {onboarding
              ? 'Choose the perspective you want to explore. No personal information is needed.'
              : 'Organize your tasks, prepare for handoffs, and find space to reflect. Built for nursing students and new graduate RNs.'}
          </p>
          <div className="bg-muted my-6 rounded-lg border p-4 text-sm">
            <strong>Stages 1–4: fictional demo.</strong>
            <p className="text-muted-foreground mt-1">
              Sign up, sign in, password reset, and private cloud storage are
              not connected yet. Demo entry is not authentication. Use fictional
              information only.
            </p>
          </div>
          {error && (
            <div className="mb-4">
              <ErrorState message={error} />
            </div>
          )}
          {onboarding ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                enter(selected)
              }}
            >
              <fieldset className="space-y-3">
                <legend className="mb-3 text-sm font-semibold">
                  I am exploring as a...
                </legend>
                {(
                  [
                    {
                      value: 'new-rn',
                      label: 'New graduate RN',
                      detail: 'Orientation and your first year of practice',
                    },
                    {
                      value: 'student',
                      label: 'Nursing student',
                      detail: 'Preparing for clinical rotations',
                    },
                  ] as const
                ).map((option) => (
                  <label
                    key={option.value}
                    className="has-[:checked]:border-primary has-[:checked]:bg-secondary flex cursor-pointer items-center gap-3 rounded-lg border p-4"
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={selected === option.value}
                      onChange={() => setSelected(option.value)}
                      className="accent-primary size-4"
                    />
                    <span>
                      <span className="block text-sm font-semibold">
                        {option.label}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {option.detail}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <Button type="submit" className="mt-6 h-12 w-full">
                Open fictional demo
                <ArrowRight aria-hidden="true" />
              </Button>
            </form>
          ) : (
            <Button asChild className="h-12 w-full">
              <Link to="/onboarding" state={{ from }}>
                Explore the demo
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          )}
          {!onboarding && (
            <div className="text-muted-foreground mt-4 flex justify-center gap-5 text-sm">
              <Link to="/login" className="underline underline-offset-4">
                Sign in status
              </Link>
              <Link to="/signup" className="underline underline-offset-4">
                Sign up status
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
      <SafetyNotice />
    </main>
  )
}
