import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState } from '@/components/Feedback'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth, type UserRole } from '@/auth/useAuth'
import { errorMessage } from '@/lib/errors'

export default function ProfilePage() {
  const { user, profile, saveProfile, uploadAvatar, removeAvatar } = useAuth()
  const fileInput = useRef<HTMLInputElement>(null)
  const [firstName, setFirstName] = useState(profile?.firstName ?? '')
  const [lastName, setLastName] = useState(profile?.lastName ?? '')
  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [position, setPosition] = useState(profile?.position ?? '')
  const [role, setRole] = useState<UserRole>(
    profile?.role ?? 'registered-nurse',
  )
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [removingAvatar, setRemovingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayName =
    nickname.trim() || firstName.trim() || user?.email || 'Your profile'
  const initials =
    `${firstName.trim()[0] ?? ''}${lastName.trim()[0] ?? ''}`.toUpperCase() ||
    'U'

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await saveProfile({ role, firstName, lastName, nickname, position })
      toast.success('Profile saved.')
    } catch (cause) {
      setError(`Cannot save your profile: ${errorMessage(cause)}`)
    } finally {
      setSaving(false)
    }
  }

  async function onChoosePicture(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      await uploadAvatar(file)
      toast.success('Profile picture updated.')
    } catch (cause) {
      setError(`Cannot upload profile picture: ${errorMessage(cause)}`)
    } finally {
      setUploading(false)
    }
  }

  async function onRemovePicture() {
    setRemovingAvatar(true)
    setError(null)
    try {
      await removeAvatar()
      toast.success('Profile picture removed.')
    } catch (cause) {
      setError(`Cannot remove profile picture: ${errorMessage(cause)}`)
    } finally {
      setRemovingAvatar(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account · Personal details"
        title="My Profile"
        description="Choose how you appear in Planurse and keep your professional profile details up to date."
      />
      <div className="grid max-w-3xl gap-5">
        <Card className="shadow-none">
          <CardContent>
            <div className="flex flex-wrap items-center gap-5">
              <div className="group relative size-24 shrink-0">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  aria-label="Choose profile picture"
                  onChange={onChoosePicture}
                  disabled={uploading || removingAvatar}
                />
                <button
                  type="button"
                  className="focus-visible:ring-ring relative size-24 overflow-hidden rounded-full border focus-visible:ring-[3px] focus-visible:outline-none"
                  aria-label={
                    profile?.avatarUrl
                      ? 'Change profile picture'
                      : 'Add profile picture'
                  }
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading || removingAvatar}
                >
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="bg-secondary text-primary flex size-full items-center justify-center text-2xl font-semibold">
                      {initials}
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55 px-2 text-center text-xs font-medium text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                    {uploading
                      ? 'Uploading…'
                      : profile?.avatarUrl
                        ? 'Change photo'
                        : 'Add photo'}
                  </span>
                </button>
                {profile?.avatarPath && (
                  <button
                    type="button"
                    className="bg-background text-foreground hover:bg-destructive focus-visible:ring-ring absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full border shadow-sm transition-opacity hover:text-white focus-visible:ring-[3px] focus-visible:outline-none sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                    aria-label="Remove profile picture"
                    title="Remove profile picture"
                    onClick={onRemovePicture}
                    disabled={uploading || removingAvatar}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{displayName}</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {user?.email}
                </p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {removingAvatar
                    ? 'Removing picture…'
                    : 'JPG, PNG, or WebP · 2 MB maximum.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent>
            <form className="space-y-5" onSubmit={submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-first-name">First name</Label>
                  <input
                    id="profile-first-name"
                    required
                    maxLength={80}
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-last-name">Last name</Label>
                  <input
                    id="profile-last-name"
                    required
                    maxLength={80}
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-nickname">
                  Nickname{' '}
                  <span className="text-muted-foreground">
                    (display name, optional)
                  </span>
                </Label>
                <input
                  id="profile-nickname"
                  maxLength={60}
                  autoComplete="nickname"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
                  disabled={saving}
                />
                <p className="text-muted-foreground text-xs">
                  Your nickname appears in the workspace header. If blank, your
                  first name is used.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-role">Professional role</Label>
                  <select
                    id="profile-role"
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value as UserRole)
                    }
                    className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
                    disabled={saving}
                  >
                    <option value="registered-nurse">Registered Nurse</option>
                    <option value="student-nurse">Student Nurse</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-position">
                    Current position{' '}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <input
                    id="profile-position"
                    maxLength={100}
                    autoComplete="organization-title"
                    placeholder="e.g. Staff Nurse"
                    value={position}
                    onChange={(event) => setPosition(event.target.value)}
                    className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
                    disabled={saving}
                  />
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Avoid adding employer/unit-specific confidential information or
                any patient details.
              </p>
              {error && <ErrorState message={error} />}
              <div className="flex justify-end">
                <Button type="submit" className="h-11" disabled={saving}>
                  {saving ? 'Saving…' : 'Save profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
