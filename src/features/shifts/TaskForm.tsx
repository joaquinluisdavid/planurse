import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/NativeSelect'
import { ErrorState } from '@/components/Feedback'
import { useWorkspace } from '@/data/useWorkspace'
import type { Shift, Task } from '@/data/models'
import { taskFormSchema, type TaskFormValues } from './schemas'
import { saveTask } from './mutations'
import { localDateTime } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'

export function TaskForm({
  shift,
  task,
  close,
  restoreFocus,
}: {
  shift: Shift
  task?: Task
  close: () => void
  restoreFocus: (event: Event) => void
}) {
  const { update } = useWorkspace()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? '',
      patientLabel: task?.patientLabel ?? '',
      priority: task?.priority ?? 'routine',
      dueAt: task?.dueAt ? localDateTime(task.dueAt) : '',
    },
  })
  async function submit(values: TaskFormValues) {
    setError(null)
    try {
      const id = task?.id ?? crypto.randomUUID()
      await update((workspace) =>
        saveTask(workspace, shift.id, values, id, !!task),
      )
      toast.success(task ? 'Task updated.' : 'Task added.')
      close()
    } catch (cause) {
      setError(`Cannot save task: ${errorMessage(cause)}`)
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !form.formState.isSubmitting) close()
      }}
    >
      <DialogContent
        className="max-h-[90svh] overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={restoreFocus}
      >
        <DialogHeader>
          <DialogTitle>{task ? 'Edit task' : 'Add a task'}</DialogTitle>
          <DialogDescription>
            General workflow tasks only. Never enter names, diagnoses, medical
            record numbers, or other patient information.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task title</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder="e.g. Review orientation goals"
                      maxLength={120}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="patientLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fictional room</FormLabel>
                  <FormControl>
                    <NativeSelect {...field}>
                      <option value="">Shift-wide (no room)</option>
                      {shift.patientLabels.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormControl>
                  <FormDescription>
                    Only fictional room codes are available.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <NativeSelect {...field}>
                      <option value="routine">Routine</option>
                      <option value="important">Important</option>
                      <option value="urgent">Urgent</option>
                    </NativeSelect>
                  </FormControl>
                  <FormDescription>
                    Organizational priority, not clinical urgency or triage.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due date and time (optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>
                    Local time. Include the next date for overnight tasks.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <ErrorState message={error} />}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={close}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? 'Saving...'
                  : task
                    ? 'Save changes'
                    : 'Add task'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
