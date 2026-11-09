import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { NativeSelect } from '@/components/NativeSelect'
import {
  shiftFormSchema,
  type ShiftFormValues,
} from '@/features/shifts/schemas'
import { startShift } from '@/features/shifts/mutations'
import { useWorkspace } from '@/data/useWorkspace'
import { useAuth } from '@/auth/useAuth'
import { localDate } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'

export default function NewShiftPage() {
  const { data, loading, error, reload, update } = useWorkspace()
  const { user } = useAuth()
  const [saveError, setSaveError] = useState<string | null>(null)
  const navigate = useNavigate()
  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: { type: 'day', date: localDate() },
  })
  async function submit(values: ShiftFormValues) {
    setSaveError(null)
    if (values.date > localDate()) {
      form.setError('date', { message: 'Choose today or an earlier date.' })
      return
    }
    try {
      const id = crypto.randomUUID()
      await update((workspace) => startShift(workspace, values, id, new Date(), user?.id))
      toast.success('Shift started.')
      navigate(`/shifts/${id}`)
    } catch (cause) {
      setSaveError(`Cannot start shift: ${errorMessage(cause)}`)
    }
  }
  if (loading) return <LoadingState />
  if (error || !data)
    return (
      <ErrorState message={error ?? 'Workspace unavailable.'} retry={reload} />
    )
  const active = data.shifts.find((shift) => !shift.endedAt)
  return (
    <>
      <PageHeader
        eyebrow="Shift planner"
        title="Start with a simple plan."
        description="Choose a shift type and date. Add room shorthand and general workflow tasks next."
      />
      {active ? (
        <Card className="max-w-xl shadow-none">
          <CardContent>
            <h2 className="font-semibold">You already have an active shift</h2>
            <p className="text-muted-foreground my-3 text-sm">
              End it before starting another. This keeps your task list focused.
            </p>
            <Button asChild className="h-11">
              <Link to={`/shifts/${active.id}`}>Open current shift</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-xl shadow-none">
          <CardContent>
            <Form {...form}>
              <form className="space-y-5" onSubmit={form.handleSubmit(submit)}>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift type</FormLabel>
                      <FormControl>
                        <NativeSelect {...field}>
                          <option value="day">Day</option>
                          <option value="evening">Evening</option>
                          <option value="night">Night</option>
                        </NativeSelect>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift date</FormLabel>
                      <FormControl>
                        <Input type="date" max={localDate()} {...field} />
                      </FormControl>
                      <FormDescription>
                        Use the starting date for an overnight shift. A shift
                        starts when you save this form.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {saveError && <ErrorState message={saveError} />}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="h-11"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? 'Starting...'
                      : 'Start shift'}
                  </Button>
                  <Button asChild variant="outline" className="h-11">
                    <Link to="/shifts">Cancel</Link>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </>
  )
}
