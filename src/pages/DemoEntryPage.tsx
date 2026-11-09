import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Sprout, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SafetyNotice } from '@/components/SafetyNotice'
import { ErrorState } from '@/components/Feedback'
import { useAuth } from '@/auth/useAuth'
import type { UserRole } from '@/auth/useAuth'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/errors'

const roleChoices: { value: UserRole; label: string; detail: string }[] = [
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
]

export function AccountEntryPage({
	mode = 'welcome',
}: {
	mode?:
		| 'welcome'
		| 'login'
		| 'signup'
		| 'onboarding'
		| 'forgot-password'
		| 'update-password'
}) {
	const { user, profile, loading, configured, saveProfile } = useAuth()
	const [selected, setSelected] = useState<UserRole>('new-rn')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [busy, setBusy] = useState(false)
	const [message, setMessage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const location = useLocation()
	const navigate = useNavigate()
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

	if (loading)
		return (
			<main className="mx-auto flex min-h-screen max-w-xl items-center p-5">
				Restoring your account…
			</main>
		)
	if (user && profile && (mode === 'welcome' || mode === 'login' || mode === 'signup'))
		return <Navigate to={from} replace />
	if (user && !profile && mode === 'welcome') return <Navigate to="/onboarding" replace />
	if (user && !profile && (mode === 'login' || mode === 'signup'))
		return <Navigate to="/onboarding" replace />
	if (mode === 'onboarding' && !user) return <Navigate to="/login" replace />
	if (mode === 'onboarding' && profile) return <Navigate to="/dashboard" replace />
	if (mode === 'update-password' && !user) return <Navigate to="/login" replace />

	const title = {
		welcome: 'A clearer start to every shift.',
		login: 'Welcome back.',
		signup: 'Create your account.',
		onboarding: 'Make room for learning.',
		'forgot-password': 'Reset your password.',
		'update-password': 'Choose a new password.',
	}[mode]
	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!supabase || busy) return
		setBusy(true)
		setError(null)
		setMessage(null)
		try {
			if (mode === 'login') {
				const { data, error: authError } = await supabase.auth.signInWithPassword({
					email: email.trim(),
					password,
				})
				if (authError) throw authError
				navigate(data.user ? from : '/dashboard', { replace: true })
			} else if (mode === 'signup') {
				const { data, error: authError } = await supabase.auth.signUp({
					email: email.trim(),
					password,
				})
				if (authError) throw authError
				if (data.session) navigate('/onboarding', { replace: true })
				else
					setMessage(
						'Check your email for a confirmation link. Your account will be ready after you confirm your address.'
					)
			} else if (mode === 'forgot-password') {
				const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
					redirectTo: `${window.location.origin}/update-password`,
				})
				if (authError) throw authError
				setMessage('If an account exists for that address, a password reset link is on its way.')
			} else if (mode === 'update-password') {
				const { error: authError } = await supabase.auth.updateUser({ password })
				if (authError) throw authError
				setMessage('Password updated. You can continue to your workspace.')
				navigate('/dashboard', { replace: true })
			}
		} catch (cause) {
			setError(errorMessage(cause))
		} finally {
			setBusy(false)
		}
	}
	async function completeOnboarding(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setBusy(true)
		setError(null)
		try {
			await saveProfile(selected)
			navigate('/dashboard', { replace: true })
		} catch (cause) {
			setError(`Cannot save your profile: ${errorMessage(cause)}`)
		} finally {
			setBusy(false)
		}
	}

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
					<h1 className="text-3xl font-semibold">{title}</h1>
					<p className="text-muted-foreground mt-3 text-sm leading-relaxed">
						{mode === 'onboarding'
							? 'Choose your perspective. Your workspace will be associated with your signed-in account.'
							: mode === 'welcome'
							? 'Organize your shift tasks, prepare handoff outlines, and reflect on learning goals in your account.'
							: 'Use your Planurse account to access your private workspace.'}
					</p>
					{!configured && (
						<div className="bg-muted my-6 rounded-lg border p-4 text-sm">
							<strong>Cloud service setup required.</strong>
							<p className="text-muted-foreground mt-1">
								Add your Supabase project URL and publishable key to a local{' '}
								<span className="font-medium">.env</span> file, apply the database migration, and reload. No demo
								workspace or browser-local account is available.
							</p>
						</div>
					)}
					{error && <div className="my-4"><ErrorState message={error} /></div>}
					{message && (
						<p role="status" className="bg-secondary my-4 rounded-lg p-4 text-sm">
							{message}
						</p>
					)}

					{mode === 'onboarding' ? (
						<form className="mt-6" onSubmit={completeOnboarding}>
							<fieldset className="space-y-3" disabled={busy || !configured}>
								<legend className="mb-3 text-sm font-semibold">
									I am using Planurse as a...
								</legend>
								{roleChoices.map((option) => (
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
							<Button
								type="submit"
								className="mt-6 h-12 w-full"
								disabled={busy || !configured}
							>
								{busy ? 'Saving…' : 'Save profile'}
								<ArrowRight aria-hidden="true" />
							</Button>
						</form>
					) : mode === 'welcome' ? (
						<div className="mt-6 grid gap-3 sm:grid-cols-2">
							<Button asChild className="h-12">
								<Link to="/signup">
									Create account
									<ArrowRight aria-hidden="true" />
								</Link>
							</Button>
							<Button asChild variant="outline" className="h-12">
								<Link to="/login">Sign in</Link>
							</Button>
						</div>
					) : (
						<form className="mt-6 space-y-4" onSubmit={submit}>
							{mode !== 'update-password' && (
								<div className="space-y-2">
									<label
										htmlFor="account-email"
										className="text-sm font-medium"
									>
										Email
									</label>
									<input
										id="account-email"
										type="email"
										autoComplete="email"
										required
										maxLength={254}
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-md border px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
										disabled={busy || !configured}
									/>
								</div>
							)}
							{mode !== 'forgot-password' && (
								<div className="space-y-2">
									<label
										htmlFor="account-password"
										className="text-sm font-medium"
									>
										{mode === 'update-password'
											? 'New password'
											: 'Password'}
									</label>
									<input
										id="account-password"
										type="password"
										autoComplete={
											mode === 'signup'
												? 'new-password'
												: mode === 'update-password'
												? 'new-password'
												: 'current-password'
										}
										required
										minLength={8}
										maxLength={128}
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-md border px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
										disabled={busy || !configured}
									/>
									<p className="text-muted-foreground text-xs">
										Use at least 8 characters.
									</p>
								</div>
							)}
							<Button
								type="submit"
								className="h-12 w-full"
								disabled={busy || !configured}
							>
								{busy
									? 'Please wait…'
									: mode === 'login'
									? 'Sign in'
									: mode === 'signup'
									? 'Create account'
									: mode === 'forgot-password'
									? 'Send reset link'
									: 'Update password'}
								<ArrowRight aria-hidden="true" />
							</Button>
							{mode === 'login' && (
								<p className="text-center text-sm">
									<Link
										className="text-primary underline"
										to="/forgot-password"
									>
										Forgot password?
									</Link>
								</p>
							)}
						</form>
					)}
					  {mode === 'login' && <p className="text-muted-foreground mt-5 text-center text-sm">New to Planurse? <Link className="text-primary underline" to="/signup">Create an account</Link></p>}
					  {mode === 'signup' && <p className="text-muted-foreground mt-5 text-center text-sm">Already have an account? <Link className="text-primary underline" to="/login">Sign in</Link></p>}
					  {mode === 'forgot-password' && <p className="text-muted-foreground mt-5 text-center text-sm"><Link className="text-primary underline" to="/login">Return to sign in</Link></p>}
				</CardContent>
			</Card>
			<SafetyNotice />
		</main>
	)
}
